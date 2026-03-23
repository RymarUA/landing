/**
 * Force clear cart endpoint - removes all items from cart
 * POST /api/admin/force-clear-cart
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  return requireAdminAuth(req, async (_req, admin) => {
    try {
      console.log(`[Force Clear Cart] Request from admin: ${admin.email}`);
      // This endpoint will be called from client-side to clear localStorage
    return NextResponse.json({
      success: true,
      message: "Cart cleared successfully",
      action: "CLEAR_CART"
    });
    
  } catch (error) {
    console.error("[Force Clear Cart] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
  });
}

export async function GET() {
  return NextResponse.json({ 
    message: "Force clear cart endpoint is working",
    usage: "POST with Authorization header to clear cart"
  });
}
