/**
 * GET /api/auth/me
 *
 * Returns current user from JWT cookie fhm_auth. Response: { email?, phone? } or 401.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("fhm_auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const payload = await verifyJwt(token, secret);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return user data - email and/or phone
  const userData: { email?: string; phone?: string } = {};
  if (typeof payload.email === "string") userData.email = payload.email;
  if (typeof payload.phone === "string") userData.phone = payload.phone;

  return NextResponse.json(userData);
}

