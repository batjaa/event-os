import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, checklistItems, checklistTemplates, eventEditions } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

// GET — stakeholder portal data (their entity + checklist + event info)
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = session.user as Record<string, unknown>;
  const userId = sessionUser.id as string;

  // Look up user with linked entity info
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || user.role !== "stakeholder" || !user.linkedEntityType || !user.linkedEntityId) {
    return NextResponse.json({ error: "Not a stakeholder account" }, { status: 403 });
  }

  // Look up the linked entity
  const entityQueryMap: Record<string, string> = {
    speaker: "speakerApplications",
    sponsor: "sponsorApplications",
    venue: "venues",
    booth: "booths",
    volunteer: "volunteerApplications",
    media: "mediaPartners",
  };

  const queryName = entityQueryMap[user.linkedEntityType];
  if (!queryName) {
    return NextResponse.json({ error: "Unknown entity type" }, { status: 400 });
  }

  // Dynamic query based on entity type
  const entity = await (db.query as Record<string, any>)[queryName].findFirst({
    where: (t: any, { eq: eqFn }: any) => eqFn(t.id, user.linkedEntityId),
  });

  if (!entity) {
    return NextResponse.json({ error: "Linked entity not found" }, { status: 404 });
  }

  // Get edition info
  const edition = await db.query.eventEditions.findFirst({
    where: eq(eventEditions.id, entity.editionId),
  });

  // Get checklist items with template info
  const items = await db
    .select({
      id: checklistItems.id,
      name: checklistTemplates.name,
      description: checklistTemplates.description,
      itemType: checklistTemplates.itemType,
      required: checklistTemplates.required,
      fieldKey: checklistTemplates.fieldKey,
      status: checklistItems.status,
      value: checklistItems.value,
      notes: checklistItems.notes,
    })
    .from(checklistItems)
    .innerJoin(checklistTemplates, eq(checklistItems.templateId, checklistTemplates.id))
    .where(
      and(
        eq(checklistItems.entityType, user.linkedEntityType),
        eq(checklistItems.entityId, user.linkedEntityId!)
      )
    )
    .orderBy(asc(checklistTemplates.sortOrder));

  return NextResponse.json({
    data: {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        linkedEntityType: user.linkedEntityType,
        linkedEntityId: user.linkedEntityId,
      },
      entity,
      edition: edition ? {
        name: edition.name,
        startDate: edition.startDate,
        endDate: edition.endDate,
        venue: edition.venue,
      } : null,
      checklistItems: items,
    },
  });
}
