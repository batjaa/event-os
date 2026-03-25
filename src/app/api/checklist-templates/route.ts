import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { checklistTemplates } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { requirePermission, isRbacError } from "@/lib/rbac";

// GET — list checklist templates for an edition + entity type
export async function GET(req: NextRequest) {
  const ctx = await requirePermission(req, "checklist", "read");
  if (isRbacError(ctx)) return ctx;

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");

  const conditions = [
    eq(checklistTemplates.editionId, ctx.editionId),
    eq(checklistTemplates.organizationId, ctx.orgId),
  ];

  if (entityType) {
    conditions.push(eq(checklistTemplates.entityType, entityType));
  }

  const templates = await db.query.checklistTemplates.findMany({
    where: and(...conditions),
    orderBy: asc(checklistTemplates.sortOrder),
  });

  return NextResponse.json({ data: templates });
}

// POST — create a new checklist template
export async function POST(req: NextRequest) {
  const ctx = await requirePermission(req, "checklist", "create");
  if (isRbacError(ctx)) return ctx;

  const body = await req.json();
  const { entityType, name, description, fieldKey, itemType, required, sortOrder, dueOffsetDays, reminderTemplate } = body;

  if (!entityType || !name || !itemType) {
    return NextResponse.json({ error: "entityType, name, and itemType are required" }, { status: 400 });
  }

  const validItemTypes = ["file_upload", "text_input", "link", "confirmation", "meeting"];
  if (!validItemTypes.includes(itemType)) {
    return NextResponse.json({ error: `itemType must be one of: ${validItemTypes.join(", ")}` }, { status: 400 });
  }

  const [template] = await db
    .insert(checklistTemplates)
    .values({
      editionId: ctx.editionId,
      organizationId: ctx.orgId,
      entityType,
      name,
      description: description || null,
      fieldKey: fieldKey || null,
      itemType,
      required: required !== false,
      sortOrder: sortOrder || 0,
      dueOffsetDays: dueOffsetDays || null,
      reminderTemplate: reminderTemplate || null,
    })
    .returning();

  return NextResponse.json({ data: template }, { status: 201 });
}
