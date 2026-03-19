/**
 * Force clear cart endpoint - removes all items from cart
 * POST /api/admin/force-clear-cart
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const authHeader = req.headers.get("Authorization");
    
    if (!adminPassword || !authHeader || !authHeader.includes(`Bearer ${adminPassword}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
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
}

export async function GET() {
  return NextResponse.json({ 
    message: "Force clear cart endpoint is working",
    usage: "POST with Authorization header to clear cart"
  });
}
