import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateServiceToken } from "@/lib/service-token";

export type ApiContext = {
  organizationId: string;
  userId?: string;
  source: "web" | "api";
};

export async function getApiContext(
  req: NextRequest
): Promise<ApiContext | NextResponse> {
  // Check service token first (for OpenClaw/Telegram agent)
  if (validateServiceToken(req)) {
    const orgId = req.headers.get("x-organization-id");
    if (!orgId) {
      return NextResponse.json(
        { error: "x-organization-id header required for service token auth" },
        { status: 400 }
      );
    }
    return { organizationId: orgId, source: "api" };
  }

  // In development, fall back to active edition for unauthenticated requests
  if (process.env.NODE_ENV === "development") {
    const { getActiveIds } = await import("@/lib/queries");
    const ids = await getActiveIds();
    if (ids) {
      return { organizationId: ids.orgId, source: "web" as const };
    }
  }

  // Fall back to session auth (for web app)
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as Record<string, unknown>;
  if (!user.organizationId) {
    return NextResponse.json(
      { error: "No organization associated" },
      { status: 403 }
    );
  }

  return {
    organizationId: user.organizationId as string,
    userId: user.id as string,
    source: "web",
  };
}

export function checkVersion(
  ifMatch: string | null,
  currentVersion: number
): NextResponse | null {
  if (ifMatch !== null) {
    const requestedVersion = parseInt(ifMatch, 10);
    if (isNaN(requestedVersion) || requestedVersion !== currentVersion) {
      return NextResponse.json(
        {
          error: "Conflict",
          message:
            "This record was modified by someone else. Please refresh and try again.",
          currentVersion,
        },
        { status: 409 }
      );
    }
  }
  return null;
}

export function paginationParams(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "50", 10),
    200
  );
  const cursor = url.searchParams.get("cursor") || undefined;
  return { limit, cursor };
}
