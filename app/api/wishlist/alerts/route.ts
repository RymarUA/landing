/**
 * GET /api/wishlist/alerts
 *
 * Get wishlist alerts (price drops, back in stock).
 * Requires authenticated user.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { getWishlistPriceDrops, getWishlistBackInStock } from "@/lib/wishlist-sync";

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

  // Allow alerts even without sitniksCustomerId for testing
  const customerId = payload.sitniksCustomerId || null;

  try {
    const [priceDrops, backInStock] = await Promise.all([
      getWishlistPriceDrops(customerId),
      getWishlistBackInStock(customerId),
    ]);

    return NextResponse.json({ priceDrops, backInStock });
  } catch (error) {
    console.error("[api/wishlist/alerts]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
