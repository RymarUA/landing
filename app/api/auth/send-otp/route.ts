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
import { sendEmailOtp, normalizeEmail } from "@/lib/email-otp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?3?8?0\d{9}$/;

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

  const emailRaw =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email ?? "").trim()
      : "";
  const phoneRaw =
    typeof body === "object" && body !== null && "phone" in body
      ? String((body as { phone: unknown }).phone ?? "").trim()
      : "";

  // Support both email and phone for backward compatibility
  let identifier: string;
  let type: "email" | "phone";
  
  if (emailRaw) {
    if (!EMAIL_REGEX.test(emailRaw)) {
      return NextResponse.json({ error: "Невірний формат email" }, { status: 400 });
    }
    identifier = normalizeEmail(emailRaw);
    type = "email";
  } else if (phoneRaw) {
    if (!PHONE_REGEX.test(phoneRaw.replace(/\s/g, ""))) {
      return NextResponse.json({ error: "Невірний формат телефону" }, { status: 400 });
    }
    identifier = normalizePhoneForAuth(phoneRaw);
    type = "phone";
  } else {
    return NextResponse.json({ error: "Email або телефон обов'язковий" }, { status: 400 });
  }

  if (type === "phone") {
    if (!canSendOtpByPhone(identifier)) {
      return NextResponse.json(
        { error: "Зачекайте хвилину перед повторним запитом коду." },
        { status: 429 }
      );
    }
  }

  const code = generateOtp();
  await setOtp(identifier, code);
  
  // Development: Log OTP code for testing
  if (process.env.NODE_ENV === "development") {
    console.log(`🔐 DEV MODE: OTP for ${identifier} is ${code}`);
  }
  
  if (type === "phone") {
    recordOtpSentByPhone(identifier);
  }
  recordOtpSentByIp(ip);

  try {
    if (type === "email") {
      const emailResult = await sendEmailOtp(identifier, code);
      if (!emailResult.success) {
        console.error("[auth/send-otp] Email failed:", emailResult.error);
        // Fallback to Telegram if email fails
        const message = `🔐 OTP для ${identifier}: ${code}\nДійсний 5 хвилин.`;
        const { sendTelegramNotification } = await import("@/lib/telegram");
        sendTelegramNotification(message).catch((err) =>
          console.error("[auth/send-otp] Telegram fallback failed:", err)
        );
      }
    } else {
      // Phone: try SMS first, fallback to Telegram
      const message = `🔐 OTP для ${identifier}: ${code}\nДійсний 5 хвилин.`;
      try {
        const { sendOtpSms } = await import("@/lib/sms");
        const smsResult = await sendOtpSms(identifier, code);
        if (!smsResult.success) {
          console.error("[auth/send-otp] SMS failed:", smsResult.error);
          // Fallback to Telegram if SMS fails
          const { sendTelegramNotification } = await import("@/lib/telegram");
          sendTelegramNotification(message).catch((err) =>
            console.error("[auth/send-otp] Telegram fallback failed:", err)
          );
        }
      } catch (err: any) {
        console.error("[auth/send-otp] SMS service error:", err);
        // Fallback to Telegram if SMS service fails
        const { sendTelegramNotification } = await import("@/lib/telegram");
        sendTelegramNotification(message).catch((err) =>
          console.error("[auth/send-otp] Telegram fallback failed:", err)
        );
      }
    }
  } catch (err: any) {
    console.error("[auth/send-otp] Service error:", err);
    // Final fallback to Telegram
    const message = `🔐 OTP для ${identifier}: ${code}\nДійсний 5 хвилин.`;
    const { sendTelegramNotification } = await import("@/lib/telegram");
    sendTelegramNotification(message).catch((err) =>
      console.error("[auth/send-otp] Telegram fallback failed:", err)
    );
  }

  return NextResponse.json({ ok: true });
}

