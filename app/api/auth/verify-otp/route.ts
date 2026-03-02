/**
 * POST /api/auth/verify-otp
 *
 * Verifies OTP, issues JWT, sets httpOnly cookie fhm_auth, returns { phone }.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getOtp, deleteOtp, normalizePhoneForAuth } from "@/lib/otp-store";
import { signJwt } from "@/lib/auth-jwt";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phoneRaw = typeof body === "object" && body !== null && "phone" in body
    ? String((body as { phone: unknown }).phone ?? "")
    : "";
  const otp = typeof body === "object" && body !== null && "otp" in body
    ? String((body as { otp: unknown }).otp ?? "").trim()
    : "";

  const phone = normalizePhoneForAuth(phoneRaw);
  const entry = getOtp(phone);

  if (!entry) {
    return NextResponse.json(
      { error: "Код не знайдено або прострочений" },
      { status: 400 }
    );
  }

  if (Date.now() > entry.expires) {
    deleteOtp(phone);
    return NextResponse.json(
      { error: "Код не знайдено або прострочений" },
      { status: 400 }
    );
  }

  if (entry.code !== otp) {
    return NextResponse.json(
      { error: "Невірний код" },
      { status: 400 }
    );
  }

  deleteOtp(phone);

  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const payload = {
    phone,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };

  const token = await signJwt(payload, secret);

  const res = NextResponse.json({ phone });
  res.cookies.set("fhm_auth", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
