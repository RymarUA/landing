/**
 * GET /api/notifications/alerts
 *
 * Get all pending notifications for customer.
 * Requires authenticated user.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { 
  getPriceDropAlerts,
  getBackInStockAlerts,
  getNewArrivalAlerts 
} from "@/lib/product-notifications";

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
    const [priceDrops, backInStock, newArrivals] = await Promise.all([
      getPriceDropAlerts(customerId),
      getBackInStockAlerts(customerId),
      getNewArrivalAlerts(customerId),
    ]);

    const total = priceDrops.length + backInStock.length + newArrivals.length;

    return NextResponse.json({ 
      priceDrops, 
      backInStock, 
      newArrivals,
      total 
    });
  } catch (error) {
    console.error("[api/notifications/alerts]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
