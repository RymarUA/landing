/**
 * POST /api/auth/verify-otp
 *
 * Verifies the 6-digit OTP sent via /api/auth/send-otp.
 * On success, returns a signed JWT stored in an httpOnly cookie.
 *
 * Body:    { phone: string; otp: string }
 * Success: { success: true; token: string }
 * Error:   { error: string; attemptsLeft?: number }
 *
 * ENV VARS:
 *   JWT_SECRET — signing secret (falls back to a dev default if missing)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { otpStore, MAX_ATTEMPTS, normalizePhone } from "../send-otp/route";

/* ─── Minimal JWT (no dependency on jsonwebtoken) ─────────────────────── */
function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return Buffer.from(bytes).toString("base64url");
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header  = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = base64url(JSON.stringify(payload));
  const sigInput = new TextEncoder().encode(`${header}.${body}`);
  const keyData  = new TextEncoder().encode(secret);

  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, sigInput);
  return `${header}.${body}.${base64url(new Uint8Array(sig))}`;
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;

    const sigInput = new TextEncoder().encode(`${header}.${body}`);
    const keyData  = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const sigBytes = Buffer.from(signature, "base64url");
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, sigInput);
    if (!valid) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ─── Validation ─────────────────────────────────────────────────────── */
const bodySchema = z.object({
  phone: z.string().trim().min(7),
  otp:   z.string().trim().length(6).regex(/^\d{6}$/),
});

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
    return NextResponse.json(
      { error: "Неправильний формат даних" },
      { status: 422 }
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const { otp }   = parsed.data;

  const entry = otpStore.get(phone);

  /* OTP doesn't exist or expired */
  if (!entry || entry.expires < Date.now()) {
    otpStore.delete(phone);
    return NextResponse.json(
      { error: "Код застарів або не існує. Запросіть новий код." },
      { status: 401 }
    );
  }

  /* Too many wrong attempts */
  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phone);
    return NextResponse.json(
      { error: "Забагато невдалих спроб. Запросіть новий код." },
      { status: 429 }
    );
  }

  /* Wrong OTP */
  if (entry.otp !== otp) {
    entry.attempts += 1;
    const attemptsLeft = MAX_ATTEMPTS - entry.attempts;
    return NextResponse.json(
      { error: `Невірний код. Залишилось спроб: ${attemptsLeft}`, attemptsLeft },
      { status: 401 }
    );
  }

  /* ✅ Correct OTP — issue JWT */
  otpStore.delete(phone);

  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const payload = {
    sub:   phone,
    phone,
    iat:   Math.floor(Date.now() / 1000),
    exp:   Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  };

  const token = await signJwt(payload, secret);

  const response = NextResponse.json({ success: true, phone });

  /* Set httpOnly cookie (secure in production) */
  response.cookies.set("fhm_auth", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
