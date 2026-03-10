/**
 * POST /api/subscribe
 *
 * Newsletter subscription: validate email, Telegram notification,
 * send subscription confirmation with promo code FIRST10.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";
import { sendSubscriptionConfirmation } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невірний email" }, { status: 400 });
  }

  const email = typeof body === "object" && body !== null && "email" in body
    ? String((body as { email: unknown }).email ?? "").trim()
    : "";

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Невірний email" }, { status: 400 });
  }

  sendTelegramNotification("📧 Нова підписка на розсилку\n✉️ " + email).catch((err) =>
    console.error("[subscribe] Telegram failed:", err)
  );

  sendSubscriptionConfirmation({ to: email, promoCode: "FIRST10" }).catch((err) =>
    console.error("[subscribe] Email failed:", err)
  );

  return NextResponse.json({ ok: true });
}

