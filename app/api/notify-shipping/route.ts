/**
 * POST /api/notify-shipping
 *
 * Internal admin endpoint to notify a customer that their order was shipped.
 * Protected by ADMIN_SECRET env var (passed as Authorization: Bearer <secret>).
 *
 * Body:
 *   { orderId, customerName, customerPhone, trackingNumber, estimatedDelivery? }
 *
 * ENV VARS:
 *   ADMIN_SECRET        — a random secret string set in Vercel to protect this endpoint
 *   TELEGRAM_BOT_TOKEN  — used by telegram-notify
 *   TELEGRAM_CHAT_ID    — used by telegram-notify
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyOrderShipped, notifyAdmin } from "@/lib/telegram-notify";

const shippingSchema = z.object({
  orderId: z.union([z.string().min(1), z.number()]),
  customerName: z.string().min(1),
  customerPhone: z.string().min(7),
  trackingNumber: z.string().min(10, "Невірний формат ТТН"),
  estimatedDelivery: z.string().optional(),
});

export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (token !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  /* ── Parse body ── */
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = shippingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  /* ── Send Telegram notification ── */
  try {
    await notifyOrderShipped({
      orderId: data.orderId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      trackingNumber: data.trackingNumber,
      estimatedDelivery: data.estimatedDelivery,
    });

    console.info(`[notify-shipping] Shipping notification sent for order #${data.orderId}`);
    return NextResponse.json({ success: true, message: "Сповіщення надіслано" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[notify-shipping] Failed:", msg);
    return NextResponse.json({ error: "Помилка надсилання сповіщення", detail: msg }, { status: 500 });
  }
}
