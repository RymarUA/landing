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
import { updateSitniksOrder, updateSitniksOrderStatus } from "@/lib/sitniks";
import { sendTelegramNotification } from "@/lib/telegram";
// @ts-nocheck

/* ─────────────────────────────────────────────────────────────────────────
   POST handler
   ───────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  /* ── 1. Parse payload ── */
  let payload: any;
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
  const isFhmRef = orderReference.startsWith("FHM-");
  if (transactionStatus === "Approved") {
    try {
      if (isFhmRef) {
        await updateSitniksOrder(orderReference, "paid");
      } else {
        await updateSitniksOrderStatus(
          orderReference,
          "Оплачено",
          `WayForPay Approved | authCode: ${authCode} | card: ${cardPan} | amount: ${amount} ${currency}`
        );
      }
      console.info(`[wfp-webhook] Sitniks order #${orderReference} marked as Оплачено`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[wfp-webhook] Sitniks update failed for order #${orderReference}:`, msg);
    }
    const cardMask = cardPan ? `${cardPan.slice(0, 4)}****${cardPan.slice(-4)}` : "—";
    const msg = [
      "✅ Оплата підтверджена!",
      "",
      `📋 Замовлення: ${orderReference}`,
      `💰 Сума: ${amount.toLocaleString("uk-UA")} грн`,
      `💳 Картка: ${cardMask}`,
    ].join("\n");
    sendTelegramNotification(msg).catch((err) => console.error("[wfp-webhook] Telegram failed:", err));
  } else if (transactionStatus === "Declined" || transactionStatus === "Expired") {
    try {
      if (isFhmRef) {
        await updateSitniksOrder(orderReference, "cancelled");
      } else {
        await updateSitniksOrderStatus(
          orderReference,
          "Скасовано",
          `WayForPay ${transactionStatus} | reason: ${reasonCode} | amount: ${amount} ${currency}`
        );
      }
    } catch (err: unknown) {
      console.error(`[wfp-webhook] Sitniks status update failed (${transactionStatus}):`, err);
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

  const response: any = {
    orderReference,
    status: "accept",
    time,
    signature,
  };

  return NextResponse.json(response, { status: 200 });
}
