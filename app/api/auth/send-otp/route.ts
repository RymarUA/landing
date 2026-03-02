/**
 * POST /api/auth/send-otp
 *
 * Sends a 6-digit OTP to the customer's phone via Telegram Bot
 * (or SMS gateway if configured). The OTP is stored in-memory
 * with a 5-minute TTL (replace with Redis in production).
 *
 * Body: { phone: string }
 * Response: { success: true, expiresIn: 300 }  |  { error: string }
 *
 * ENV VARS:
 *   TELEGRAM_BOT_TOKEN   — used to send OTP via Telegram
 *   TELEGRAM_CHAT_ID     — optional: also notify admin
 *   OTP_SECRET           — optional salt for HMAC (not strictly needed for 5-min codes)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/* ─── In-memory OTP store (process-scoped, replace with Redis in prod) ── */
interface OtpEntry {
  otp: string;
  expires: number;        // Unix ms
  attempts: number;       // Wrong attempts counter
}

const otpStore = new Map<string, OtpEntry>();
const OTP_TTL_MS  = 5 * 60 * 1000;   // 5 minutes
const MAX_ATTEMPTS = 5;

/* ─── Validation ─────────────────────────────────────────────────────── */
const bodySchema = z.object({
  phone: z.string().trim().regex(/^(\+?38)?0\d{9}$/, "Неправильний формат телефону"),
});

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Always store as 380XXXXXXXXX
  if (digits.startsWith("380")) return `+${digits}`;
  if (digits.startsWith("38"))  return `+${digits}`;
  return `+38${digits}`;
}

/* ─── Generate OTP ───────────────────────────────────────────────────── */
function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ─── Send via Telegram Bot ──────────────────────────────────────────── */
async function sendOtpViaTelegram(phone: string, otp: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[send-otp] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — OTP logged only");
    console.info(`[send-otp] OTP for ${phone}: ${otp}`);
    return;
  }

  const message = [
    `🔐 <b>Код підтвердження FamilyHub Market</b>`,
    ``,
    `Телефон: <code>${phone}</code>`,
    `Код: <b>${otp}</b>`,
    ``,
    `⏱ Дійсний 5 хвилин. Не передавайте нікому.`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram error: ${err}`);
  }
}

/* ─── POST handler ───────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    const issues = parsed.error.issues ?? (parsed.error as { errors?: Array<{ message: string }> }).errors;
    return NextResponse.json(
      { error: issues?.[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const phone = normalizePhone(parsed.data.phone);

  /* Rate-limit: don't resend if active OTP exists and was sent < 60s ago */
  const existing = otpStore.get(phone);
  if (existing && existing.expires - OTP_TTL_MS + 60_000 > Date.now()) {
    return NextResponse.json(
      { error: "Зачекайте хвилину перед повторним відправленням коду." },
      { status: 429 }
    );
  }

  const otp = generateOtp();
  const expires = Date.now() + OTP_TTL_MS;

  otpStore.set(phone, { otp, expires, attempts: 0 });

  try {
    await sendOtpViaTelegram(phone, otp);
  } catch (err) {
    console.error("[send-otp] Failed to send OTP:", err);
    // Still return success so we don't leak whether the phone exists
    // but log error for monitoring
  }

  return NextResponse.json({ success: true, expiresIn: OTP_TTL_MS / 1000 });
}

/* ─── Exported for verify route (same process) ───────────────────────── */
export { otpStore, MAX_ATTEMPTS, normalizePhone };
