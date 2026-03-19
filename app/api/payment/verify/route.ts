/**
 * app/api/payment/verify/route.ts
 * 
 * Verify payment status and update Sitniks order
 * Called from /checkout/success page to ensure order status is updated
 * even if webhook fails (e.g., test merchant accounts)
 * 
 * POST /api/payment/verify
 * Body: { orderReference: "10_p1234567890" }
 */

import { NextRequest, NextResponse } from "next/server";
import { checkWayForPayStatus } from "@/lib/wayforpay-status-check";
import { updateSitniksOrder } from "@/lib/sitniks-consolidated";

const PAID_STATUS_ID = process.env.SITNIKS_PAID_STATUS_ID ? Number(process.env.SITNIKS_PAID_STATUS_ID) : 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderReference } = body;
    
    if (!orderReference) {
      return NextResponse.json(
        { error: "orderReference is required" },
        { status: 400 }
      );
    }
    
    console.log(`[payment-verify] Verifying payment for order: ${orderReference}`);
    
    // Check payment status from WayForPay
    const statusInfo = await checkWayForPayStatus(orderReference);
    
    if (!statusInfo) {
      console.error(`[payment-verify] Failed to get status from WayForPay`);
      return NextResponse.json(
        { success: false, error: "Failed to verify payment status" },
        { status: 500 }
      );
    }
    
    console.log(`[payment-verify] Payment status: ${statusInfo.transactionStatus}`);
    
    // Extract original order number from payment attempt ID
    const originalOrderNumber = orderReference.includes('_p') 
      ? orderReference.split('_p')[0] 
      : orderReference;
    
    // Update Sitniks if payment is approved
    if (statusInfo.transactionStatus === "Approved") {
      console.log(`[payment-verify] Payment approved, updating Sitniks order ${originalOrderNumber}`);
      
      const updateResult = await updateSitniksOrder(
        originalOrderNumber, 
        "paid", 
        PAID_STATUS_ID > 0 ? PAID_STATUS_ID : undefined
      );
      
      if (updateResult) {
        console.log(`[payment-verify] ✅ Successfully updated order ${originalOrderNumber} to paid`);
      } else {
        console.error(`[payment-verify] ❌ Failed to update order ${originalOrderNumber}`);
      }
      
      return NextResponse.json({
        success: true,
        verified: true,
        orderNumber: originalOrderNumber,
        status: "paid",
        sitniksUpdated: updateResult
      });
    }
    
    // Payment not approved
    return NextResponse.json({
      success: true,
      verified: false,
      orderNumber: originalOrderNumber,
      status: statusInfo.transactionStatus
    });
    
  } catch (error) {
    console.error("[payment-verify] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
