/**
 * POST /api/checkout/callback
 *
 * WayForPay async webhook (serviceUrl). Verify signature, on Approved
 * update Sitniks and send Telegram; return acceptance JSON.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyWfpWebhookSignature, buildWfpResponseSignature } from "@/lib/wayforpay";
import { updateSitniksOrder } from "@/lib/sitniks";
import { sendTelegramNotification } from "@/lib/telegram";
import type { WayForPayWebhookPayload, WayForPayWebhookResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  let payload: WayForPayWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    console.error("[checkout/callback] Failed to parse JSON body");
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

  const secret = process.env.WAYFORPAY_SECRET_KEY ?? "";
  if (!secret) {
    console.error("[checkout/callback] WAYFORPAY_SECRET_KEY not set");
    return buildAcceptanceResponse(orderReference, "");
  }

  const valid = verifyWfpWebhookSignature(
    {
      merchantAccount,
      orderReference,
      amount,
      currency,
      authCode,
      cardPan,
      transactionStatus,
      reasonCode,
      merchantSignature,
    },
    secret
  );

  if (!valid) {
    console.error("[checkout/callback] Invalid signature for order=", orderReference);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (transactionStatus === "Approved") {
    updateSitniksOrder(orderReference, "paid").catch((err) =>
      console.error("[checkout/callback] Sitniks update failed:", err)
    );
    const cardMask = cardPan ? `${cardPan.slice(0, 4)}****${cardPan.slice(-4)}` : "—";
    const msg = [
      "✅ Оплата підтверджена!",
      "",
      `📋 Замовлення: ${orderReference}`,
      `💰 Сума: ${amount.toLocaleString("uk-UA")} грн`,
      `💳 Картка: ${cardMask}`,
    ].join("\n");
    sendTelegramNotification(msg).catch((err) =>
      console.error("[checkout/callback] Telegram failed:", err)
    );
  }

  return buildAcceptanceResponse(orderReference, secret);
}

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
