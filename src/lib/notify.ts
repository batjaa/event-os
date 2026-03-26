import { db } from "@/db";
import { notifications } from "@/db/schema";

export type NotifyParams = {
  userId: string;
  orgId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  entityType?: string;
  entityId?: string;
  actorName?: string;
};

/**
 * Create a notification for a user.
 * Call this from any API route or handler — it's a simple DB insert.
 * Never throws — logs errors and returns silently.
 *
 * When QUEUE_ENABLED=true, dispatches to the job queue instead
 * of inserting directly. Same signature, same fire-and-forget semantics.
 */
export async function notify(params: NotifyParams): Promise<void> {
  try {
    if (process.env.QUEUE_ENABLED === "true") {
      const { dispatch, sendNotificationJob } = await import("@/lib/queue");
      await dispatch(sendNotificationJob, params, {
        organizationId: params.orgId,
      });
      return;
    }

    await db.insert(notifications).values({
      userId: params.userId,
      organizationId: params.orgId,
      type: params.type,
      title: params.title,
      message: params.message || null,
      link: params.link || null,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      actorName: params.actorName || null,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Notify multiple users at once.
 *
 * When QUEUE_ENABLED=true, uses dispatchMany() for a single
 * bulk INSERT instead of N individual inserts.
 */
export async function notifyMany(
  userIds: string[],
  params: Omit<NotifyParams, "userId">
): Promise<void> {
  try {
    if (process.env.QUEUE_ENABLED === "true") {
      const { dispatchMany, sendNotificationJob } = await import(
        "@/lib/queue"
      );
      await dispatchMany(
        sendNotificationJob,
        userIds.map((userId) => ({
          payload: { ...params, userId },
          organizationId: params.orgId,
        }))
      );
      return;
    }

    for (const userId of userIds) {
      await notify({ ...params, userId });
    }
  } catch (error) {
    console.error("Failed to create notifications:", error);
  }
}
