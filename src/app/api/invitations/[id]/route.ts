import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getApiContext } from "@/lib/api-utils";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getApiContext(req);
  if (ctx instanceof NextResponse) return ctx;

  const [deleted] = await db
    .delete(invitations)
    .where(
      and(
        eq(invitations.id, id),
        eq(invitations.organizationId, ctx.organizationId)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { id } });
}
