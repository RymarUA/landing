/**
 * POST /api/notify-shipping
 *
 * Admin-only: notify about shipment, update Sitniks to "shipped".
 * Protected by x-admin-secret header.
 *
 * Body: { phone, orderReference, ttn, estimatedDate? }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";
import { updateSitniksOrder } from "@/lib/sitniks";

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const sent = req.headers.get("x-admin-secret") ?? "";

  if (!adminSecret || sent !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const orderReference = typeof b.orderReference === "string" ? b.orderReference.trim() : "";
  const ttn = typeof b.ttn === "string" ? b.ttn.trim() : "";
  const estimatedDate = typeof b.estimatedDate === "string" ? b.estimatedDate.trim() : undefined;

  if (!orderReference || !ttn) {
    return NextResponse.json(
      { error: "Потрібні orderReference та ttn" },
      { status: 400 }
    );
  }

  const msg = [
    "📦 Замовлення " + orderReference + " відправлено",
    "ТТН: " + ttn,
    estimatedDate ? "Очікувана доставка: " + estimatedDate : "",
  ]
    .filter(Boolean)
    .join("\n");

  sendTelegramNotification(msg).catch((err) =>
    console.error("[notify-shipping] Telegram failed:", err)
  );

  await updateSitniksOrder(orderReference, "shipped");

  return NextResponse.json({ ok: true });
}
