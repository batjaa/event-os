import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messagingChannels } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, isRbacError } from "@/lib/rbac";
import { configureDiscord, restartGateway, stopGateway, getOpenClawStatus } from "@/lib/openclaw";

// GET — get Discord config + OpenClaw status
export async function GET(req: NextRequest) {
  const ctx = await requirePermission(req, "settings", "read");
  if (isRbacError(ctx)) return ctx;

  const channel = await db.query.messagingChannels.findFirst({
    where: and(
      eq(messagingChannels.organizationId, ctx.orgId),
      eq(messagingChannels.platform, "discord")
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
      groupChatId: channel.groupChatId, // server ID for Discord
      groupTitle: channel.groupTitle,    // server name
      enabled: channel.enabled,
      connectedAt: channel.connectedAt,
    },
    openclaw: openclawStatus,
  });
}

// POST — validate, connect, disconnect
export async function POST(req: NextRequest) {
  const ctx = await requirePermission(req, "settings", "update");
  if (isRbacError(ctx)) return ctx;

  const body = await req.json();
  const { botToken, action } = body as { botToken?: string; action?: string };

  // Step 1: Validate bot token via Discord API
  if (action === "validate" && botToken) {
    try {
      const res = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${botToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.id) {
        return NextResponse.json({ error: "Invalid bot token. Check the Discord Developer Portal." }, { status: 400 });
      }

      // Save to DB
      await db
        .insert(messagingChannels)
        .values({
          organizationId: ctx.orgId,
          platform: "discord",
          botToken,
          botUsername: data.username,
          enabled: false,
        })
        .onConflictDoUpdate({
          target: [messagingChannels.organizationId, messagingChannels.platform],
          set: { botToken, botUsername: data.username },
        });

      return NextResponse.json({
        data: { username: data.username, id: data.id },
      });
    } catch {
      return NextResponse.json({ error: "Failed to validate token." }, { status: 502 });
    }
  }

  // Step 2: Connect — save server ID, configure OpenClaw, start gateway
  if (action === "connect" && body.serverId) {
    const channel = await db.query.messagingChannels.findFirst({
      where: and(
        eq(messagingChannels.organizationId, ctx.orgId),
        eq(messagingChannels.platform, "discord")
      ),
    });

    if (!channel?.botToken) {
      return NextResponse.json({ error: "Set up bot token first." }, { status: 400 });
    }

    // Try to get server name via Discord API
    let serverName = "Discord server";
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${body.serverId}`, {
        headers: { Authorization: `Bot ${channel.botToken}` },
      });
      const data = await res.json();
      if (data.name) serverName = data.name;
    } catch {}

    await db
      .update(messagingChannels)
      .set({
        groupChatId: body.serverId,
        groupTitle: serverName,
        enabled: true,
        connectedAt: new Date(),
      })
      .where(eq(messagingChannels.id, channel.id));

    // Configure OpenClaw
    configureDiscord({
      botToken: channel.botToken,
      botUsername: channel.botUsername || "event-os",
      serverId: body.serverId,
      serviceToken: process.env.SERVICE_TOKEN || "",
      orgId: ctx.orgId,
      geminiApiKey: process.env.GEMINI_API_KEY,
      eventOsUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
    });

    const gwResult = restartGateway();
    return NextResponse.json({ data: { connected: true, serverName }, gateway: gwResult });
  }

  // Step 3: Disconnect
  if (action === "disconnect") {
    stopGateway();

    await db
      .update(messagingChannels)
      .set({ enabled: false, connectedAt: null })
      .where(and(
        eq(messagingChannels.organizationId, ctx.orgId),
        eq(messagingChannels.platform, "discord")
      ));

    return NextResponse.json({ data: { connected: false } });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
