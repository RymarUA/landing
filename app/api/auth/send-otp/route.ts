/**
 * POST /api/auth/send-otp
 *
 * Sends 6-digit OTP via Telegram to admin chat (admin forwards to customer or bot in group).
 * Stores OTP in memory (otp:{phone}), TTL 5 min.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  setOtp,
  normalizePhoneForAuth,
  canSendOtpByPhone,
  recordOtpSentByPhone,
  canSendOtpByIp,
  recordOtpSentByIp,
} from "@/lib/otp-store";
import { sendTelegramNotification } from "@/lib/telegram";

const PHONE_REGEX = /^\+?3?8?0\d{9}$/;
const OTP_TTL_MS = 5 * 60 * 1000;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (!canSendOtpByIp(ip)) {
    return NextResponse.json(
      { error: "Забагато спроб. Спробуйте через 15 хвилин." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phoneRaw =
    typeof body === "object" && body !== null && "phone" in body
      ? String((body as { phone: unknown }).phone ?? "").trim()
      : "";

  if (!PHONE_REGEX.test(phoneRaw.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Невірний формат телефону" }, { status: 400 });
  }

  const phone = normalizePhoneForAuth(phoneRaw);

  if (!canSendOtpByPhone(phone)) {
    return NextResponse.json(
      { error: "Зачекайте хвилину перед повторним запитом коду." },
      { status: 429 }
    );
  }

  const code = generateOtp();
  setOtp(phone, code, OTP_TTL_MS);
  recordOtpSentByPhone(phone);
  recordOtpSentByIp(ip);

  const message = `🔐 OTP для ${phone}: ${code}\nДійсний 5 хвилин.`;
  sendTelegramNotification(message).catch((err) =>
    console.error("[auth/send-otp] Telegram failed:", err)
  );

  return NextResponse.json({ ok: true });
}
