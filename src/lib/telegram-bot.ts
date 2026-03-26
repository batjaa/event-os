import TelegramBot from "node-telegram-bot-api";
import { db } from "@/db";
import { messagingChannels, userPlatformLinks, users, userOrganizations, teamMembers, teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ─── Built-in Telegram Bot ────────────────────────────
//
// Lightweight Telegram integration that runs inside Next.js.
// No OpenClaw dependency. Polls Telegram for messages,
// identifies the sender, calls /api/agent/process internally.

let activeBots = new Map<string, TelegramBot>(); // orgId → bot instance

export async function startTelegramBot(orgId: string): Promise<{ ok: boolean; error?: string }> {
  // Already running?
  if (activeBots.has(orgId)) {
    return { ok: true };
  }

  // Load config from DB
  const channel = await db.query.messagingChannels.findFirst({
    where: and(
      eq(messagingChannels.organizationId, orgId),
      eq(messagingChannels.platform, "telegram"),
      eq(messagingChannels.enabled, true)
    ),
  });

  if (!channel?.botToken) {
    return { ok: false, error: "No Telegram bot configured" };
  }

  const bot = new TelegramBot(channel.botToken, { polling: true });
  activeBots.set(orgId, bot);

  const botUsername = channel.botUsername?.toLowerCase() || "";

  bot.on("message", async (msg) => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";

    // In groups, only respond when @mentioned
    if (isGroup) {
      const text = msg.text.toLowerCase();
      const mentioned = text.includes(`@${botUsername}`) || text.includes("@agent") || text.includes("@bot");
      if (!mentioned) return;
    }

    // Strip the @mention from the message
    let input = msg.text;
    if (botUsername) {
      input = input.replace(new RegExp(`@${botUsername}\\s*`, "gi"), "").trim();
    }
    input = input.replace(/@agent\s*/gi, "").replace(/@bot\s*/gi, "").trim();

    if (!input) return;

    const senderId = String(msg.from?.id || "");
    if (!senderId) return;

    try {
      // Acknowledge receipt with 👀 reaction
      bot.setMessageReaction(chatId, msg.message_id, { reaction: [{ type: "emoji", emoji: "👀" }] }).catch(() => {});

      // Identify the sender
      const identity = await identifyUser(senderId, orgId);

      if (!identity) {
        await bot.sendMessage(chatId, "I don't recognize you. Ask your event admin to link your Telegram account.", { reply_to_message_id: msg.message_id });
        return;
      }

      // Call our agent process internally
      const { getProvider } = await import("@/lib/agent");
      const { dispatch } = await import("@/lib/agent/dispatcher");
      const { sanitizeInput, isOffTopic } = await import("@/lib/agent/input-guard");
      const { getActiveIds } = await import("@/lib/queries");

      // Input guards
      const sanitized = sanitizeInput(input);
      if (sanitized.blocked) {
        await bot.sendMessage(chatId, sanitized.blockReason || "I can only help with event management.", { reply_to_message_id: msg.message_id });
        return;
      }

      const offTopic = isOffTopic(sanitized.sanitized);
      if (offTopic.offTopic) {
        await bot.sendMessage(chatId, offTopic.message || "I can only help with event management.", { reply_to_message_id: msg.message_id });
        return;
      }

      // Resolve edition
      const ids = await getActiveIds(orgId);
      const editionId = ids?.editionId || "";

      // Classify + dispatch
      const provider = getProvider();
      const intent = await provider.classify(sanitized.sanitized);
      const result = await dispatch(intent, {
        orgId,
        editionId,
        userId: identity.userId,
        userRole: identity.role,
        userName: identity.name,
      }, sanitized.sanitized);

      if (result.message) {
        await bot.sendMessage(chatId, result.message, {
          reply_to_message_id: msg.message_id,
          parse_mode: "Markdown",
        });
      }
    } catch (err) {
      console.error("Telegram bot error:", err);
      await bot.sendMessage(chatId, "Something went wrong. Please try again.", { reply_to_message_id: msg.message_id }).catch(() => {});
    }
  });

  bot.on("polling_error", (err) => {
    console.error("Telegram polling error:", err.message);
  });

  console.log(`Telegram bot started for org ${orgId} (@${channel.botUsername})`);
  return { ok: true };
}

export function stopTelegramBot(orgId: string) {
  const bot = activeBots.get(orgId);
  if (bot) {
    bot.stopPolling();
    activeBots.delete(orgId);
    console.log(`Telegram bot stopped for org ${orgId}`);
  }
}

// Identify a Telegram user → Event OS user
async function identifyUser(telegramId: string, orgId: string) {
  const link = await db
    .select({
      userId: userPlatformLinks.userId,
      userName: users.name,
      role: userOrganizations.role,
    })
    .from(userPlatformLinks)
    .innerJoin(users, eq(userPlatformLinks.userId, users.id))
    .innerJoin(userOrganizations, and(
      eq(userOrganizations.userId, users.id),
      eq(userOrganizations.organizationId, orgId)
    ))
    .where(and(
      eq(userPlatformLinks.platform, "telegram"),
      eq(userPlatformLinks.platformUserId, telegramId),
      eq(userPlatformLinks.organizationId, orgId)
    ))
    .limit(1);

  if (link.length === 0) return null;
  return { userId: link[0].userId, name: link[0].userName, role: link[0].role };
}
