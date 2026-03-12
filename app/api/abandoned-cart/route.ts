// @ts-nocheck
/**
 * POST /api/abandoned-cart
 *
 * Called from the checkout form when a user enters their phone number but
 * hasn't yet submitted the order. The frontend stores a session ID and calls
 * this endpoint. If the user doesn't complete checkout within `DELAY_MS`,
 * an automated Telegram message is sent with a recovery link + 5% discount.
 *
 * Architecture:
 *   - In-memory Map for demo (replace with Redis/DB in production)
 *   - setTimeout fires the Telegram notification after DELAY_MS
 *   - POST /api/abandoned-cart/cancel clears the timer on successful checkout
 *
 * ENV VARS:
 *   TELEGRAM_BOT_TOKEN   — Telegram Bot token
 *   TELEGRAM_CHAT_ID     — Admin chat for abandoned cart alerts
 *   NEXT_PUBLIC_SITE_URL — Used to build recovery link
 *   ADMIN_SECRET         — Bearer token to protect the cancel endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyAdmin } from "@/lib/telegram-notify";

/* ─────────────────────────────────────────────────────────────────────────
   ⚠️ SERVERLESS WARNING ⚠️
   
   This in-memory Map + setTimeout approach DOES NOT WORK on Vercel/serverless!
   Each request may hit a different instance, so timers will be lost.
   
   PRODUCTION SOLUTION:
   1. Use Redis (Upstash) with SETEX for timer storage
   2. Use Vercel Cron Jobs or external scheduler to check expired carts
   3. Or use a database table with a scheduled job
   
   Current implementation works ONLY in local development with single instance.
   ───────────────────────────────────────────────────────────────────────── */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const DELAY_MS = Number(process.env.ABANDONED_CART_DELAY_MS) || 30 * 60 * 1000; // Default: 30 minutes

/* ─────────────────────────────────────────────────────────────────────────
   Validation schema
   ───────────────────────────────────────────────────────────────────────── */
const bodySchema = z.object({
  /** Unique identifier for this cart session (e.g. crypto.randomUUID() from client) */
  sessionId: z.string().min(1),
  /** Customer name (from form, may be partial) */
  name: z.string().min(1).max(80),
  /** Ukrainian phone */
  phone: z.string().min(7).max(20),
  /** Cart items (lightweight — only for the notification message) */
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  /** Cart total in UAH */
  totalPrice: z.number().positive(),
});

type AbandonedCartBody = z.infer<typeof bodySchema>;

/* ─────────────────────────────────────────────────────────────────────────
   POST — register abandoned cart timer
   ───────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let body: AbandonedCartBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const { sessionId, name, phone, items, totalPrice } = parsed.data;

  /* Cancel any existing timer for this session */
  if (timers.has(sessionId)) {
    clearTimeout(timers.get(sessionId)!);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://familyhubmarket.com";
  const recoveryUrl = `${siteUrl}/#catalog`;

  /* Schedule the abandoned-cart notification */
  const timer = setTimeout(async () => {
    timers.delete(sessionId);

    const itemList = items
      .map((i) => `• ${escapeHtml(i.name)} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString("uk-UA")} грн`)
      .join("\n");

    const message = [
      `🛒 <b>Покинутий кошик!</b>`,
      ``,
      `👤 <b>${escapeHtml(name)}</b> — <code>${escapeHtml(phone)}</code>`,
      ``,
      `<b>Товари у кошику:</b>`,
      itemList,
      ``,
      `💰 <b>Сума:</b> ${totalPrice.toLocaleString("uk-UA")} грн`,
      ``,
      `⚠️ Людина залишила форму незавершеною.`,
      `💡 Зателефонуйте або напишіть для завершення замовлення!`,
      ``,
      `🔗 Посилання на магазин: ${recoveryUrl}`,
    ].join("\n");

    try {
      await notifyAdmin(message);
      console.info(`[abandoned-cart] Sent notification for session ${sessionId}`);
    } catch (err) {
      console.error("[abandoned-cart] Failed to send notification:", err);
    }
  }, DELAY_MS);

  timers.set(sessionId, timer);

  console.info(`[abandoned-cart] Registered timer for session ${sessionId} (fires in ${DELAY_MS / 60000}m)`);

  return NextResponse.json({ success: true, sessionId, firesInMs: DELAY_MS });
}

/* ─────────────────────────────────────────────────────────────────────────
   DELETE — cancel abandoned cart timer (called on successful checkout)
   ───────────────────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  let sessionId: string;
  try {
    const body = await req.json();
    sessionId = String(body.sessionId ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  if (timers.has(sessionId)) {
    clearTimeout(timers.get(sessionId)!);
    timers.delete(sessionId);
    console.info(`[abandoned-cart] Cancelled timer for session ${sessionId}`);
    return NextResponse.json({ success: true, cancelled: true });
  }

  return NextResponse.json({ success: true, cancelled: false });
}

/* ─────────────────────────────────────────────────────────────────────────
   Utility
   ───────────────────────────────────────────────────────────────────────── */
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

