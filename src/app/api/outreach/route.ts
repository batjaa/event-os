import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outreach } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getActiveIds } from "@/lib/queries";

export async function GET() {
  const ids = await getActiveIds();
  if (!ids) return NextResponse.json({ data: [] });

  const rows = await db.query.outreach.findMany({
    where: eq(outreach.editionId, ids.editionId),
    orderBy: desc(outreach.createdAt),
  });

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const ids = await getActiveIds();
  if (!ids) return NextResponse.json({ error: "No active edition" }, { status: 400 });

  const body = await req.json();
  const { name, targetType, email, company, role, source, assignedTo, notes } = body;

  if (!name || !targetType) {
    return NextResponse.json(
      { error: "name and targetType are required" },
      { status: 400 }
    );
  }

  const [lead] = await db
    .insert(outreach)
    .values({
      editionId: ids.editionId,
      organizationId: ids.orgId,
      name,
      targetType,
      email: email || null,
      company: company || null,
      role: role || null,
      source: source || null,
      assignedTo: assignedTo || null,
      notes: notes || null,
    })
    .returning();

  return NextResponse.json({ data: lead }, { status: 201 });
}
