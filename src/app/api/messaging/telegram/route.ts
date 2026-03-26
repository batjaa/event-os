import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messagingChannels } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, isRbacError } from "@/lib/rbac";
import { configureTelegram, addTelegramGroup, restartGateway, stopGateway, getOpenClawStatus } from "@/lib/openclaw";

// GET — get Telegram config + OpenClaw status
export async function GET(req: NextRequest) {
  const ctx = await requirePermission(req, "settings", "read");
  if (isRbacError(ctx)) return ctx;

  const channel = await db.query.messagingChannels.findFirst({
    where: and(
      eq(messagingChannels.organizationId, ctx.orgId),
      eq(messagingChannels.platform, "telegram")
    ),
  });

  const openclawStatus = getOpenClawStatus();

  if (!channel) {
    return NextResponse.json({ data: null, openclaw: openclawStatus });
  }

  return NextResponse.json({
    data: {
      id: channel.id,
      botUsername: channel.botUsername,
      groupChatId: channel.groupChatId,
      groupTitle: channel.groupTitle,
      enabled: channel.enabled,
      connectedAt: channel.connectedAt,
    },
    openclaw: openclawStatus,
  });
}

// POST — validate, detect, connect, disconnect
export async function POST(req: NextRequest) {
  const ctx = await requirePermission(req, "settings", "update");
  if (isRbacError(ctx)) return ctx;

  const body = await req.json();
  const { botToken, action } = body as { botToken?: string; action?: string };

  // Step 1: Validate bot token
  if (action === "validate" && botToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await res.json();
      if (!data.ok) {
        return NextResponse.json({ error: "Invalid bot token. Check with @BotFather." }, { status: 400 });
      }

      // Save to DB
      await db
        .insert(messagingChannels)
        .values({
          organizationId: ctx.orgId,
          platform: "telegram",
          botToken,
          botUsername: data.result.username,
          enabled: false,
        })
        .onConflictDoUpdate({
          target: [messagingChannels.organizationId, messagingChannels.platform],
          set: { botToken, botUsername: data.result.username },
        });

      // Configure OpenClaw with this token
      configureTelegram({
        botToken,
        botUsername: data.result.username,
        serviceToken: process.env.SERVICE_TOKEN || "",
        orgId: ctx.orgId,
        geminiApiKey: process.env.GEMINI_API_KEY,
        eventOsUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
      });

      return NextResponse.json({
        data: { botUsername: data.result.username, botName: data.result.first_name },
      });
    } catch {
      return NextResponse.json({ error: "Failed to validate token." }, { status: 502 });
    }
  }

  // Step 2: Detect group chats
  if (action === "detect-group") {
    const channel = await db.query.messagingChannels.findFirst({
      where: and(
        eq(messagingChannels.organizationId, ctx.orgId),
        eq(messagingChannels.platform, "telegram")
      ),
    });
    if (!channel?.botToken) {
      return NextResponse.json({ error: "Set up bot token first." }, { status: 400 });
    }

    // Need to stop OpenClaw polling briefly to use getUpdates
    stopGateway();
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const res = await fetch(`https://api.telegram.org/bot${channel.botToken}/getUpdates?limit=50`);
      const data = await res.json();

      const groups: { chatId: string; title: string }[] = [];
      const seen = new Set<string>();
      for (const update of data.result || []) {
        const chat = update.message?.chat || update.my_chat_member?.chat;
        if (chat && (chat.type === "group" || chat.type === "supergroup")) {
          const id = String(chat.id);
          if (!seen.has(id)) {
            seen.add(id);
            groups.push({ chatId: id, title: chat.title || "Unnamed group" });
          }
        }
      }

      return NextResponse.json({
        data: { groups },
        message: groups.length === 0
          ? "No groups found. Add the bot to a group, send a message, then try again."
          : undefined,
      });
    } catch {
      return NextResponse.json({ error: "Failed to contact Telegram." }, { status: 502 });
    }
  }

  // Step 3: Connect — save group, configure OpenClaw, start gateway
  if (action === "connect" && body.groupChatId) {
    await db
      .update(messagingChannels)
      .set({
        groupChatId: body.groupChatId,
        groupTitle: body.groupTitle || null,
        enabled: true,
        connectedAt: new Date(),
      })
      .where(and(
        eq(messagingChannels.organizationId, ctx.orgId),
        eq(messagingChannels.platform, "telegram")
      ));

    // Add group to OpenClaw config and start
    addTelegramGroup(body.groupChatId);
    const gwResult = restartGateway();

    return NextResponse.json({
      data: { connected: true },
      gateway: gwResult,
    });
  }

  // Step 4: Disconnect
  if (action === "disconnect") {
    stopGateway();

    await db
      .update(messagingChannels)
      .set({ enabled: false, connectedAt: null })
      .where(and(
        eq(messagingChannels.organizationId, ctx.orgId),
        eq(messagingChannels.platform, "telegram")
      ));

    return NextResponse.json({ data: { connected: false } });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
