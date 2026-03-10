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
import { getCatalogProductById } from "@/lib/instagram-catalog";
import { logger } from "@/lib/logger";
import { buildWfpPaymentUrl, getWfpConfig } from "@/lib/wayforpay";

// ── Отримай ці ID з Sitniks: Налаштування → Нова Пошта → ID інтеграції
const NP_INTEGRATION_ID = Number(process.env.SITNIKS_NP_INTEGRATION_ID ?? 0);
// ── Канал продажів для сайту (Налаштування → Канали продажів)
const SALES_CHANNEL_ID  = Number(process.env.SITNIKS_SALES_CHANNEL_ID ?? 0);
// ── Статус "Новий" (Налаштування → Статуси замовлень → ID)
const NEW_ORDER_STATUS  = Number(process.env.SITNIKS_NEW_STATUS_ID ?? 1);

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
  city: string;
  department?: string;
  warehouse?: string;
  departmentRef?: string;
  cityRef?: string;
  paymentMethod: "cod" | "card" | "online";
  comment?: string;
  discountAmount?: number;
  items: CheckoutItem[];
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!validateBody(body)) {
      return NextResponse.json(
        { error: "Невірний формат замовлення" },
        { status: 400 }
      );
    }

    const department = body.department ?? body.warehouse ?? "";

    // Server-side price: get products from catalog by ID, ignore frontend totalPrice
    let serverTotal = 0;
    const resolvedItems: Array<{ variationId: number; price: number; quantity: number; name: string; size?: string }> = [];

    for (const item of body.items) {
      const productId = item.id ?? item.productId;
      if (productId == null) {
        return NextResponse.json(
          { error: "Кожен товар повинен мати id або productId" },
          { status: 400 }
        );
      }
      const catalogProduct = await getCatalogProductById(Number(productId));
      if (!catalogProduct) {
        return NextResponse.json(
          { error: `Товар з ID ${productId} не знайдено в каталозі` },
          { status: 400 }
        );
      }
      const variationId = item.variationId ?? catalogProduct.variationId;
      if (variationId == null) {
        return NextResponse.json(
          { error: `Немає варіації для товару ${catalogProduct.name}` },
          { status: 400 }
        );
      }
      const price = catalogProduct.price;
      const qty = Math.max(1, Number(item.quantity) || 1);
      serverTotal += price * qty;
      resolvedItems.push({
        variationId,
        price,
        quantity: qty,
        name: item.name || catalogProduct.name,
        size: item.size,
      });
    }

    const discountAmount = Math.max(0, Number(body.discountAmount) || 0);
    const finalAmount = serverTotal - discountAmount;

    const dto: CreateOrderDto = {
      client: {
        fullname: body.name,
        phone: body.phone,
      },

      products: resolvedItems.map((item) => ({
        productVariationId: item.variationId,
        isUpsale: false,
        price: item.price,
        quantity: item.quantity,
        title: item.size ? `${item.name} (${item.size})` : item.name,
      })),

      // Нова Пошта
      ...(NP_INTEGRATION_ID > 0 ? {
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
          weight: 0.5, // дефолт, Sitniks може перерахувати
          description: body.items.map((i) => i.name).join(", "),
        }
      } : {}),

      statusId: NEW_ORDER_STATUS > 0 ? NEW_ORDER_STATUS : undefined,
      salesChannelId: SALES_CHANNEL_ID > 0 ? SALES_CHANNEL_ID : undefined,

      clientComment: body.comment,
      managerComment: `Замовлення з сайту. Оплата: ${(body.paymentMethod === "card" || body.paymentMethod === "online") ? "картка" : "накладений платіж"}`,

      // Зберігаємо унікальний ID щоб уникнути дублікатів
      externalId: `web-${Date.now()}`,
    };

    const order = await createSitniksOrder(dto);

    if (!order) {
      return NextResponse.json(
        { error: "Не вдалося створити замовлення в Sitniks CRM" },
        { status: 500 }
      );
    }

    // Generate WayForPay payment URL for online payments
    let paymentUrl: string | undefined;
    if (body.paymentMethod === "online" || body.paymentMethod === "card") {
      try {
        const wfpConfig = getWfpConfig();
        const paymentParams = {
          merchantAccount: wfpConfig.merchantAccount,
          merchantDomainName: wfpConfig.merchantDomainName,
          orderReference: String(order.orderNumber),
          orderDate: Math.floor(Date.now() / 1000),
          amount: finalAmount,
          currency: "UAH" as const,
          productName: resolvedItems.map(item => item.name),
          productPrice: resolvedItems.map(item => item.price),
          productCount: resolvedItems.map(item => item.quantity),
          returnUrl: `${wfpConfig.siteUrl}/checkout/success?ref=${order.orderNumber}&method=online`,
          serviceUrl: `${wfpConfig.siteUrl}/api/webhooks/wayforpay`,
        };
        paymentUrl = buildWfpPaymentUrl(paymentParams, wfpConfig.secretKey);
      } catch (error) {
        logger.error("[/api/checkout] Failed to generate WayForPay URL:", error);
        // Continue without payment URL - user will see error on frontend
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentUrl,
    });

  } catch (err) {
    logger.error("[/api/checkout] Error:", err);
    return NextResponse.json(
      { error: "Помилка при створенні замовлення. Спробуй ще раз." },
      { status: 500 }
    );
  }
}

