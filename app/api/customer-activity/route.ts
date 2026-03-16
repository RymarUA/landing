/**
 * GET /api/customer-activity?id=4769814
 * 
 * Get customer activity from Sitniks CRM
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCustomerActivity } from "@/lib/sitniks-custom-fields";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("id");
    
    console.log("[api/customer-activity] Request for customer:", customerId);
    
    if (!customerId) {
      return NextResponse.json({ error: "Customer ID required" }, { status: 400 });
    }

    const activity = await getCustomerActivity(parseInt(customerId));
    console.log("[api/customer-activity] Returning activity:", activity);
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error("[api/customer-activity] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
