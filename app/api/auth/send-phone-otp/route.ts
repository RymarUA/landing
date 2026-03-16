/**
 * POST /api/auth/send-phone-otp
 *
 * Sends 6-digit OTP via SMS to new phone number for phone change.
 * Requires authenticated user (email-based login).
 * Stores OTP in memory (otp:{phone}), TTL 5 min.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import {
  setOtp,
  normalizePhoneForAuth,
  canSendOtpByPhone,
  recordOtpSentByPhone,
  canSendOtpByIp,
  recordOtpSentByIp,
} from "@/lib/otp-store";

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
  // Verify authentication
  const token = req.cookies.get("fhm_auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyJwt(token, process.env.JWT_SECRET ?? "dev-secret-change-in-production");
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Check if user has email (phone-only users shouldn't be able to update phone)
  if (!payload.email) {
    return NextResponse.json({ error: "Phone update not available for phone accounts" }, { status: 400 });
  }

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

  if (!phoneRaw) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  if (!PHONE_REGEX.test(phoneRaw.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Невірний формат телефону" }, { status: 400 });
  }

  const identifier = normalizePhoneForAuth(phoneRaw);

  if (!canSendOtpByPhone(identifier)) {
    return NextResponse.json(
      { error: "Зачекайте хвилину перед повторним запитом коду." },
      { status: 429 }
    );
  }

  const code = generateOtp();
  setOtp(identifier, code, OTP_TTL_MS);
  recordOtpSentByPhone(identifier);
  recordOtpSentByIp(ip);

  try {
    // Send OTP via SMS with fallback to Telegram
    const message = `🔐 OTP для зміни телефону: ${code}\nДійсний 5 хвилин.`;
    try {
      const { sendOtpSms } = await import("@/lib/sms");
      const smsResult = await sendOtpSms(identifier, code);
      if (!smsResult.success) {
        console.error("[auth/send-phone-otp] SMS failed:", smsResult.error);
        // Fallback to Telegram if SMS fails
        const { sendTelegramNotification } = await import("@/lib/telegram");
        sendTelegramNotification(message).catch((err) =>
          console.error("[auth/send-phone-otp] Telegram fallback failed:", err)
        );
      }
    } catch (err: any) {
      console.error("[auth/send-phone-otp] SMS service error:", err);
      // Fallback to Telegram if SMS service fails
      const { sendTelegramNotification } = await import("@/lib/telegram");
      sendTelegramNotification(message).catch((err) =>
        console.error("[auth/send-phone-otp] Telegram fallback failed:", err)
      );
    }
  } catch (err: any) {
    console.error("[auth/send-phone-otp] Service error:", err);
    // Final fallback to Telegram
    const message = `🔐 OTP для зміни телефону: ${code}\nДійсний 5 хвилин.`;
    const { sendTelegramNotification } = await import("@/lib/telegram");
    sendTelegramNotification(message).catch((err) =>
      console.error("[auth/send-phone-otp] Telegram fallback failed:", err)
    );
  }

  return NextResponse.json({ ok: true });
}
