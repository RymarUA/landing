/**
 * GET /api/analytics/recommendations
 *
 * Get personalized product recommendations based on customer behavior.
 * Requires authenticated user.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { getPersonalizedRecommendations } from "@/lib/customer-analytics";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("fhm_auth")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyJwt(token, process.env.JWT_SECRET ?? "dev-secret-change-in-production");
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!payload.sitniksCustomerId) {
    return NextResponse.json({ recommendations: [] }, { status: 200 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");

  try {
    const recommendations = await getPersonalizedRecommendations(
      payload.sitniksCustomerId,
      limit
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("[api/analytics/recommendations]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
