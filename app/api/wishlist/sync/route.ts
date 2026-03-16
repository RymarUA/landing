/**
 * POST /api/wishlist/sync
 *
 * Sync wishlist with Sitniks CRM.
 * Requires authenticated user.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { syncWishlistToSitniks } from "@/lib/wishlist-sync";

export async function POST(req: NextRequest) {
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

  // Allow sync even without sitniksCustomerId for testing
  const customerId = payload.sitniksCustomerId || null;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productIds, products } = body;

  if (!Array.isArray(productIds)) {
    return NextResponse.json({ error: "productIds must be an array" }, { status: 400 });
  }

  try {
    const result = await syncWishlistToSitniks(
      customerId,
      productIds,
      products
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/wishlist/sync]", error);
    return NextResponse.json({ 
      success: false, 
      synced: 0,
      errors: ["Internal error"] 
    }, { status: 500 });
  }
}
