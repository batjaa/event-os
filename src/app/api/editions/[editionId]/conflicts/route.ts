import { NextRequest, NextResponse } from "next/server";
import { getApiContext } from "@/lib/api-utils";
import { detectConflicts } from "@/lib/conflicts";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
  const { editionId } = await params;
  const ctx = await getApiContext(req);
  if (ctx instanceof NextResponse) return ctx;

  const conflicts = await detectConflicts(editionId);

  return NextResponse.json({ data: conflicts });
}
