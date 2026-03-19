/**
 * app/api/admin/check-payment/route.ts
 * 
 * Manual endpoint to check WayForPay payment status and update Sitniks order
 * Use this when webhooks don't work (e.g., test merchant accounts)
 * 
 * POST /api/admin/check-payment
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
    
    console.log(`[check-payment] Checking status for order: ${orderReference}`);
    
    // Check payment status from WayForPay
    const statusInfo = await checkWayForPayStatus(orderReference);
    
    if (!statusInfo) {
      return NextResponse.json(
        { error: "Failed to get payment status from WayForPay" },
        { status: 500 }
      );
    }
    
    console.log(`[check-payment] WayForPay status:`, statusInfo);
    
    // Extract original order number from payment attempt ID
    // Format: 10_p1234567890 → 10
    const originalOrderNumber = orderReference.includes('_p') 
      ? orderReference.split('_p')[0] 
      : orderReference;
    
    console.log(`[check-payment] Original order number: ${originalOrderNumber}`);
    
    // Update Sitniks based on payment status
    let updateResult = false;
    let action = "none";
    
    if (statusInfo.transactionStatus === "Approved") {
      action = "paid";
      updateResult = await updateSitniksOrder(
        originalOrderNumber, 
        "paid", 
        PAID_STATUS_ID > 0 ? PAID_STATUS_ID : undefined
      );
    } else if (statusInfo.transactionStatus === "Declined" || statusInfo.transactionStatus === "Expired") {
      action = "cancelled";
      updateResult = await updateSitniksOrder(originalOrderNumber, "cancelled");
    }
    
    return NextResponse.json({
      success: true,
      orderReference,
      originalOrderNumber,
      paymentStatus: statusInfo.transactionStatus,
      action,
      sitniksUpdated: updateResult,
      details: statusInfo
    });
    
  } catch (error) {
    console.error("[check-payment] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
