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
import { updateSitniksOrder, type CreateOrderDto } from "@/lib/sitniks-consolidated";
import { sendTelegramNotification } from "@/lib/telegram";
import { getPendingOrder, deletePendingOrder } from "@/lib/pending-orders-store";
import { acquireOrderLock, releaseOrderLock, markOrderProcessed } from "@/lib/order-processing-lock";
import { addToOutbox } from "@/lib/transactional-outbox";
import { 
  validateWebhookReplayProtection, 
  markWebhookAsProcessed 
} from "@/lib/webhook-replay-protection";

// Load status IDs from environment
const PAID_STATUS_ID = process.env.SITNIKS_PAID_STATUS_ID ? Number(process.env.SITNIKS_PAID_STATUS_ID) : 0;

/* ─────────────────────────────────────────────────────────────────────────
   POST handler
   ───────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  console.info("[wfp-webhook] === WEBHOOK CALLED ===");
  console.info("[wfp-webhook] Request headers:", Object.fromEntries(req.headers.entries()));
  console.info("[wfp-webhook] Request method:", req.method);
  console.info("[wfp-webhook] Request URL:", req.url);
  
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
    // WayForPay may send these (check docs)
    timestamp,
    nonce,
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

  console.info("[wfp-webhook] Verifying signature with secret...");
  const signatureValid = verifyWfpWebhookSignature(
    { merchantAccount, orderReference, amount, currency, authCode, cardPan, transactionStatus, reasonCode, merchantSignature },
    secret
  );

  console.info(`[wfp-webhook] Signature verification result: ${signatureValid ? "✅ VALID" : "❌ INVALID"}`);

  if (!signatureValid) {
    console.error(
      `[wfp-webhook] INVALID SIGNATURE for order=${orderReference}. Possible spoofing attempt.`
    );
    // Return 403; WayForPay will retry, but with a valid signature only
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  /* ── 2.1. Replay attack protection ── */
  console.info("[wfp-webhook] Checking for replay attacks...");
  
  const replayValidation = await validateWebhookReplayProtection({
    orderReference,
    merchantSignature,
    timestamp: timestamp ? Number(timestamp) : undefined,
    nonce,
  });

  if (!replayValidation.valid) {
    console.warn(
      `[wfp-webhook] ❌ REPLAY ATTACK DETECTED: ${replayValidation.reason} for order=${orderReference}`
    );
    
    // Return success to prevent WayForPay retries, but log the attack
    const response = buildAcceptanceResponse(orderReference, secret);
    console.log(`[wfp-webhook] Returned acceptance response for replay attack`);
    return response;
  }

  console.info(`[wfp-webhook] ✅ Replay protection passed: ${replayValidation.requestId}`);

  /* ── 3. Process payment result ── */
  if (transactionStatus === "Approved") {
    console.log(`[wfp-webhook] Payment APPROVED for order ${orderReference}`);

    const cardMask = cardPan ? `${cardPan.slice(0, 4)}****${cardPan.slice(-4)}` : "—";

    try {
      // Check if this is a new-style pending order (starts with "op")
      const pending = await getPendingOrder(orderReference);

      if (pending) {
        // ── New flow: add to outbox for reliable processing ──
        // CRITICAL: Acquire lock to prevent race condition with /verify endpoint
        const lockAcquired = await acquireOrderLock(orderReference);
        
        if (!lockAcquired) {
          console.log(`[wfp-webhook] Order ${orderReference} already being processed or completed`);
          return buildAcceptanceResponse(orderReference, secret);
        }

        try {
          console.log(`[wfp-webhook] Found pending order, adding to outbox for processing`);
          console.log(`[wfp-webhook] Pending order DTO keys:`, Object.keys(pending.dto));
          
          const paidDto = {
            ...pending.dto,
            ...(PAID_STATUS_ID > 0 ? { statusId: PAID_STATUS_ID } : {}),
          } as CreateOrderDto;

          console.log(`[wfp-webhook] Adding to outbox...`);
          const outboxId = await addToOutbox({
            type: "create_order",
            data: {
              orderDto: paidDto,
              customerName: pending.customerName,
              customerPhone: pending.customerPhone,
              amount: pending.amount,
              cardMask: cardMask || undefined,
              npDelivery: pending.npDelivery,
            },
          });
          
          console.log(`[wfp-webhook] ✅ Added to outbox with ID: ${outboxId}`);
          
          // Clean up pending order and mark as processed
          await deletePendingOrder(orderReference);
          await markOrderProcessed(orderReference);
          await releaseOrderLock(orderReference);

          // Send immediate notification that payment is being processed
          const msg = [
            "✅ Оплата отримана! Обробка...",
            "",
            `📋 Замовлення: ${orderReference}`,
            `👤 Клієнт: ${pending.customerName}`,
            `📞 Телефон: ${pending.customerPhone}`,
            `💰 Сума: ${amount} грн`,
            `💳 Картка: ${cardMask}`,
            `🔄 Статус: Додано в чергу обробки`,
          ].join("\n");
          sendTelegramNotification(msg).catch((e) => console.error("[wfp-webhook] Telegram failed:", e));
          
          // Mark webhook as processed to prevent replay attacks
          await markWebhookAsProcessed({
            orderReference,
            merchantSignature,
            timestamp: timestamp ? Number(timestamp) : undefined,
            nonce,
          }, replayValidation.requestId);
          
        } catch (createError) {
          console.error(`[wfp-webhook] Exception during outbox creation:`, createError);
          await releaseOrderLock(orderReference);
          throw createError;
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
        
        // Mark webhook as processed to prevent replay attacks
        await markWebhookAsProcessed({
          orderReference,
          merchantSignature,
          timestamp: timestamp ? Number(timestamp) : undefined,
          nonce,
        }, replayValidation.requestId);
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

