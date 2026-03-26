import type { NotifyParams } from "@/lib/notify";
import type { JobDefinition } from "./types";

// ─── send-notification ──────────────────────────────────
//
// Wraps the notification DB insert. Replaces the direct insert
// in notify() when QUEUE_ENABLED=true.

export const sendNotificationJob: JobDefinition<NotifyParams> = {
  name: "send-notification",
  queue: "default",
  maxAttempts: 3,
  backoffSeconds: 5,
  timeoutSeconds: 10,

  async handle(payload, ctx) {
    console.log(ctx.logPrefix, `Notifying user ${payload.userId}: ${payload.title}`);

    // Dynamic import avoids coupling to a specific db singleton —
    // the standalone worker and Next.js app each resolve their own connection.
    const { db } = await import("@/db");
    const { notifications } = await import("@/db/schema");

    await db.insert(notifications).values({
      userId: payload.userId,
      organizationId: payload.orgId,
      type: payload.type,
      title: payload.title,
      message: payload.message || null,
      link: payload.link || null,
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      actorName: payload.actorName || null,
    });
  },
};
