/**
 * app/api/checkout/route.ts
 *
 * POST /api/checkout
 *
 * Checkout flow:
 *   1. Validate request body (zod)
 *   2. Create order in Sitniks CRM with status "Очікує оплати"
 *   3. Build WayForPay payment URL using the new Sitniks order ID as orderReference
 *   4. Return { paymentUrl, orderId } → frontend redirects user to paymentUrl
 *
 * ENV VARS:
 *   SITNIKS_API_URL              — e.g. https://my-store.sitniks.com/api/v1
 *   SITNIKS_API_KEY              — Bearer token from Sitniks Settings → API
 *   WAYFORPAY_MERCHANT_ACCOUNT   — WayForPay merchant account name
 *   WAYFORPAY_MERCHANT_DOMAIN    — your store domain
 *   WAYFORPAY_SECRET_KEY         — WayForPay HMAC-MD5 secret key
 *   NEXT_PUBLIC_SITE_URL         — public base URL (e.g. https://familyhubmarket.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/checkout-schema";
import { createSitniksOrder, normalizePhone } from "@/lib/sitniks";
import { buildWfpPaymentUrl, getWfpConfig } from "@/lib/wayforpay";
import { notifyNewOrder } from "@/lib/telegram-notify";
import { sendOrderConfirmationEmail, sendOrderAdminEmail } from "@/lib/email";
import type {
  CheckoutRequestBody,
  CheckoutResponseError,
  CheckoutResponseSuccess,
  SitniksCreateOrderPayload,
  WayForPayPaymentParams,
} from "@/lib/types";

/* ─────────────────────────────────────────────────────────────────────────
   POST handler
   ───────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  /* ── 1. Parse & validate request body ── */
  let body: CheckoutRequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Невалідний JSON у тілі запиту", 400);
  }

  // Validate contact/delivery fields via zod
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<CheckoutResponseError>(
      { error: "Невалідні дані форми", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, phone, city, warehouse, comment } = parsed.data;

  // Validate cart items
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return errorResponse("Кошик порожній. Додайте товари перед оформленням.", 400);
  }

  // Validate each item has required numeric fields
  for (const item of items) {
    if (
      typeof item.id !== "number" ||
      typeof item.name !== "string" ||
      typeof item.price !== "number" ||
      typeof item.quantity !== "number" ||
      item.price <= 0 ||
      item.quantity <= 0
    ) {
      return errorResponse("Один або більше товарів мають невірний формат.", 400);
    }
  }

  // Recalculate total server-side (never trust client total)
  const totalPrice = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  /* ── 2. Create order in Sitniks CRM ── */
  const sitniksPayload: SitniksCreateOrderPayload = {
    contact_name: name,
    contact_phone: normalizePhone(phone),
    // delivery_address = city + warehouse for NovaPoshta
    delivery_address: `${city}, ${warehouse}`,
    comment: [
      `Нова Пошта: ${city}, ${warehouse}`,
      comment ? `Коментар покупця: ${comment}` : null,
      `Оплата: WayForPay (online)`,
    ]
      .filter(Boolean)
      .join(" | "),
    status: "Очікує оплати",
    items: items.map((item) => ({
      sku: String(item.id),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    total_price: totalPrice,
    source: "familyhub_landing",
  };

  let sitniksOrderId: string | number;
  try {
    const sitniksOrder = await createSitniksOrder(sitniksPayload);
    sitniksOrderId = sitniksOrder.id;
    console.info(`[checkout] Sitniks order created: #${sitniksOrderId}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sitniks error";
    console.error("[checkout] Sitniks createOrder failed:", msg);
    return errorResponse(
      "Помилка створення замовлення у CRM. Спробуйте пізніше або зверніться до нас в Instagram.",
      502
    );
  }

  /* ── 3. Build WayForPay payment URL ── */
  let paymentUrl: string;
  try {
    const wfp = getWfpConfig();

    const wfpParams: WayForPayPaymentParams = {
      merchantAccount: wfp.merchantAccount,
      merchantDomainName: wfp.merchantDomainName,
      // Use Sitniks order ID as the unique order reference
      orderReference: String(sitniksOrderId),
      // Unix timestamp in seconds
      orderDate: Math.floor(Date.now() / 1000),
      amount: totalPrice,
      currency: "UAH",
      productName: items.map((i) => i.name),
      productPrice: items.map((i) => i.price),
      productCount: items.map((i) => i.quantity),
      // After successful payment, WayForPay redirects to /checkout/success
      returnUrl: `${wfp.siteUrl}/checkout/success?orderId=${sitniksOrderId}`,
      // Async webhook for status updates
      serviceUrl: `${wfp.siteUrl}/api/webhooks/wayforpay`,
    };

    paymentUrl = buildWfpPaymentUrl(wfpParams, wfp.secretKey);
    console.info(`[checkout] WayForPay URL built for order #${sitniksOrderId}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "WayForPay config error";
    console.error("[checkout] WayForPay build failed:", msg);
    return errorResponse(
      "Помилка підключення платіжного шлюзу. Зверніться до підтримки.",
      500
    );
  }

  /* ── 4. Send notifications (non-blocking) ── */
  const emailPayload = {
    orderId: sitniksOrderId,
    customerName: name,
    customerEmail: body.email,       // optional field from form
    phone: normalizePhone(phone),
    city,
    warehouse,
    items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
    totalPrice,
  };

  // Telegram admin notification
  notifyNewOrder({
    orderId: sitniksOrderId,
    name,
    phone: normalizePhone(phone),
    city,
    warehouse,
    comment,
    items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
    totalPrice,
  }).catch((err) => console.error("[checkout] Telegram notify failed:", err));

  // Email notifications (customer + admin)
  sendOrderConfirmationEmail(emailPayload).catch((err) =>
    console.error("[checkout] Customer email failed:", err)
  );
  sendOrderAdminEmail(emailPayload).catch((err) =>
    console.error("[checkout] Admin email failed:", err)
  );

  /* ── 5. Return payment URL to frontend ── */
  return NextResponse.json<CheckoutResponseSuccess>({
    paymentUrl,
    orderId: sitniksOrderId,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────── */

function errorResponse(error: string, status: number) {
  return NextResponse.json<CheckoutResponseError>({ error }, { status });
}
