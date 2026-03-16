/**
 * POST /api/analytics/track-view
 *
 * Track product view for analytics and personalization.
 * Requires authenticated user.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { trackProductView } from "@/lib/customer-analytics";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("fhm_auth")?.value;
  
  let customerId: number | null = null;
  
  // Try to get customer ID from token if authenticated
  if (token) {
    try {
      const payload = await verifyJwt(token, process.env.JWT_SECRET ?? "dev-secret-change-in-production");
      customerId = (payload as any)?.sitniksCustomerId || null;
    } catch {
      // Invalid token - continue without customer ID
      console.debug("[track-view] Invalid token, tracking anonymously");
    }
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, productName, category, price, source } = body;

  if (!productId || !productName || !category || price === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const success = await trackProductView({
      customerId,
      productId,
      productName,
      category,
      price,
      source,
    });

    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  } catch (error) {
    console.error("[api/analytics/track-view]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
