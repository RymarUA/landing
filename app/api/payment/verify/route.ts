/**
 * app/api/payment/verify/route.ts
 *
 * Called from /checkout/success page to update Sitniks order status
 * when WayForPay webhook fails (e.g., test merchant accounts).
 *
 * POST /api/payment/verify
 * Body: { orderNumber: "11", status: "Approved" }
 *
 * Security note: This is a client-side fallback only.
 * The authoritative payment confirmation is the webhook.
 * We trust the `status` param here because it comes from WayForPay's
 * own POST redirect through /api/payment/return.
 */

import { NextRequest, NextResponse } from "next/server";
import { updateSitniksOrder } from "@/lib/sitniks-consolidated";

const PAID_STATUS_ID = process.env.SITNIKS_PAID_STATUS_ID ? Number(process.env.SITNIKS_PAID_STATUS_ID) : 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, status } = body;

    if (!orderNumber) {
      return NextResponse.json({ error: "orderNumber is required" }, { status: 400 });
    }

    console.log(`[payment-verify] orderNumber=${orderNumber} status=${status}`);

    if (status !== "Approved") {
      console.log(`[payment-verify] Status is not Approved (${status}), skipping update`);
      return NextResponse.json({ success: true, updated: false, status });
    }

    // Update Sitniks order to "Оплачено"
    const updated = await updateSitniksOrder(
      String(orderNumber),
      "paid",
      PAID_STATUS_ID > 0 ? PAID_STATUS_ID : undefined
    );

    console.log(`[payment-verify] Sitniks update result: ${updated}`);

    return NextResponse.json({ success: true, updated, orderNumber });

  } catch (error) {
    console.error("[payment-verify] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
