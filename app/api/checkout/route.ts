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
import { createSitniksOrder } from "@/lib/sitniks-consolidated";
import { createNovaPoshtaTTN } from "@/lib/novaposhta-create-ttn";
import { normalizePhone } from "@/lib/phone-utils";
import { getCatalogProductById } from "@/lib/instagram-catalog";
import { logger } from "@/lib/logger";
import { buildWfpFormParams, getWfpConfig, sanitizeProductName } from "@/lib/wayforpay";
import { getCurrentUser } from "@/lib/auth-helpers";
import { savePendingOrder } from "@/lib/pending-orders-store";

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

    const department = body.warehouse ?? body.department ?? "";
    const departmentRef = body.departmentRef ?? "";
    
    console.log("[/api/checkout] Received data:");
    console.log("  cityRef:", body.cityRef);
    console.log("  departmentRef:", departmentRef);
    console.log("  city:", body.city);
    console.log("  warehouse:", body.warehouse);

    // Server-side price: get products from catalog by ID, ignore frontend totalPrice
    let serverTotalCents = 0;
    let sitnicsAvailable = true; // track if Sitniks API responded
    const resolvedItems: Array<{ variationId: number; price: number; quantity: number; name: string; size?: string; weight: number }> = [];

    for (const item of body.items) {
      const productId = item.productId ?? item.id;
      if (productId == null) {
        return NextResponse.json(
          { error: "Кожен товар повинен мати id або productId" },
          { status: 400 }
        );
      }
      
      let catalogProduct = await getCatalogProductById(Number(productId));
      
      if (!catalogProduct) {
        sitnicsAvailable = false;
        console.warn(`[checkout] Product lookup timed out or failed, using fallback data for productId=${Number(productId)}`);
        logger.warn("[checkout] Product not found in Sitniks (timeout?), using fallback data from request", {
          requestProductId: Number(productId),
          itemSize: item.size,
        });
        
        // Fallback: use request data when Sitniks is unavailable
        catalogProduct = {
          id: Number(productId),
          name: item.name || `Товар #${productId}`,
          price: item.price || 0,
          weight: item.weight || 0.3, // Use actual weight from request or default 0.3kg
          variationId: item.variationId || Number(productId),
          allVariations: [],
        };
      }
      
      // Find variation by size if specified
      const explicitVariationId = item.variationId ?? (item.productId != null ? undefined : item.id);
      let variationId = explicitVariationId ?? catalogProduct.variationId ?? productId;
      let price = catalogProduct.price;
      // Sitniks stores weight in grams, Nova Poshta expects kilograms
      let weight = catalogProduct.weight ? catalogProduct.weight / 1000 : 0.5;
      
      if (item.size && catalogProduct.allVariations?.length) {
        // Reverse mapping: Latin size -> Numeric size for Sitniks
        const reverseSizeMapping: Record<string, string> = {
          "S": "36",
          "M": "38", 
          "L": "40",
          "XL": "42",
          "XXL": "44",
          "XXXL": "46"
        };
        
        // Try both original size and mapped size
        const sizesToTry = [item.size];
        const mappedSize = reverseSizeMapping[item.size];
        if (mappedSize) {
          sizesToTry.push(mappedSize);
        }
        
        const matchingVariation = catalogProduct.allVariations.find(v => 
          v.properties.some(p => 
            (p.name === "Розмір" || p.name === "size") && 
            sizesToTry.includes(p.value)
          )
        );
        if (matchingVariation) {
          variationId = matchingVariation.id;
          price = matchingVariation.price;
        }
      }
      
      const qty = Math.max(1, Number(item.quantity) || 1);
      serverTotalCents += Math.round(price * 100) * qty;
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
    let serverDiscountAmountCents = 0;
    
    if (body.promoCode) {
      const promoResult = applyPromoCode(body.promoCode);
      if (promoResult) {
        // Calculate discount based on server total (in cents)
        serverDiscountAmountCents = Math.round(serverTotalCents * promoResult.discountPct / 100);
        console.log(`[checkout] Promo code ${body.promoCode} applied: ${promoResult.discountPct}% = ${serverDiscountAmountCents / 100} UAH`);
      } else {
        console.warn(`[checkout] Invalid promo code: ${body.promoCode}`);
      }
    }
    
    // Add online payment discount if applicable
    let onlinePaymentDiscountCents = 0;
    if (body.paymentMethod === "online" || body.paymentMethod === "card") {
      onlinePaymentDiscountCents = Math.round((serverTotalCents - serverDiscountAmountCents) * 0.05);
    }
    
    // Total discount is promo discount + online payment discount
    const totalServerDiscountCents = serverDiscountAmountCents + onlinePaymentDiscountCents;
    
    // SECURITY: Always use server-calculated discount, ignore client-requested amount
    // Client could manipulate discountAmount to reduce their discount
    const discountAmountCents = Math.min(totalServerDiscountCents, serverTotalCents);
    const discountAmount = discountAmountCents / 100;
    
    // Log if client sent different discount (for debugging)
    const requestedDiscount = Math.max(0, Number(body.discountAmount) || 0);
    if (Math.round(requestedDiscount * 100) !== totalServerDiscountCents) {
      console.warn(`[checkout] Client discount ignored: client=${requestedDiscount}, server=${totalServerDiscountCents / 100}, applied=${discountAmount}`);
    }

    const paymentItems = buildPaymentItemsForWayForPay(resolvedItems, discountAmount);
    // Calculate final amount in cents to avoid floating point precision issues
    const finalAmountCents = paymentItems.reduce((sum, item) => {
      const itemCents = Math.round(item.lineTotal * 100);
      return sum + itemCents;
    }, 0);
    const finalAmount = finalAmountCents / 100;

    // Calculate discounted price per product for Sitniks CRM
    // Distribute discount proportionally across all items
    const productsWithDiscount = resolvedItems.map((item, index) => {
      // const originalLineTotal = item.price * item.quantity;
      const discountedLineTotal = paymentItems[index].lineTotal;
      const discountedPriceCents = item.quantity > 0 
        ? Math.round((discountedLineTotal / item.quantity) * 100)
        : Math.round(item.price * 100);
      const discountedPrice = discountedPriceCents / 100;
      
      return {
        ...item,
        discountedPrice,
        originalPrice: item.price,
      };
    });

    // Calculate total weight from products
    let totalWeight = 0;
    for (const item of resolvedItems) {
      totalWeight += item.weight * item.quantity;
    }
    // Minimum weight 0.1kg for Nova Poshta (not 0.5kg to preserve actual product weights)
    totalWeight = Math.max(0.1, totalWeight);

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
      if (serverDiscountAmountCents > 0) {
        discountParts.push(`Промокод: ${serverDiscountAmountCents / 100} грн`);
      }
      if (onlinePaymentDiscountCents > 0) {
        discountParts.push(`Онлайн-оплата: ${onlinePaymentDiscountCents / 100} грн`);
      }
      managerComment += `. Знижка: ${discountParts.join(", ")} (всього: ${discountAmount} грн)`;
    }

    const isOnlinePayment = body.paymentMethod === "online" || body.paymentMethod === "card";

    const dto: CreateOrderDto = {
      client: {
        fullname: body.name,
        phone: phone,
        email: body.email,
      },

      products: productsWithDiscount.map((item) => ({
        productVariationId: item.variationId,
        isUpsale: false,
        price: item.discountedPrice, // Use discounted price so CRM total matches payment
        quantity: item.quantity,
        title: item.size ? `${item.name} (${item.size})` : item.name,
      })),

      // Нова Пошта
      ...(NP_INTEGRATION_ID > 0 && body.cityRef && departmentRef ? {
        npDelivery: {
          integrationNovaposhtaId: NP_INTEGRATION_ID,
          price: finalAmount,
          seatsAmount: 1,
          city: body.city,
          cityRef: body.cityRef,
          department,
          departmentRef: departmentRef,
          serviceType: "WarehouseWarehouse",
          payerType: "Recipient",
          cargoType: "Parcel",
          // Nova Poshta rule: NonCash only available when payerType is Sender
          // For online payment (already paid by card), recipient pays delivery in cash at warehouse
          paymentMethod: "Cash",
          // Если оплачено онлайн - без доплаты, иначе - с доплатой при получении
          productPaymentMethod: isOnlinePayment ? "payment-control" : "postpaid",
          weight: totalWeight,
          description: resolvedItems.map((i) => `${i.name} x${i.quantity}`).join(", "),
        }
      } : {}),

      ...(SALES_CHANNEL_ID > 0 ? { salesChannelId: SALES_CHANNEL_ID } : {}),
      // COD orders created with "Новий" status; online orders created AFTER payment (see below)
      ...(NEW_ORDER_STATUS > 0 ? { statusId: NEW_ORDER_STATUS } : {}),

      clientComment: body.comment,
      managerComment: managerComment,

      externalId: `web-${Date.now()}${currentUser ? `-user-${currentUser.userId}` : ""}`,
    };

    // ── Online payments: save order data to pending store, create Sitniks order AFTER payment ──
    if (isOnlinePayment) {
      let onlineStep = "start";
      let orderRef = "";
      try {
        onlineStep = "getWfpConfig";
        console.warn(`[/api/checkout] Online payment flow started. amount=${finalAmount}`);
        const wfpConfig = getWfpConfig();
        // CRITICAL: Use crypto.randomUUID() to prevent collisions when multiple users checkout simultaneously
        // Format: op_{uuid} - guaranteed unique even with concurrent requests
        onlineStep = "createOrderRef";
        orderRef = `op_${crypto.randomUUID()}`;
        console.warn(`[/api/checkout] Online payment orderRef created: ${orderRef}`);

        // Store full order DTO for later creation in Sitniks after payment confirmed
        onlineStep = "savePendingOrder";
        console.warn(`[/api/checkout] Saving pending order: ${orderRef}`);
        await savePendingOrder(orderRef, {
          orderRef,
          dto: dto as unknown as Record<string, unknown>,
          amount: finalAmount,
          customerName: body.name,
          customerPhone: phone,
          createdAt: Date.now(),
          // Save NP delivery data for TTN creation after payment confirmed
          ...(body.cityRef && body.departmentRef ? {
            npDelivery: {
              cityRef: body.cityRef,
              departmentRef: body.departmentRef,
              recipientName: body.name,
              recipientPhone: phone,
              description: resolvedItems.map((i) => `${i.name} x${i.quantity}`).join(", "),
              weight: totalWeight,
              cost: finalAmount,
            }
          } : {}),
        });
        console.warn(`[/api/checkout] Pending order saved successfully: ${orderRef}`);

        onlineStep = "buildPaymentParams";
        const paymentParams = {
          merchantAccount: wfpConfig.merchantAccount,
          merchantDomainName: wfpConfig.merchantDomainName,
          orderReference: orderRef,
          orderDate: Math.floor(Date.now() / 1000),
          amount: finalAmount,
          currency: "UAH" as const,
          productName: paymentItems.map((item) => {
            const label = item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name;
            return sanitizeProductName(label);
          }),
          productPrice: paymentItems.map((item) => {
            const priceCents = Math.round(item.lineTotal * 100);
            return (priceCents / 100).toFixed(2);
          }),
          productCount: paymentItems.map(() => 1),
          returnUrl: `${wfpConfig.siteUrl}/api/payment/return`,
          serviceUrl: `${wfpConfig.siteUrl}/api/webhooks/wayforpay`,
        };
        onlineStep = "buildWfpFormParams";
        const paymentFormParams = buildWfpFormParams(paymentParams, wfpConfig.secretKey);

        console.warn(`[/api/checkout] Online payment pending, orderRef=${orderRef}, amount=${finalAmount}`);

        return NextResponse.json({
          success: true,
          pending: true,
          orderRef,
          paymentFormParams,
        });
      } catch (error) {
        console.error(`[/api/checkout] Online payment flow failed at step=${onlineStep} orderRef=${orderRef || "n/a"}`, error);
        logger.error("[/api/checkout] Failed to prepare online payment:", error);
        return NextResponse.json(
          { error: "Не вдалося створити посилання для оплати. Спробуйте пізніше або оберіть накладений платіж." },
          { status: 500 }
        );
      }
    }

    // ── COD orders: create Sitniks order immediately ──
    console.log("[/api/checkout] Creating COD order in Sitniks:", JSON.stringify(dto, null, 2));
    const order = await createSitniksOrder(dto);

    if (!order) {
      return NextResponse.json(
        { error: "Не вдалося створити замовлення в Sitniks CRM" },
        { status: 500 }
      );
    }

    // Автоматичне створення ТТН, якщо є дані Нової Пошти
    let ttnNumber: string | undefined;
    
    if (!sitnicsAvailable) {
      console.warn(`[/api/checkout] Sitniks недоступний — використано fallback. ТТН буде створено з даними з форми.`);
    }
    
    if (body.cityRef && body.departmentRef) {
      console.log(`[/api/checkout] Створення ТТН для замовлення ${order.orderNumber}`);
      const senderCityRef = process.env.NOVAPOSHTA_SENDER_CITY_REF;
      const senderWarehouseRef = process.env.NOVAPOSHTA_SENDER_WAREHOUSE_REF;
      const senderCounterpartyRef = process.env.NOVAPOSHTA_SENDER_COUNTERPARTY_REF;
      const senderContactRef = process.env.NOVAPOSHTA_SENDER_CONTACT_REF;
      const senderPhone = process.env.NOVAPOSHTA_SENDER_PHONE;

      if (!senderCityRef || !senderWarehouseRef || !senderCounterpartyRef || !senderContactRef || !senderPhone) {
        console.warn('[/api/checkout] Не задані змінні відправника НП. ТТН не буде створено. Потрібно: NOVAPOSHTA_SENDER_CITY_REF, NOVAPOSHTA_SENDER_WAREHOUSE_REF, NOVAPOSHTA_SENDER_COUNTERPARTY_REF, NOVAPOSHTA_SENDER_CONTACT_REF, NOVAPOSHTA_SENDER_PHONE');
      } else {
        try {
          console.log(`[/api/checkout] Створення ТТН для замовлення ${order.orderNumber}`);
          const ttnResult = await createNovaPoshtaTTN({
            senderCityRef,
            senderWarehouseRef,
            senderCounterpartyRef,
            senderContactRef,
            senderPhone,
            recipientCityRef: body.cityRef,
            recipientWarehouseRef: body.departmentRef,
            recipientName: body.name,
            recipientPhone: phone,
            description: resolvedItems.map((i) => `${i.name} x${i.quantity}`).join(", "),
            weight: totalWeight,
            cost: finalAmount,
            seatsAmount: 1,
            paymentMethod: isOnlinePayment ? 'NonCash' : 'Cash',
            payerType: 'Recipient',
            backwardDeliveryMoney: isOnlinePayment ? undefined : finalAmount
          });

          if (ttnResult.success && ttnResult.ttn) {
            ttnNumber = ttnResult.ttn;
            console.log(`[/api/checkout] ✓ ТТН створено: ${ttnNumber}`);
          } else {
            console.warn(`[/api/checkout] Не вдалося створити ТТН: ${ttnResult.error}`);
          }
        } catch (ttnError) {
          console.error('[/api/checkout] Помилка створення ТТН:', ttnError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      ttn: ttnNumber
    });

  } catch (err) {
    logger.error("[/api/checkout] Error:", err);
    return NextResponse.json(
      { error: "Помилка при створенні замовлення. Спробуй ще раз." },
      { status: 500 }
    );
  }
}

