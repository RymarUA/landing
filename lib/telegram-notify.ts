/**
 * lib/telegram-notify.ts
 *
 * Telegram Bot notification helpers used in the checkout flow.
 *
 * ENV VARS:
 *   TELEGRAM_BOT_TOKEN   — bot token from @BotFather
 *   TELEGRAM_CHAT_ID     — target chat/channel ID (can be group, private, or channel with -100 prefix)
 *
 * Both variables are optional at runtime: if missing, notifications are
 * silently skipped (console.warn is emitted) so the checkout never breaks.
 */

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */

export interface TelegramOrderPayload {
  orderId: string | number;
  name: string;
  phone: string;
  city: string;
  warehouse: string;
  comment?: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  totalPrice: number;
}

export interface TelegramShippingPayload {
  orderId: string | number;
  customerName: string;
  customerPhone: string;
  trackingNumber: string;        // Nova Poshta TTN
  estimatedDelivery?: string;    // e.g. "2026-03-05"
}

/* ─────────────────────────────────────────────────────────────────────────
   Core sender
   ───────────────────────────────────────────────────────────────────────── */

async function sendTelegramMessage(html: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   🛒 New order notification
   ───────────────────────────────────────────────────────────────────────── */

export async function notifyNewOrder(payload: TelegramOrderPayload): Promise<void> {
  const itemLines = payload.items
    .map((i) => `  • ${escapeHtml(i.name)} × ${i.quantity} = <b>${(i.price * i.quantity).toLocaleString("uk-UA")} грн</b>`)
    .join("\n");

  const message = [
    `🛒 <b>Нове замовлення #${payload.orderId}</b>`,
    "",
    `👤 <b>Покупець:</b> ${escapeHtml(payload.name)}`,
    `📞 <b>Телефон:</b> <code>${escapeHtml(payload.phone)}</code>`,
    `📦 <b>Доставка:</b> ${escapeHtml(payload.city)}, ${escapeHtml(payload.warehouse)}`,
    payload.comment ? `💬 <b>Коментар:</b> ${escapeHtml(payload.comment)}` : null,
    "",
    `🧾 <b>Товари:</b>`,
    itemLines,
    "",
    `💰 <b>Сума:</b> ${payload.totalPrice.toLocaleString("uk-UA")} грн`,
    `💳 <b>Оплата:</b> WayForPay (онлайн)`,
    "",
    `⏰ ${new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    await sendTelegramMessage(message);
  } catch (err) {
    console.error("[telegram] notifyNewOrder failed", err);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   ✅ Payment confirmed notification
   ───────────────────────────────────────────────────────────────────────── */

export async function notifyPaymentConfirmed(
  orderId: string | number,
  amount: number,
  paymentSystem: string
): Promise<void> {
  const message = [
    `✅ <b>Оплачено! Замовлення #${orderId}</b>`,
    "",
    `💳 <b>Сума:</b> ${amount.toLocaleString("uk-UA")} грн`,
    `🏦 <b>Спосіб:</b> ${escapeHtml(paymentSystem)}`,
    `📌 <b>Статус:</b> Оплачено → передати в обробку`,
    "",
    `⏰ ${new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}`,
  ].join("\n");

  try {
    await sendTelegramMessage(message);
  } catch (err) {
    console.error("[telegram] notifyPaymentConfirmed failed", err);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   🚚 Shipping notification (call from admin panel or manually)
   ───────────────────────────────────────────────────────────────────────── */

export async function notifyOrderShipped(payload: TelegramShippingPayload): Promise<void> {
  const message = [
    `🚚 <b>Замовлення #${payload.orderId} відправлено!</b>`,
    "",
    `👤 ${escapeHtml(payload.customerName)}`,
    `📞 <code>${escapeHtml(payload.customerPhone)}</code>`,
    `📬 <b>ТТН Нової Пошти:</b> <code>${escapeHtml(payload.trackingNumber)}</code>`,
    payload.estimatedDelivery ? `📅 <b>Очікувана доставка:</b> ${escapeHtml(payload.estimatedDelivery)}` : null,
    "",
    `🔍 Відстеження: https://novaposhta.ua/tracking/?cargo_number=${payload.trackingNumber}`,
    "",
    `⏰ ${new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    await sendTelegramMessage(message);
  } catch (err) {
    console.error("[telegram] notifyOrderShipped failed", err);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   🔔 Generic admin alert (for webhooks, errors, etc.)
   ───────────────────────────────────────────────────────────────────────── */

export async function notifyAdmin(text: string): Promise<void> {
  try {
    await sendTelegramMessage(`🔔 <b>FamilyHub Market</b>\n\n${text}`);
  } catch (err) {
    console.error("[telegram] notifyAdmin failed", err);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Utility
   ───────────────────────────────────────────────────────────────────────── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
