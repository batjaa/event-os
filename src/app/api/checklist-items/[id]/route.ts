import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requirePermission, isRbacError } from "@/lib/rbac";

// PATCH — update checklist item (submit value, approve, reject, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth first with generic entity type, then verify org ownership
  const ctx = await requirePermission(req, "checklist", "update");
  if (isRbacError(ctx)) return ctx;

  // Look up item — scoped to user's org
  const item = await db.query.checklistItems.findFirst({
    where: and(eq(checklistItems.id, id), eq(checklistItems.organizationId, ctx.orgId)),
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  // Status transitions
  if (body.status) {
    const validStatuses = ["pending", "submitted", "approved", "needs_revision"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;

    if (body.status === "submitted") {
      updates.submittedAt = new Date();
    }
    if (body.status === "approved") {
      updates.approvedBy = ctx.user.id;
      updates.approvedAt = new Date();
    }
    if (body.status === "needs_revision") {
      updates.approvedBy = null;
      updates.approvedAt = null;
    }
  }

  // Value (file URL, text content, etc.)
  if (body.value !== undefined) {
    updates.value = body.value;
  }

  // Organizer notes
  if (body.notes !== undefined) {
    updates.notes = body.notes;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(checklistItems)
    .set({
      ...updates,
      version: sql`${checklistItems.version} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(checklistItems.id, id), eq(checklistItems.organizationId, ctx.orgId)))
    .returning();

  return NextResponse.json({ data: updated });
}
