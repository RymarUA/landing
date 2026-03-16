/**
 * POST /api/notifications/subscribe
 *
 * Subscribe to product notifications (price drops, back in stock, new arrivals).
 * Requires authenticated user.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { 
  subscribeToPriceDrops, 
  subscribeToBackInStock,
  subscribeToNewArrivals 
} from "@/lib/product-notifications";

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

  // Allow notifications even without sitniksCustomerId for testing
  const customerId = payload.sitniksCustomerId || null;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, productId, currentPrice, categories } = body;

  if (!type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  try {
    let success = false;

    switch (type) {
      case 'price-drop':
        if (!productId || currentPrice === undefined) {
          return NextResponse.json({ error: "productId and currentPrice required" }, { status: 400 });
        }
        success = await subscribeToPriceDrops(customerId, productId, currentPrice);
        break;

      case 'back-in-stock':
        if (!productId) {
          return NextResponse.json({ error: "productId required" }, { status: 400 });
        }
        success = await subscribeToBackInStock(customerId, productId);
        break;

      case 'new-arrivals':
        if (!Array.isArray(categories) || categories.length === 0) {
          return NextResponse.json({ error: "categories array required" }, { status: 400 });
        }
        success = await subscribeToNewArrivals(customerId, categories);
        break;

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  } catch (error) {
    console.error("[api/notifications/subscribe]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
