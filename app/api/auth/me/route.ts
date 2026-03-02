/**
 * GET /api/auth/me
 * Returns the current logged-in user from the JWT cookie.
 * Response: { phone: string } | { error: "Unauthorized" }
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "../verify-otp/route";

export async function GET(req: NextRequest) {
  const token  = req.cookies.get("fhm_auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const payload = await verifyJwt(token, secret);

  if (!payload || typeof payload.phone !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ phone: payload.phone });
}
