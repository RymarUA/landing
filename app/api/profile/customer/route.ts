/**
 * GET /api/profile/customer
 *
 * Returns customer data from Sitniks CRM.
 * Requires authenticated user with sitniksCustomerId in JWT.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { getSitniksCustomer, getSitniksCustomerStats } from "@/lib/sitniks-customers";

export async function GET(req: NextRequest) {
  // Verify authentication
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

  // Check if user has Sitniks customer ID
  if (!payload.sitniksCustomerId) {
    return NextResponse.json({ 
      error: "Customer not linked to Sitniks",
      customer: null 
    }, { status: 200 });
  }

  try {
    // Get customer data from Sitniks
    const customer = await getSitniksCustomer(payload.sitniksCustomerId);
    
    if (!customer) {
      return NextResponse.json({ 
        error: "Customer not found in Sitniks",
        customer: null 
      }, { status: 200 });
    }

    // Try to get stats, but don't fail if they're not available
    let stats = null;
    try {
      stats = await getSitniksCustomerStats(payload.sitniksCustomerId);
    } catch (statsError) {
      console.warn("[profile/customer] Stats not available:", statsError);
      // Use default stats
      stats = {
        ordersCount: customer.ordersCount || 0,
        totalSpent: customer.totalSpent || 0,
        averageOrderValue: 0,
      };
    }

    // Combine customer data with statistics
    const customerWithStats = {
      ...customer,
      ...stats,
    };

    return NextResponse.json({ 
      customer: customerWithStats,
      stats 
    });
  } catch (error) {
    console.error("[profile/customer] Sitniks API error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch customer data",
      customer: null 
    }, { status: 200 });
  }
}
