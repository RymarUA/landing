/**
 * POST /api/checkout
 *
 * Creates payment: orderReference = FHM-{Date.now()}, creates Sitniks order,
 * builds WayForPay form/redirect, sends Telegram + email in parallel.
 * Returns { orderReference, wayforpay, paymentUrl }.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/checkout-schema";
import { createSitniksOrder, normalizePhone } from "@/lib/sitniks";
import { buildWfpSignature, buildWfpPaymentUrl, getWfpConfig } from "@/lib/wayforpay";
import { sendTelegramNotification } from "@/lib/telegram";
import { sendOrderConfirmation, sendAdminOrderCopy } from "@/lib/email";
import type { CheckoutResponseError, WayForPayPaymentParams } from "@/lib/types";

interface CheckoutItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
}

function normalizeBody(body: unknown): {
  items: CheckoutItem[];
  customer: { name: string; phone: string; email?: string };
  delivery: { city: string; warehouse: string };
} | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const items = Array.isArray(b.items) ? b.items : [];
  const customer = b.customer && typeof b.customer === "object"
    ? (b.customer as Record<string, unknown>)
    : null;
  const delivery = b.delivery && typeof b.delivery === "object"
    ? (b.delivery as Record<string, unknown>)
    : null;

  if (customer && delivery) {
    const name = String(customer.name ?? "").trim();
    const phone = String(customer.phone ?? "").trim();
    const email = customer.email != null ? String(customer.email).trim() : undefined;
    const city = String(delivery.city ?? "").trim();
    const warehouse = String(delivery.warehouse ?? "").trim();
    if (!name || !phone || !city || !warehouse) return null;
    return {
      items: items as CheckoutItem[],
      customer: { name, phone, email: email || undefined },
      delivery: { city, warehouse },
    };
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return null;
  const { name, phone, city, warehouse } = parsed.data;
  const email = (b.email != null && b.email !== "") ? String(b.email).trim() : undefined;
  return {
    items: items as CheckoutItem[],
    customer: { name, phone, email },
    delivery: { city, warehouse },
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<CheckoutResponseError>(
      { error: "Невалідний JSON у тілі запиту" },
      { status: 400 }
    );
  }

  const data = normalizeBody(body);
  if (!data) {
    return NextResponse.json<CheckoutResponseError>(
      { error: "Невалідні дані форми" },
      { status: 422 }
    );
  }

  const { items, customer, delivery } = data;

  if (items.length === 0) {
    return NextResponse.json<CheckoutResponseError>(
      { error: "Кошик порожній. Додайте товари перед оформленням." },
      { status: 400 }
    );
  }

  if (!customer.phone) {
    return NextResponse.json<CheckoutResponseError>(
      { error: "Вкажіть номер телефону" },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (
      typeof item.id !== "number" ||
      typeof item.name !== "string" ||
      typeof item.price !== "number" ||
      typeof item.quantity !== "number" ||
      item.price <= 0 ||
      item.quantity <= 0
    ) {
      return NextResponse.json<CheckoutResponseError>(
        { error: "Один або більше товарів мають невірний формат." },
        { status: 400 }
      );
    }
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const orderReference = `FHM-${Date.now()}`;

  const checkoutPayload = {
    orderReference,
    customer: {
      name: customer.name,
      phone: normalizePhone(customer.phone),
      email: customer.email,
    },
    delivery: { city: delivery.city, warehouse: delivery.warehouse },
    items: items.map((i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      size: i.size ?? null,
    })),
    total,
  };

  const WFP_RETRY_ATTEMPTS = 3;
  const WFP_STEP_MS = 2000;
  const CHECKOUT_TIMEOUT_MS = 20000;

  const runCreateAndConfig = async () => {
    let sitniksResult: { id: string | number } | null = null;
    for (let attempt = 0; attempt < WFP_RETRY_ATTEMPTS; attempt++) {
      sitniksResult = await createSitniksOrder(checkoutPayload);
      if (sitniksResult) {
        console.info("[checkout] Sitniks order created for", orderReference);
        break;
      }
      if (attempt === WFP_RETRY_ATTEMPTS - 1) {
        throw new Error("Sitniks create failed after " + WFP_RETRY_ATTEMPTS + " attempts");
      }
      await new Promise((r) => setTimeout(r, WFP_STEP_MS * (attempt + 1)));
    }
    return getWfpConfig();
  };

  let wfpConfig;
  try {
    wfpConfig = await Promise.race([
      runCreateAndConfig(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Checkout timeout")), CHECKOUT_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    console.error("[checkout]", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Checkout timeout") {
      return NextResponse.json<CheckoutResponseError>(
        { error: "Час очікування вичерпано. Спробуйте ще раз." },
        { status: 504 }
      );
    }
    return NextResponse.json<CheckoutResponseError>(
      { error: "Тимчасово не вдалося створити замовлення. Спробуйте ще раз або зверніться до нас." },
      { status: 502 }
    );
  }

  const siteUrl = wfpConfig.siteUrl;
  const returnUrl = `${siteUrl}/checkout/success`;
  const serviceUrl = `${siteUrl}/api/checkout/callback`;

  const productName = items.map((i) => (i.size ? `${i.name} (розм. ${i.size})` : i.name));
  const productPrice = items.map((i) => i.price);
  const productCount = items.map((i) => i.quantity);
  const orderDate = Math.floor(Date.now() / 1000);

  const wfpParams: WayForPayPaymentParams = {
    merchantAccount: wfpConfig.merchantAccount,
    merchantDomainName: wfpConfig.merchantDomainName,
    orderReference,
    orderDate,
    amount: total,
    currency: "UAH",
    productName,
    productPrice,
    productCount,
    returnUrl,
    serviceUrl,
  };

  const merchantSignature = buildWfpSignature(wfpParams, wfpConfig.secretKey);
  const paymentUrl = buildWfpPaymentUrl(wfpParams, wfpConfig.secretKey);

  const wayforpay = {
    merchantAccount: wfpParams.merchantAccount,
    merchantDomainName: wfpParams.merchantDomainName,
    orderReference: wfpParams.orderReference,
    orderDate: wfpParams.orderDate,
    amount: wfpParams.amount,
    currency: wfpParams.currency,
    productName: wfpParams.productName,
    productPrice: wfpParams.productPrice,
    productCount: wfpParams.productCount,
    merchantSignature,
    language: "UA" as const,
    returnUrl,
    serviceUrl,
  };

  const phoneNorm = normalizePhone(customer.phone);

  const telegramMessage = [
    "🛒 Нове замовлення " + orderReference,
    "",
    "👤 " + customer.name,
    "📞 " + phoneNorm,
    customer.email ? "📧 " + customer.email : "",
    "",
    "📦 Товари:",
    ...items.map(
      (i) =>
        `• ${i.size ? `${i.name} (розм. ${i.size})` : i.name} × ${i.quantity} — ${(i.price * i.quantity).toLocaleString("uk-UA")} грн`
    ),
    "",
    "🏙 Доставка: " + delivery.city + ", Нова Пошта, " + delivery.warehouse,
    "💰 Сума: " + total.toLocaleString("uk-UA") + " грн",
    "",
    "🔗 Статус оплати: очікується",
  ]
    .filter(Boolean)
    .join("\n");

  sendTelegramNotification(telegramMessage).catch((err) =>
    console.error("[checkout] Telegram failed:", err)
  );

  if (customer.email) {
    sendOrderConfirmation({
      to: customer.email,
      customerName: customer.name,
      orderReference,
      items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, size: i.size ?? null })),
      total,
      delivery: { city: delivery.city, warehouse: delivery.warehouse },
    }).catch((err) => console.error("[checkout] Customer email failed:", err));
  }

  sendAdminOrderCopy({
    customerName: customer.name,
    phone: phoneNorm,
    email: customer.email,
    orderReference,
    items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, size: i.size ?? null })),
    total,
    delivery: { city: delivery.city, warehouse: delivery.warehouse },
  }).catch((err) => console.error("[checkout] Admin email failed:", err));

  return NextResponse.json({
    orderReference,
    wayforpay,
    paymentUrl,
    orderId: orderReference,
  });
}
