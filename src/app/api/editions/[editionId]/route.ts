import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventEditions, entityNotes, speakerApplications, sponsorApplications, venues, booths, volunteerApplications, mediaPartners } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requirePermission, isRbacError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  const { editionId } = await params;
  const ctx = await requirePermission(req, "edition", "read");
  if (isRbacError(ctx)) return ctx;

  const edition = await db.query.eventEditions.findFirst({
    where: and(
      eq(eventEditions.id, editionId),
      eq(eventEditions.organizationId, ctx.orgId)
    ),
  });

  if (!edition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: edition });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  const { editionId } = await params;
  const ctx = await requirePermission(req, "edition", "update");
  if (isRbacError(ctx)) return ctx;

  const edition = await db.query.eventEditions.findFirst({
    where: and(
      eq(eventEditions.id, editionId),
      eq(eventEditions.organizationId, ctx.orgId)
    ),
  });

  if (!edition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const allowedFields = [
    "name",
    "startDate",
    "endDate",
    "venue",
    "status",
    "cfpOpen",
    "timezone",
    "agendaGapMinutes",
    "agendaStartTime",
    "agendaEndTime",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if ((field === "startDate" || field === "endDate") && body[field]) {
        updates[field] = new Date(body[field]);
      } else {
        updates[field] = body[field];
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(eventEditions)
    .set({
      ...updates,
      version: sql`${eventEditions.version} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(eventEditions.id, editionId),
        eq(eventEditions.version, edition.version)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      {
        error: "Conflict — record was modified",
        currentVersion: edition.version,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  const { editionId } = await params;
  const ctx = await requirePermission(req, "edition", "delete");
  if (isRbacError(ctx)) return ctx;

  // Clean up entityNotes (no FK to entities, would become orphaned)
  // Collect all entity IDs belonging to this edition, then delete their notes
  try {
    const entityTables = [
      { table: speakerApplications, type: "speaker" },
      { table: sponsorApplications, type: "sponsor" },
      { table: venues, type: "venue" },
      { table: booths, type: "booth" },
      { table: volunteerApplications, type: "volunteer" },
      { table: mediaPartners, type: "media" },
    ];
    for (const { table, type } of entityTables) {
      const ids = await db.select({ id: table.id }).from(table).where(eq(table.editionId, editionId));
      if (ids.length > 0) {
        await db.delete(entityNotes).where(
          and(
            eq(entityNotes.entityType, type),
            inArray(entityNotes.entityId, ids.map((r: { id: string }) => r.id))
          )
        );
      }
    }
  } catch {} // best-effort cleanup — cascade handles the critical data

  // Delete the edition — all child tables cascade
  const [deleted] = await db
    .delete(eventEditions)
    .where(
      and(
        eq(eventEditions.id, editionId),
        eq(eventEditions.organizationId, ctx.orgId)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { id: editionId } });
}
