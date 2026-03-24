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
import { acquireOrderLock, releaseOrderLock, markOrderProcessed } from "@/lib/order-processing-lock";
import { createNovaPoshtaTTN } from "@/lib/novaposhta-create-ttn";

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

  /* ── 3. Process payment result ── */
  if (transactionStatus === "Approved") {
    console.log(`[wfp-webhook] Payment APPROVED for order ${orderReference}`);

    const cardMask = cardPan ? `${cardPan.slice(0, 4)}****${cardPan.slice(-4)}` : "—";

    try {
      // Check if this is a new-style pending order (starts with "op")
      const pending = await getPendingOrder(orderReference);

      if (pending) {
        // ── New flow: create Sitniks order now with "Оплачено" status ──
        // CRITICAL: Acquire lock to prevent race condition with /verify endpoint
        const lockAcquired = await acquireOrderLock(orderReference);
        
        if (!lockAcquired) {
          console.log(`[wfp-webhook] Order ${orderReference} already being processed or completed`);
          return buildAcceptanceResponse(orderReference, secret);
        }

        try {
          console.log(`[wfp-webhook] Found pending order, creating in Sitniks with PAID status`);
          console.log(`[wfp-webhook] Pending order DTO keys:`, Object.keys(pending.dto));
          
          const paidDto = {
            ...pending.dto,
            ...(PAID_STATUS_ID > 0 ? { statusId: PAID_STATUS_ID } : {}),
          } as CreateOrderDto;

          console.log(`[wfp-webhook] Calling createSitniksOrder...`);
          const sitniksOrder = await createSitniksOrder(paidDto);
          console.log(`[wfp-webhook] createSitniksOrder result:`, sitniksOrder ? "SUCCESS" : "FAILED");

          if (sitniksOrder) {
            console.info(`[wfp-webhook] ✅ Created Sitniks order #${sitniksOrder.orderNumber} as Оплачено`);
            await deletePendingOrder(orderReference);
            await markOrderProcessed(orderReference);
            await releaseOrderLock(orderReference);

            // Create TTN if NP delivery data was saved
            let ttnNumber: string | undefined;
            if (pending.npDelivery) {
              const senderCityRef = process.env.NOVAPOSHTA_SENDER_CITY_REF;
              const senderWarehouseRef = process.env.NOVAPOSHTA_SENDER_WAREHOUSE_REF;
              const senderCounterpartyRef = process.env.NOVAPOSHTA_SENDER_COUNTERPARTY_REF;
              const senderContactRef = process.env.NOVAPOSHTA_SENDER_CONTACT_REF;
              const senderPhone = process.env.NOVAPOSHTA_SENDER_PHONE;

              if (senderCityRef && senderWarehouseRef && senderCounterpartyRef && senderContactRef && senderPhone) {
                try {
                  const ttnResult = await createNovaPoshtaTTN({
                    senderCityRef,
                    senderWarehouseRef,
                    senderCounterpartyRef,
                    senderContactRef,
                    senderPhone,
                    recipientCityRef: pending.npDelivery.cityRef,
                    recipientWarehouseRef: pending.npDelivery.departmentRef,
                    recipientName: pending.npDelivery.recipientName,
                    recipientPhone: pending.npDelivery.recipientPhone,
                    description: pending.npDelivery.description,
                    weight: pending.npDelivery.weight,
                    cost: pending.npDelivery.cost,
                    seatsAmount: 1,
                    paymentMethod: 'NonCash',
                    payerType: 'Recipient',
                    backwardDeliveryMoney: undefined,
                  });
                  if (ttnResult.success && ttnResult.ttn) {
                    ttnNumber = ttnResult.ttn;
                    console.info(`[wfp-webhook] ✅ ТТН створено: ${ttnNumber} для замовлення #${sitniksOrder.orderNumber}`);
                  } else {
                    console.warn(`[wfp-webhook] ТТН не створено: ${ttnResult.error}`);
                  }
                } catch (ttnError) {
                  console.error(`[wfp-webhook] Помилка створення ТТН:`, ttnError);
                }
              } else {
                console.warn(`[wfp-webhook] Не задані змінні відправника НП — ТТН не створено`);
              }
            }

          const msg = [
            "✅ Оплата підтверджена!",
            "",
            `📋 Замовлення: #${sitniksOrder.orderNumber}`,
            `👤 Клієнт: ${pending.customerName}`,
            `📞 Телефон: ${pending.customerPhone}`,
            `💰 Сума: ${amount} грн`,
            `💳 Картка: ${cardMask}`,
            ...(ttnNumber ? [`📦 ТТН: ${ttnNumber}`] : []),
          ].join("\n");
          sendTelegramNotification(msg).catch((e) => console.error("[wfp-webhook] Telegram failed:", e));
          } else {
            console.error(`[wfp-webhook] ❌ Failed to create Sitniks order for pending ${orderReference}`);
            console.error(`[wfp-webhook] NOT deleting pending order - will retry on next webhook call`);
            await releaseOrderLock(orderReference);
          }
        } catch (createError) {
          console.error(`[wfp-webhook] Exception during order creation:`, createError);
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

