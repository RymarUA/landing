/**
 * POST /api/sitniks-webhook
 *
 * Receives status-change events from Sitniks CRM.
 * Sitniks sends a POST request when an order status changes.
 *
 * Expected payload from Sitniks:
 * {
 *   "order_id": "1042",
 *   "order_reference": "FHM-1234567890000",   // optional
 *   "status": "Відправлено",
 *   "ttn": "20400123456789",                  // Nova Poshta TTN
 *   "comment": "..."
 * }
 *
 * ENV VARS:
 *   SITNIKS_WEBHOOK_SECRET  — optional shared secret for request verification
 *
 * Security:
 *   If SITNIKS_WEBHOOK_SECRET is set, the request must include
 *   header X-Sitniks-Secret matching it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

interface SitniksWebhookPayload {
  order_id?: string | number;
  order_reference?: string;
  status?: string;
  ttn?: string;
  contact_phone?: string;
  contact_name?: string;
  comment?: string;
  [key: string]: unknown;
}

/* ── Status labels to emoji ── */
const STATUS_EMOJI: Record<string, string> = {
  "Очікує оплати":  "⏳",
  "Оплачено":       "✅",
  "В обробці":      "🔄",
  "Відправлено":    "🚚",
  "Доставлено":     "📦",
  "Скасовано":      "❌",
};

export async function POST(req: NextRequest) {
  /* ── Verify shared secret (optional) ── */
  const secret = process.env.SITNIKS_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers.get("x-sitniks-secret") ?? "";
    if (incoming !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: SitniksWebhookPayload;
  try {
    body = (await req.json()) as SitniksWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    order_id,
    order_reference,
    status,
    ttn,
    contact_phone,
    contact_name,
    comment,
  } = body;

  if (!order_id && !order_reference) {
    return NextResponse.json({ error: "Missing order_id or order_reference" }, { status: 400 });
  }

  const orderId = order_reference ?? String(order_id);
  const emoji   = (status && STATUS_EMOJI[status]) ?? "📋";

  /* ── Send Telegram notification ── */
  const lines = [
    `${emoji} Оновлення замовлення ${orderId}`,
    "",
    status   ? `📌 Статус: ${status}`      : "",
    ttn      ? `📦 ТТН: ${ttn}`            : "",
    contact_name  ? `👤 ${contact_name}`   : "",
    contact_phone ? `📞 ${contact_phone}`  : "",
    comment  ? `💬 ${comment}`             : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Fire-and-forget — don't block response
  sendTelegramNotification(lines).catch((err) =>
    console.error("[sitniks-webhook] Telegram failed:", err)
  );

  // TODO: If you store orders in a DB, update TTN and status here.
  // Example:
  //   if (ttn && orderId) {
  //     await db.orders.update({ where: { reference: orderId }, data: { ttn, status } });
  //   }

  return NextResponse.json({ received: true, orderId, status: status ?? null });
}
