import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, eventEditions, speakerApplications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, isRbacError } from "@/lib/rbac";
import { validateAgenda } from "@/lib/agenda-validator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  const ctx = await requirePermission(req, "session", "read");
  if (isRbacError(ctx)) return ctx;

  const { editionId } = await params;

  // Verify edition belongs to the user's org
  const edition = await db.query.eventEditions.findFirst({
    where: and(
      eq(eventEditions.id, editionId),
      eq(eventEditions.organizationId, ctx.orgId)
    ),
  });

  if (!edition) {
    return NextResponse.json({ error: "Edition not found" }, { status: 404 });
  }

  // Fetch all sessions for this edition with speaker and track relations
  const allSessions = await db.query.sessions.findMany({
    where: eq(sessions.editionId, editionId),
    with: { speaker: true, track: true },
  });

  // Fetch all speakers for this edition
  const allSpeakers = await db.query.speakerApplications.findMany({
    where: eq(speakerApplications.editionId, editionId),
    columns: { id: true, name: true, stage: true },
  });

  const issues = validateAgenda(
    allSessions,
    {
      gapMinutes: edition.agendaGapMinutes,
      startTime: edition.agendaStartTime ?? "09:00",
      endTime: edition.agendaEndTime ?? "18:00",
      startDate: edition.startDate,
      endDate: edition.endDate,
    },
    allSpeakers
  );

  return NextResponse.json({
    data: issues,
    summary: {
      total: issues.length,
      errors: issues.filter((i) => i.severity === "error").length,
      warnings: issues.filter((i) => i.severity === "warning").length,
    },
  });
}
