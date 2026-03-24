import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entityNotes } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { getActiveIds } from "@/lib/queries";

// GET notes for an entity
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
  }

  const notes = await db.query.entityNotes.findMany({
    where: and(
      eq(entityNotes.entityType, entityType),
      eq(entityNotes.entityId, entityId)
    ),
    orderBy: asc(entityNotes.createdAt),
  });

  return NextResponse.json({ data: notes });
}

// POST a new note
export async function POST(req: NextRequest) {
  const ids = await getActiveIds();
  if (!ids) return NextResponse.json({ error: "No active edition" }, { status: 400 });

  const body = await req.json();
  const { entityType, entityId, content, authorName, authorEmail } = body;

  if (!entityType || !entityId || !content) {
    return NextResponse.json({ error: "entityType, entityId, and content required" }, { status: 400 });
  }

  const [note] = await db
    .insert(entityNotes)
    .values({
      entityType,
      entityId,
      organizationId: ids.orgId,
      authorName: authorName || "Organizer",
      authorEmail: authorEmail || null,
      content,
    })
    .returning();

  return NextResponse.json({ data: note }, { status: 201 });
}
