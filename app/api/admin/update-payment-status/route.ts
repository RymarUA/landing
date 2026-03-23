/**
 * API endpoint for manually updating payment status
 * POST /api/admin/update-payment-status
 * 
 * This can be used when webhooks don't work properly
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusManually } from "@/lib/wayforpay-status-check";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  return requireAdminAuth(req, async (_req, admin) => {
    try {
      console.log(`[Manual Update] Request from admin: ${admin.email}`);
      const body = await _req.json();
    const { orderReference } = body;
    
    if (!orderReference) {
      return NextResponse.json({ error: "orderReference is required" }, { status: 400 });
    }
    
    console.log(`[Manual Update] Requested status update for order: ${orderReference}`);
    
    const success = await updateOrderStatusManually(orderReference);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "Payment status updated successfully" 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to update payment status" 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("[Manual Update] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
  });
}

export async function GET(_req: NextRequest) {
  // Simple health check
  return NextResponse.json({ 
    message: "Payment status update endpoint is working",
    usage: "POST with { orderReference: 'ORDER-123' } and Authorization header"
  });
}
