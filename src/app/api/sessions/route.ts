import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getApiContext, paginationParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const ctx = await getApiContext(req);
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const editionId = url.searchParams.get("editionId");
  const day = url.searchParams.get("day");
  const { limit } = paginationParams(req);

  if (!editionId) {
    return NextResponse.json({ error: "editionId required" }, { status: 400 });
  }

  const conditions = [
    eq(sessions.editionId, editionId),
    eq(sessions.organizationId, ctx.organizationId),
  ];

  if (day) {
    conditions.push(eq(sessions.day, parseInt(day, 10)));
  }

  const result = await db.query.sessions.findMany({
    where: and(...conditions),
    with: { speaker: true, track: true },
    orderBy: [asc(sessions.day), asc(sessions.startTime), asc(sessions.sortOrder)],
    limit,
  });

  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const ctx = await getApiContext(req);
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const { editionId, trackId, speakerId, title, description, type, startTime, endTime, room, day } = body;

  if (!editionId || !title) {
    return NextResponse.json(
      { error: "editionId and title are required" },
      { status: 400 }
    );
  }

  const [session] = await db
    .insert(sessions)
    .values({
      editionId,
      organizationId: ctx.organizationId,
      trackId: trackId || null,
      speakerId: speakerId || null,
      title,
      description: description || null,
      type: type || "talk",
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      room: room || null,
      day: day || 1,
    })
    .returning();

  return NextResponse.json({ data: session }, { status: 201 });
}
