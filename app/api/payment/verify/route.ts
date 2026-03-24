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
import { updateSitniksOrder, createSitniksOrder, type CreateOrderDto } from "@/lib/sitniks-consolidated";
import { getPendingOrder, deletePendingOrder } from "@/lib/pending-orders-store";
import { acquireOrderLock, releaseOrderLock, markOrderProcessed } from "@/lib/order-processing-lock";
import { createNovaPoshtaTTN } from "@/lib/novaposhta-create-ttn";

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
      console.log(`[payment-verify] ✅ Payment APPROVED for ${orderReference}`);

      // Check if this is a new-style pending order
      const pending = await getPendingOrder(orderReference);

      if (pending) {
        // ── New flow: create Sitniks order with PAID status ──
        // CRITICAL: Acquire lock to prevent race condition with webhook endpoint
        const lockAcquired = await acquireOrderLock(orderReference);
        
        if (!lockAcquired) {
          console.log(`[payment-verify] Order ${orderReference} already being processed or completed`);
          return NextResponse.json({
            success: true,
            updated: false,
            orderNumber,
            status: "Approved",
            message: "Order already processed"
          });
        }

        try {
          console.log(`[payment-verify] Found pending order, creating in Sitniks`);
          const paidDto = {
            ...pending.dto,
            ...(PAID_STATUS_ID > 0 ? { statusId: PAID_STATUS_ID } : {}),
          } as CreateOrderDto;

          const sitniksOrder = await createSitniksOrder(paidDto);

          if (sitniksOrder) {
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
                    paymentMethod: "NonCash",
                    payerType: "Recipient",
                    backwardDeliveryMoney: undefined,
                  });

                  if (ttnResult.success && ttnResult.ttn) {
                    ttnNumber = ttnResult.ttn;
                    console.log(`[payment-verify] ✅ ТТН створено: ${ttnNumber} для замовлення #${sitniksOrder.orderNumber}`);
                  } else {
                    console.warn(`[payment-verify] ТТН не створено: ${ttnResult.error}`);
                  }
                } catch (ttnError) {
                  console.error("[payment-verify] Помилка створення ТТН:", ttnError);
                }
              } else {
                console.warn("[payment-verify] Не задані змінні відправника НП — ТТН не створено");
              }
            }

            await deletePendingOrder(orderReference);
            await markOrderProcessed(orderReference);
            await releaseOrderLock(orderReference);
            console.log(`[payment-verify] ✅ Created Sitniks order #${sitniksOrder.orderNumber} as Оплачено`);
            return NextResponse.json({
              success: true,
              updated: true,
              orderNumber: sitniksOrder.orderNumber,
              ttn: ttnNumber,
              status: "Approved",
            });
          } else {
            await releaseOrderLock(orderReference);
            console.error(`[payment-verify] ❌ Failed to create Sitniks order from pending`);
            return NextResponse.json({ success: false, error: "Failed to create Sitniks order" }, { status: 500 });
          }
        } catch (createError) {
          await releaseOrderLock(orderReference);
          console.error(`[payment-verify] Exception during order creation:`, createError);
          throw createError;
        }
      } else {
        // ── Old flow: update existing Sitniks order ──
        const updated = await updateSitniksOrder(
          orderNumber,
          "paid",
          PAID_STATUS_ID > 0 ? PAID_STATUS_ID : undefined
        );
        console.log(`[payment-verify] Sitniks update result: ${updated}`);
        return NextResponse.json({ success: true, updated, orderNumber, status: "Approved" });
      }
    }

    // Payment not approved — clean up pending order if exists
    const pending = await getPendingOrder(orderReference);
    if (pending && (statusInfo.transactionStatus === "Declined" || statusInfo.transactionStatus === "Expired")) {
      await deletePendingOrder(orderReference);
      console.log(`[payment-verify] Deleted pending order (${statusInfo.transactionStatus})`);
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
