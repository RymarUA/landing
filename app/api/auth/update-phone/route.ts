/**
 * POST /api/auth/update-phone
 *
 * Updates user's phone number in JWT token.
 * Requires authenticated user (email-based login) and OTP verification.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { normalizePhoneForAuth, getOtp, deleteOtp } from "@/lib/otp-store";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phoneRaw = typeof body === "object" && body !== null && "phone" in body
    ? String((body as { phone: unknown }).phone ?? "").trim()
    : "";
  
  const otpRaw = typeof body === "object" && body !== null && "otp" in body
    ? String((body as { otp: unknown }).otp ?? "").trim()
    : "";

  if (!phoneRaw) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  if (!otpRaw) {
    return NextResponse.json({ error: "OTP code is required" }, { status: 400 });
  }

  // Basic phone validation
  const phoneRegex = /^\+?3?8?0\d{9}$/;
  if (!phoneRegex.test(phoneRaw.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Invalid phone format" }, { status: 400 });
  }

  const normalizedPhone = normalizePhoneForAuth(phoneRaw);

  // Verify OTP
  const storedOtpEntry = await getOtp(normalizedPhone);
  if (!storedOtpEntry) {
    return NextResponse.json({ error: "OTP not found or expired" }, { status: 400 });
  }

  if (storedOtpEntry.code !== otpRaw) {
    return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
  }

  // Delete OTP after successful verification
  await deleteOtp(normalizedPhone);

  // Create new JWT payload with phone
  const newPayload = {
    email: payload.email,
    phone: normalizedPhone,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };

  // Sign new token
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const { signJwt } = await import("@/lib/auth-jwt");
  const newToken = await signJwt(newPayload, secret);

  // Set new cookie
  const res = NextResponse.json({ 
    success: true, 
    phone: normalizedPhone 
  });
  
  res.cookies.set("fhm_auth", newToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
