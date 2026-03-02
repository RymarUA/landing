/**
 * app/api/webhooks/wayforpay/route.ts
 *
 * POST /api/webhooks/wayforpay
 *
 * WayForPay async callback (serviceUrl) handler.
 *
 * What happens here:
 *   1. Parse the incoming JSON payload from WayForPay.
 *   2. Verify the merchant signature (HMAC-MD5) to ensure authenticity.
 *   3. If transactionStatus === "Approved" → update Sitniks order to "Оплачено".
 *   4. Return the required WayForPay acceptance response (orderReference + status + time + signature).
 *
 * WayForPay retries the webhook if it doesn't receive the acceptance response,
 * so we ALWAYS return the acceptance body (even on non-Approved statuses),
 * but only update Sitniks on Approved.
 *
 * Docs: https://wiki.wayforpay.com/en/view/852114
 *
 * ENV VARS:
 *   WAYFORPAY_SECRET_KEY  — same secret used to generate payment signatures
 *   SITNIKS_API_URL / SITNIKS_API_KEY — for order status update
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWfpWebhookSignature, buildWfpResponseSignature } from "@/lib/wayforpay";
import { updateSitniksOrderStatus } from "@/lib/sitniks";
import type { WayForPayWebhookPayload, WayForPayWebhookResponse } from "@/lib/types";

/* ─────────────────────────────────────────────────────────────────────────
   POST handler
   ───────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  /* ── 1. Parse payload ── */
  let payload: WayForPayWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    console.error("[wfp-webhook] Failed to parse JSON body");
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const {
    merchantAccount,
    orderReference,
    amount,
    currency,
    authCode,
    cardPan,
    transactionStatus,
    reasonCode,
    merchantSignature,
  } = payload;

  console.info(
    `[wfp-webhook] Received: order=${orderReference} status=${transactionStatus} amount=${amount} ${currency}`
  );

  /* ── 2. Verify signature ── */
  const secret = process.env.WAYFORPAY_SECRET_KEY;
  if (!secret) {
    console.error("[wfp-webhook] WAYFORPAY_SECRET_KEY is not configured");
    // Return acceptance anyway to stop WayForPay retries; alert manually
    return buildAcceptanceResponse(orderReference, secret ?? "");
  }

  const signatureValid = verifyWfpWebhookSignature(
    { merchantAccount, orderReference, amount, currency, authCode, cardPan, transactionStatus, reasonCode, merchantSignature },
    secret
  );

  if (!signatureValid) {
    console.error(
      `[wfp-webhook] INVALID SIGNATURE for order=${orderReference}. Possible spoofing attempt.`
    );
    // Return 403; WayForPay will retry, but with a valid signature only
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  /* ── 3. Process payment result ── */
  if (transactionStatus === "Approved") {
    try {
      await updateSitniksOrderStatus(
        orderReference,
        "Оплачено",
        `WayForPay Approved | authCode: ${authCode} | card: ${cardPan} | amount: ${amount} ${currency}`
      );
      console.info(`[wfp-webhook] Sitniks order #${orderReference} marked as Оплачено`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Log but don't fail — we must still return acceptance to WayForPay
      console.error(`[wfp-webhook] Sitniks update failed for order #${orderReference}:`, msg);
    }
  } else if (transactionStatus === "Declined" || transactionStatus === "Expired") {
    // Optionally update Sitniks status to "Скасовано"
    try {
      await updateSitniksOrderStatus(
        orderReference,
        "Скасовано",
        `WayForPay ${transactionStatus} | reason: ${reasonCode} | amount: ${amount} ${currency}`
      );
      console.info(`[wfp-webhook] Sitniks order #${orderReference} marked as Скасовано`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[wfp-webhook] Sitniks status update failed (${transactionStatus}):`, msg);
    }
  } else {
    // InProcessing, Waiting, Refunded, Voided — no action needed
    console.info(`[wfp-webhook] Non-actionable status ${transactionStatus} for order #${orderReference}`);
  }

  /* ── 4. Return WayForPay acceptance response ── */
  return buildAcceptanceResponse(orderReference, secret);
}

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Builds the acceptance JSON response WayForPay expects after processing.
 *
 * WayForPay considers the webhook "handled" only when it receives:
 * {
 *   "orderReference": "...",
 *   "status": "accept",
 *   "time": <unix seconds>,
 *   "signature": "<hmac-md5(orderReference;status;time)>"
 * }
 */
function buildAcceptanceResponse(
  orderReference: string,
  secret: string
): NextResponse {
  const time = Math.floor(Date.now() / 1000);
  const signature = secret
    ? buildWfpResponseSignature(orderReference, "accept", time, secret)
    : "";

  const body: WayForPayWebhookResponse = {
    orderReference,
    status: "accept",
    time,
    signature,
  };

  return NextResponse.json(body, { status: 200 });
}
