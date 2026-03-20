/**
 * app/api/payment/verify/route.ts
 *
 * Called from /checkout/success page to verify payment and update Sitniks.
 * Uses WayForPay CHECK_STATUS API for authoritative status - do NOT trust
 * the status from returnUrl redirect (WayForPay returnUrl status is unreliable).
 *
 * POST /api/payment/verify
 * Body: { orderReference: "4_p1774017855622" }
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
      return NextResponse.json({ error: "orderReference is required" }, { status: 400 });
    }

    console.log(`[payment-verify] Checking real status for: ${orderReference}`);

    // Get REAL status from WayForPay API (do not trust returnUrl status param)
    const statusInfo = await checkWayForPayStatus(orderReference);
    console.log(`[payment-verify] WayForPay API response:`, JSON.stringify(statusInfo));

    if (!statusInfo) {
      console.error(`[payment-verify] Failed to get status from WayForPay API`);
      return NextResponse.json({ success: false, error: "Failed to check payment status" }, { status: 500 });
    }

    // Extract original order number: "4_p1774017855622" → "4"
    const orderNumber = orderReference.includes("_p")
      ? orderReference.split("_p")[0]
      : orderReference;

    if (statusInfo.transactionStatus === "Approved") {
      console.log(`[payment-verify] ✅ Payment APPROVED, updating Sitniks order ${orderNumber}`);

      const updated = await updateSitniksOrder(
        orderNumber,
        "paid",
        PAID_STATUS_ID > 0 ? PAID_STATUS_ID : undefined
      );

      console.log(`[payment-verify] Sitniks update result: ${updated}`);
      return NextResponse.json({ success: true, updated, orderNumber, status: "Approved" });
    }

    console.log(`[payment-verify] Status is ${statusInfo.transactionStatus}, no Sitniks update`);
    return NextResponse.json({
      success: true,
      updated: false,
      orderNumber,
      status: statusInfo.transactionStatus,
    });

  } catch (error) {
    console.error("[payment-verify] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
