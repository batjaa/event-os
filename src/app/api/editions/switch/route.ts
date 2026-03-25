import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { eventEditions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

const COOKIE_NAME = "event-os-edition";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userOrgId = (session.user as any).organizationId;

  const body = await req.json();
  const { editionId } = body;

  if (!editionId) {
    return NextResponse.json({ error: "editionId required" }, { status: 400 });
  }

  // Verify edition exists and belongs to user's org
  const edition = await db.query.eventEditions.findFirst({
    where: eq(eventEditions.id, editionId),
  });

  if (!edition || edition.organizationId !== userOrgId) {
    return NextResponse.json({ error: "Edition not found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, editionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return NextResponse.json({ data: { editionId } });
}
