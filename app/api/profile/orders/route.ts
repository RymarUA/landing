/**
 * GET /api/profile/orders
 *
 * Returns orders for the current user (JWT cookie fhm_auth).
 * Response: { orders: Order[] } or 401.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { getSitniksOrdersByPhone } from "@/lib/sitniks-consolidated";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("fhm_auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const payload = await verifyJwt(token, secret);

  if (!payload || typeof payload.phone !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getSitniksOrdersByPhone(payload.phone);
  return NextResponse.json({ orders });
}

