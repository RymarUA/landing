/**
 * lib/telegram.ts
 *
 * Telegram Bot API — send raw message to admin chat.
 * Used for new order, payment confirmed, new subscription, OTP, shipping.
 *
 * ENV VARS:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — target chat/channel ID
 *
 * Timeout: 5000ms. On error: console.error only, no throw.
 */

const SEND_TIMEOUT_MS = 5000;

export async function sendTelegramNotification(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] API error", res.status, body);
    }
  } catch (err) {
    console.error("[telegram]", err);
  } finally {
    clearTimeout(timeout);
  }
}
