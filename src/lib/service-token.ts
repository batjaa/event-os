import { NextRequest, NextResponse } from "next/server";

const SERVICE_TOKEN = process.env.SERVICE_TOKEN;

const ALLOWED_ROUTES = [
  "/api/speakers",
  "/api/sessions",
  "/api/check-in",
  "/api/event-queue",
];

export function validateServiceToken(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return token === SERVICE_TOKEN;
}

export function isServiceTokenRoute(pathname: string): boolean {
  return ALLOWED_ROUTES.some((route) => pathname.startsWith(route));
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
