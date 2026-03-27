import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { requirePermission, isRbacError } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  const { editionId } = await params;
  const ctx = await requirePermission(req, "edition", "delete");
  if (isRbacError(ctx)) return ctx;

  const tables = [
    { key: "speakers", label: "Speakers", table: schema.speakerApplications },
    { key: "sponsors", label: "Sponsors", table: schema.sponsorApplications },
    { key: "sessions", label: "Agenda sessions", table: schema.sessions },
    { key: "tracks", label: "Tracks", table: schema.tracks },
    { key: "attendees", label: "Attendees", table: schema.attendees },
    { key: "venues", label: "Venues", table: schema.venues },
    { key: "booths", label: "Booths", table: schema.booths },
    { key: "volunteers", label: "Volunteers", table: schema.volunteerApplications },
    { key: "media", label: "Media partners", table: schema.mediaPartners },
    { key: "tasks", label: "Tasks", table: schema.tasks },
    { key: "campaigns", label: "Campaigns", table: schema.campaigns },
    { key: "invitations", label: "Invitations", table: schema.invitations },
    { key: "outreach", label: "Outreach records", table: schema.outreach },
    { key: "checklists", label: "Checklist templates", table: schema.checklistTemplates },
    { key: "checklistItems", label: "Checklist items", table: schema.checklistItems },
  ];

  const counts = await Promise.all(
    tables.map(async ({ key, label, table }) => {
      const [result] = await db.select({ c: count() }).from(table).where(eq(table.editionId, editionId));
      return { key, label, count: Number(result.c) };
    })
  );

  const items = counts.filter((c) => c.count > 0);
  const total = items.reduce((sum, c) => sum + c.count, 0);

  return NextResponse.json({ data: { items, total } });
}
