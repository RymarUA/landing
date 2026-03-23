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

// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { verifyWfpWebhookSignature, buildWfpResponseSignature } from "@/lib/wayforpay";
import { updateSitniksOrder, createSitniksOrder, type CreateOrderDto } from "@/lib/sitniks-consolidated";
import { sendTelegramNotification } from "@/lib/telegram";
import { getPendingOrder, deletePendingOrder } from "@/lib/pending-orders-store";

// Load status IDs from environment
const PAID_STATUS_ID = process.env.SITNIKS_PAID_STATUS_ID ? Number(process.env.SITNIKS_PAID_STATUS_ID) : 0;

/* ─────────────────────────────────────────────────────────────────────────
   POST handler
   ───────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  /* ── 1. Parse payload ── */
  let payload: any;
  try {
    payload = await req.json();
    console.info("[wfp-webhook] Full payload received:", JSON.stringify(payload, null, 2));
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
    console.log(`[wfp-webhook] Payment APPROVED for order ${orderReference}`);

    const cardMask = cardPan ? `${cardPan.slice(0, 4)}****${cardPan.slice(-4)}` : "—";

    try {
      // Check if this is a new-style pending order (starts with "op")
      const pending = await getPendingOrder(orderReference);

      if (pending) {
        // ── New flow: create Sitniks order now with "Оплачено" status ──
        console.log(`[wfp-webhook] Found pending order, creating in Sitniks with PAID status`);
        const paidDto = {
          ...pending.dto,
          ...(PAID_STATUS_ID > 0 ? { statusId: PAID_STATUS_ID } : {}),
        } as CreateOrderDto;

        const sitniksOrder = await createSitniksOrder(paidDto);

        if (sitniksOrder) {
          console.info(`[wfp-webhook] ✅ Created Sitniks order #${sitniksOrder.orderNumber} as Оплачено`);
          await deletePendingOrder(orderReference);

          const msg = [
            "✅ Оплата підтверджена!",
            "",
            `📋 Замовлення: #${sitniksOrder.orderNumber}`,
            `👤 Клієнт: ${pending.customerName}`,
            `📞 Телефон: ${pending.customerPhone}`,
            `💰 Сума: ${amount} грн`,
            `💳 Картка: ${cardMask}`,
          ].join("\n");
          sendTelegramNotification(msg).catch((e) => console.error("[wfp-webhook] Telegram failed:", e));
        } else {
          console.error(`[wfp-webhook] ❌ Failed to create Sitniks order for pending ${orderReference}`);
        }
      } else {
        // ── Old flow: update existing Sitniks order by order number ──
        const originalOrderNumber = orderReference.includes("_p")
          ? orderReference.split("_p")[0]
          : orderReference;

        console.log(`[wfp-webhook] No pending order found, updating existing Sitniks order ${originalOrderNumber}`);
        const success = await updateSitniksOrder(originalOrderNumber, "paid", PAID_STATUS_ID > 0 ? PAID_STATUS_ID : undefined);

        if (success) {
          console.info(`[wfp-webhook] ✅ Updated order ${originalOrderNumber} to Оплачено`);
        } else {
          console.error(`[wfp-webhook] ❌ Failed to update order ${originalOrderNumber}`);
        }

        const msg = [
          "✅ Оплата підтверджена!",
          "",
          `📋 Замовлення: ${originalOrderNumber}`,
          `💰 Сума: ${amount} грн`,
          `💳 Картка: ${cardMask}`,
        ].join("\n");
        sendTelegramNotification(msg).catch((e) => console.error("[wfp-webhook] Telegram failed:", e));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[wfp-webhook] ❌ Exception for order ${orderReference}:`, msg);
    }
  } else if (transactionStatus === "Declined" || transactionStatus === "Expired") {
    // For declined payments: keep pending order for retry attempts
    // Only delete when payment is approved. This allows customers to try again.
    const pending = await getPendingOrder(orderReference);
    if (pending) {
      console.info(`[wfp-webhook] Payment ${transactionStatus} for order ${orderReference} - keeping pending order for retry`);
    } else {
      // Old flow: cancel existing Sitniks order
      const originalOrderNumber = orderReference.includes("_p")
        ? orderReference.split("_p")[0]
        : orderReference;
      try {
        await updateSitniksOrder(originalOrderNumber, "cancelled");
        console.info(`[wfp-webhook] Sitniks order ${originalOrderNumber} marked as Скасовано`);
      } catch (err) {
        console.error(`[wfp-webhook] Failed to cancel order ${originalOrderNumber}:`, err);
      }
    }
  } else {
    console.info(`[wfp-webhook] Non-actionable status ${transactionStatus} for order ${orderReference}`);
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

