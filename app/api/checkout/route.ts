// @ts-nocheck
/**
 * app/api/checkout/route.ts
 *
 * POST /api/checkout — приймає замовлення з сайту і відправляє в Sitniks CRM.
 *
 * Body:
 * {
 *   name: string,
 *   phone: string,
 *   city: string,
 *   department: string,           // номер відділення НП
 *   departmentRef?: string,       // ref відділення НП (якщо є)
 *   cityRef?: string,             // ref міста НП
 *   paymentMethod: "cod" | "card",
 *   comment?: string,
 *   items: Array<{
 *     productId: number,
 *     variationId: number,
 *     name: string,
 *     price: number,
 *     quantity: number,
 *     size?: string
 *   }>
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSitniksOrder, type CreateOrderDto } from "@/lib/sitniks-consolidated";
import { normalizePhone } from "@/lib/phone-utils";
import { getCatalogProductById } from "@/lib/instagram-catalog";
import { logger } from "@/lib/logger";
import { buildWfpFormParams, getWfpConfig, sanitizeProductName } from "@/lib/wayforpay";
import { getCurrentUser } from "@/lib/auth-helpers";

// ── Отримай ці ID з Sitniks: Налаштування → Нова Пошта → ID інтеграції
const NP_INTEGRATION_ID = Number(process.env.SITNIKS_NP_INTEGRATION_ID ?? 0);
// ── Канал продажів для сайту (Налаштування → Канали продажів)
const SALES_CHANNEL_ID  = Number(process.env.SITNIKS_SALES_CHANNEL_ID ?? 0);
// ── Статус "Новий" (Налаштування → Статуси замовлень → ID)
const NEW_ORDER_STATUS  = process.env.SITNIKS_NEW_STATUS_ID ? Number(process.env.SITNIKS_NEW_STATUS_ID) : 0;
// ── Статус "Очікує оплати" для онлайн-замовлень
const PENDING_PAYMENT_STATUS = process.env.SITNIKS_PENDING_PAYMENT_STATUS_ID ? Number(process.env.SITNIKS_PENDING_PAYMENT_STATUS_ID) : 0;
// ── Статус "Оплачено"
const PAID_STATUS = process.env.SITNIKS_PAID_STATUS_ID ? Number(process.env.SITNIKS_PAID_STATUS_ID) : 0;

console.log("[/api/checkout] Environment variables loaded:");
console.log("  NP_INTEGRATION_ID:", NP_INTEGRATION_ID);
console.log("  SALES_CHANNEL_ID:", SALES_CHANNEL_ID);
console.log("  NEW_ORDER_STATUS:", NEW_ORDER_STATUS);
console.log("  PENDING_PAYMENT_STATUS:", PENDING_PAYMENT_STATUS);
console.log("  PAID_STATUS:", PAID_STATUS);

interface CheckoutItem {
  id?: number;
  productId?: number;
  variationId?: number;
  name: string;
  price?: number;
  quantity: number;
  size?: string;
}

interface CheckoutBody {
  name: string;
  phone: string;
  email?: string;
  city: string;
  department?: string;
  warehouse?: string;
  departmentRef?: string;
  cityRef?: string;
  paymentMethod: "cod" | "card" | "online";
  comment?: string;
  discountAmount?: number;
  items: CheckoutItem[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
}

function validateBody(body: unknown): body is CheckoutBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const hasDelivery = typeof b.department === "string" || typeof b.warehouse === "string";
  return (
    typeof b.name === "string" && b.name.length >= 3 &&
    typeof b.phone === "string" && b.phone.length >= 10 &&
    typeof b.city === "string" &&
    hasDelivery &&
    Array.isArray(b.items) && b.items.length > 0
  );
}

import { applyPromoCode } from "@/lib/checkout-schema";

function buildPaymentItemsForWayForPay(
  items: Array<{ name: string; price: number; quantity: number }>,
  discountAmount: number
) {
  if (!items.length) return [];

  const normalized = items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    lineTotalCents: Math.round(item.price * 100) * item.quantity,
  }));

  const totalCents = normalized.reduce((sum, item) => sum + item.lineTotalCents, 0);
  if (totalCents === 0) {
    return normalized.map((item) => ({ name: item.name, quantity: item.quantity, lineTotal: 0 }));
  }

  const maxDiscountCents = Math.min(Math.round(discountAmount * 100), totalCents);
  let remainingDiscount = maxDiscountCents;
  let remainingTotal = totalCents;

  return normalized.map((item, index) => {
    let discountShare = 0;
    if (remainingDiscount > 0) {
      if (index === normalized.length - 1) {
        discountShare = remainingDiscount;
      } else if (remainingTotal > 0) {
        discountShare = Math.round((item.lineTotalCents / remainingTotal) * remainingDiscount);
        discountShare = Math.min(discountShare, remainingDiscount);
      }
    }

    remainingDiscount -= discountShare;
    remainingTotal -= item.lineTotalCents;

    const adjustedLineTotalCents = item.lineTotalCents - discountShare;

    return {
      name: item.name,
      quantity: item.quantity,
      lineTotal: adjustedLineTotalCents / 100,
    };
  });
}

import { applyRateLimit, checkoutRateLimiter } from "@/lib/rate-limiting";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, checkoutRateLimiter);
    
    if (!rateLimitResult.allowed) {
      const headers = new Headers(rateLimitResult.headers);
      headers.set('Content-Type', 'application/json');
      
      return new NextResponse(
        JSON.stringify(rateLimitResult.error),
        { 
          status: 429,
          headers
        }
      );
    }

    // Get current authenticated user if available
    const currentUser = await getCurrentUser();
    
    const body = await req.json();

    if (!validateBody(body)) {
      return NextResponse.json(
        { error: "Невірний формат замовлення" },
        { status: 400 }
      );
    }

    let phone: string;
    try {
      phone = normalizePhone(body.phone);
    } catch {
      return NextResponse.json(
        { error: "Невірний формат телефону. Очікується український номер" },
        { status: 400 }
      );
    }

    const department = body.warehouse ?? "";
    
    console.log("[/api/checkout] Received data:");
    console.log("  cityRef:", body.cityRef);
    console.log("  departmentRef:", body.departmentRef);
    console.log("  city:", body.city);
    console.log("  warehouse:", body.warehouse);

    // Server-side price: get products from catalog by ID, ignore frontend totalPrice
    let serverTotal = 0;
    const resolvedItems: Array<{ variationId: number; price: number; quantity: number; name: string; size?: string; weight: number }> = [];

    for (const item of body.items) {
      const productId = item.productId ?? item.id;
      if (productId == null) {
        return NextResponse.json(
          { error: "Кожен товар повинен мати id або productId" },
          { status: 400 }
        );
      }
      
      const catalogProduct = await getCatalogProductById(Number(productId));
      
      if (!catalogProduct) {
        logger.warn("[checkout] Product not found", {
          requestProductId: Number(productId),
          itemSize: item.size,
        });
        return NextResponse.json(
          {
            error: `Товар з ID ${productId} не знайдено в каталозі. Можливо товар був видалений. Будь ласка, оновіть сторінку та спробуйте ще раз.`,
            missingProductId: Number(productId),
          },
          { status: 404 }
        );
      }
      
      // Find variation by size if specified
      const explicitVariationId = item.variationId ?? (item.productId != null ? undefined : item.id);
      let variationId = explicitVariationId ?? catalogProduct.variationId ?? productId;
      let price = catalogProduct.price;
      let weight = catalogProduct.weight ?? 0.5;
      
      if (item.size && catalogProduct.allVariations?.length) {
        const matchingVariation = catalogProduct.allVariations.find(v => 
          v.properties.some(p => p.name === "Розмір" && p.value === item.size)
        );
        if (matchingVariation) {
          variationId = matchingVariation.id;
          price = matchingVariation.price;
        }
      }
      
      const qty = Math.max(1, Number(item.quantity) || 1);
      serverTotal += price * qty;
      resolvedItems.push({
        variationId,
        price,
        quantity: qty,
        name: item.name || catalogProduct.name,
        size: item.size,
        weight,
      });
    }

    // Validate and recalculate promo code discount on server side
    let serverDiscountAmount = 0;
    
    if (body.promoCode) {
      const promoResult = applyPromoCode(body.promoCode);
      if (promoResult) {
        // Calculate discount based on server total
        serverDiscountAmount = Math.round(serverTotal * promoResult.discountPct / 100);
        console.log(`[checkout] Promo code ${body.promoCode} applied: ${promoResult.discountPct}% = ${serverDiscountAmount} UAH`);
      } else {
        console.warn(`[checkout] Invalid promo code: ${body.promoCode}`);
      }
    }
    
    // Add online payment discount if applicable
    let onlinePaymentDiscount = 0;
    if (body.paymentMethod === "online" || body.paymentMethod === "card") {
      onlinePaymentDiscount = Math.round((serverTotal - serverDiscountAmount) * 0.05);
    }
    
    // Total discount is promo discount + online payment discount
    const totalServerDiscount = serverDiscountAmount + onlinePaymentDiscount;
    
    // Use the lesser of server-calculated discount and client-requested discount
    const requestedDiscount = Math.max(0, Number(body.discountAmount) || 0);
    const discountAmount = Math.min(totalServerDiscount, requestedDiscount, serverTotal);
    
    if (discountAmount !== requestedDiscount) {
      console.warn(`[checkout] Discount mismatch: client=${requestedDiscount}, server=${totalServerDiscount}, applied=${discountAmount}`);
    }

    const paymentItems = buildPaymentItemsForWayForPay(resolvedItems, discountAmount);
    const finalAmount = Number(
      paymentItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );

    // Calculate total weight from products
    let totalWeight = 0;
    for (const item of resolvedItems) {
      totalWeight += item.weight * item.quantity;
    }
    // Minimum weight 0.5kg for Nova Poshta
    totalWeight = Math.max(0.5, totalWeight);

    // Build manager comment with tracking info
    let managerComment = `Замовлення з сайту. Оплата: ${(body.paymentMethod === "card" || body.paymentMethod === "online") ? "картка" : "накладений платіж"}`;
    if (currentUser) {
      managerComment += `. UserID: ${currentUser.userId}`;
    }
    if (body.utm_source || body.utm_medium || body.utm_campaign) {
      const utmParts = [];
      if (body.utm_source) utmParts.push(`source=${body.utm_source}`);
      if (body.utm_medium) utmParts.push(`medium=${body.utm_medium}`);
      if (body.utm_campaign) utmParts.push(`campaign=${body.utm_campaign}`);
      managerComment += `. UTM: ${utmParts.join(", ")}`;
    }
    if (body.referrer) {
      managerComment += `. Referrer: ${body.referrer}`;
    }
    if (discountAmount > 0) {
      const discountParts = [];
      if (serverDiscountAmount > 0) {
        discountParts.push(`Промокод: ${serverDiscountAmount} грн`);
      }
      if (onlinePaymentDiscount > 0) {
        discountParts.push(`Онлайн-оплата: ${onlinePaymentDiscount} грн`);
      }
      managerComment += `. Знижка: ${discountParts.join(", ")} (всього: ${discountAmount} грн)`;
    }

    const dto: CreateOrderDto = {
      client: {
        fullname: body.name,
        phone: phone,
        email: body.email,
      },

      products: resolvedItems.map((item) => ({
        productVariationId: item.variationId,
        isUpsale: false,
        price: item.price,
        quantity: item.quantity,
        title: item.size ? `${item.name} (${item.size})` : item.name,
      })),

      // Нова Пошта
      ...(NP_INTEGRATION_ID > 0 && body.cityRef && body.departmentRef ? {
        npDelivery: {
          integrationNovaposhtaId: NP_INTEGRATION_ID,
          price: finalAmount,
          seatsAmount: 1,
          city: body.city,
          cityRef: body.cityRef,
          department,
          departmentRef: body.departmentRef,
          serviceType: "WarehouseWarehouse",
          payerType: "Recipient",
          cargoType: "Parcel",
          paymentMethod: "Cash",
          // Після оплати карткою — контроль плати, при накладеному — постоплата
          productPaymentMethod: (body.paymentMethod === "card" || body.paymentMethod === "online") ? "payment-control" : "postpaid",
          weight: totalWeight,
          description: resolvedItems.map((i) => `${i.name} x${i.quantity}`).join(", "),
        }
      } : {}),

      // Використовуємо різні статуси для COD та онлайн-оплати
      ...(SALES_CHANNEL_ID > 0 ? { salesChannelId: SALES_CHANNEL_ID } : {}),
      // Для онлайн-оплати: "Очікує оплати", для COD: "Новий"
      ...((body.paymentMethod === "card" || body.paymentMethod === "online") && PENDING_PAYMENT_STATUS > 0
        ? { statusId: PENDING_PAYMENT_STATUS }
        : NEW_ORDER_STATUS > 0
        ? { statusId: NEW_ORDER_STATUS }
        : {}),

      clientComment: body.comment,
      managerComment: managerComment,

      // Зберігаємо унікальний ID щоб уникнути дублікатів
      externalId: `web-${Date.now()}${currentUser ? `-user-${currentUser.userId}` : ""}`,
    };

    console.log("[/api/checkout] Creating order with DTO:", JSON.stringify(dto, null, 2));
    const order = await createSitniksOrder(dto);

    if (!order) {
      return NextResponse.json(
        { error: "Не вдалося створити замовлення в Sitniks CRM" },
        { status: 500 }
      );
    }

    // Generate WayForPay payment form parameters for online payments
    let paymentFormParams: Record<string, string> | undefined;
    if (body.paymentMethod === "online" || body.paymentMethod === "card") {
      try {
        const wfpConfig = getWfpConfig();
        // Add unique payment attempt ID to prevent "Duplicate Order ID" error
        // Format: ORDER-123_p1234567890 (original order number + payment timestamp)
        const paymentAttemptId = `${order.orderNumber}_p${Date.now()}`;
        const paymentParams = {
          merchantAccount: wfpConfig.merchantAccount,
          merchantDomainName: wfpConfig.merchantDomainName,
          orderReference: paymentAttemptId,
          orderDate: Math.floor(Date.now() / 1000),
          amount: finalAmount,
          currency: "UAH" as const,
          // Each payment item represents a full line total (count = 1) to ensure
          // sum(productPrice * productCount) === amount even with discounts
          productName: paymentItems.map((item) => {
            const label = item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name;
            return sanitizeProductName(label);
          }),
          productPrice: paymentItems.map((item) => Number(item.lineTotal.toFixed(2))),
          productCount: paymentItems.map(() => 1),
          returnUrl: `${wfpConfig.siteUrl}/api/payment/return`,
          serviceUrl: `${wfpConfig.siteUrl}/api/webhooks/wayforpay`,
        };
        paymentFormParams = buildWfpFormParams(paymentParams, wfpConfig.secretKey);
      } catch (error) {
        logger.error("[/api/checkout] Failed to generate WayForPay form params:", error);
        return NextResponse.json(
          { error: "Не вдалося створити посилання для оплати. Спробуйте пізніше або оберіть накладений платіж." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentFormParams,
    });

  } catch (err) {
    logger.error("[/api/checkout] Error:", err);
    return NextResponse.json(
      { error: "Помилка при створенні замовлення. Спробуй ще раз." },
      { status: 500 }
    );
  }
}

