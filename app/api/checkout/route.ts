import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/checkout-schema";

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/checkout
   Validates order data and sends a notification to Telegram.

   ENV VARS (set in .env.local or Vercel dashboard):
     TELEGRAM_BOT_TOKEN — token from @BotFather
     TELEGRAM_CHAT_ID   — your personal or group chat id
   ───────────────────────────────────────────────────────────────────────── */

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Telegram not configured — log in dev, skip silently in preview
    console.warn("[checkout] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[checkout] Telegram API error:", body);
    throw new Error("Telegram notification failed");
  }
}

function buildTelegramMessage(
  order: {
    name: string;
    phone: string;
    city: string;
    warehouse: string;
    comment?: string;
    paymentMethod: "cod" | "prepay";
    items: Array<{ id: number; name: string; price: number; quantity: number }>;
    totalPrice: number;
  }
): string {
  const payLabel = order.paymentMethod === "cod" ? "Накладений платіж" : "Передоплата";
  const itemLines = order.items
    .map((it) => `  • ${it.name} × ${it.quantity} = ${(it.price * it.quantity).toLocaleString("uk-UA")} грн`)
    .join("\n");

  return (
    `🛒 <b>Нове замовлення — FamilyHub Market</b>\n\n` +
    `👤 <b>Ім'я:</b> ${order.name}\n` +
    `📞 <b>Телефон:</b> ${order.phone}\n` +
    `🏙 <b>Місто:</b> ${order.city}\n` +
    `📦 <b>Відділення НП:</b> ${order.warehouse}\n` +
    `💳 <b>Оплата:</b> ${payLabel}\n` +
    (order.comment ? `💬 <b>Коментар:</b> ${order.comment}\n` : "") +
    `\n<b>Товари:</b>\n${itemLines}\n\n` +
    `💰 <b>Сума:</b> ${order.totalPrice.toLocaleString("uk-UA")} грн`
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate form fields
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Невалідні дані", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, phone, city, warehouse, comment, paymentMethod } = parsed.data;

    // Validate cart items (basic check)
    const items: Array<{ id: number; name: string; price: number; quantity: number }> =
      Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "Кошик порожній" }, { status: 400 });
    }

    const totalPrice: number =
      typeof body.totalPrice === "number"
        ? body.totalPrice
        : items.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0);

    const message = buildTelegramMessage({ name, phone, city, warehouse, comment, paymentMethod, items, totalPrice });

    await sendTelegram(message);

    return NextResponse.json({ success: true, orderId: Date.now().toString(36).toUpperCase() });
  } catch (err: unknown) {
    console.error("[checkout] Unhandled error:", err);
    return NextResponse.json(
      { error: "Сталася помилка сервера. Спробуйте пізніше або зв'яжіться з нами в Instagram." },
      { status: 500 }
    );
  }
}
