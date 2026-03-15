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
import { normalizeEmail } from "@/lib/email-otp";
import { findOrCreateSitniksCustomer } from "@/lib/sitniks-customers";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const emailRaw = typeof body === "object" && body !== null && "email" in body
    ? String((body as { email: unknown }).email ?? "")
    : "";
  const phoneRaw = typeof body === "object" && body !== null && "phone" in body
    ? String((body as { phone: unknown }).phone ?? "")
    : "";
  const otp = typeof body === "object" && body !== null && "otp" in body
    ? String((body as { otp: unknown }).otp ?? "").trim()
    : "";

  // Support both email and phone for backward compatibility
  let identifier: string;
  let type: "email" | "phone";
  
  if (emailRaw) {
    identifier = normalizeEmail(emailRaw);
    type = "email";
  } else if (phoneRaw) {
    identifier = normalizePhoneForAuth(phoneRaw);
    type = "phone";
  } else {
    return NextResponse.json(
      { error: "Email або телефон обов'язковий" },
      { status: 400 }
    );
  }
  const entry = getOtp(identifier);

  if (!entry) {
    return NextResponse.json(
      { error: "Код не знайдено або прострочений" },
      { status: 400 }
    );
  }

  if (Date.now() > entry.expires) {
    deleteOtp(identifier);
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

  deleteOtp(identifier);

  // Sync with Sitniks CRM
  let sitniksCustomerId: number | undefined;
  try {
    const sitniksResult = await findOrCreateSitniksCustomer(
      type === "email" ? identifier : undefined,
      type === "phone" ? identifier : undefined,
      undefined // fullname - can be added later
    );
    
    if (sitniksResult) {
      sitniksCustomerId = sitniksResult.customer.id;
      console.log(`[auth/verify-otp] Sitniks customer ${sitniksResult.created ? "created" : "found"}: ${sitniksCustomerId}`);
    }
  } catch (error) {
    console.error("[auth/verify-otp] Sitniks sync failed:", error);
    // Continue without Sitniks sync - don't block login
  }

  const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const payload: any = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };
  
  if (type === "email") {
    payload.email = identifier;
  } else {
    payload.phone = identifier;
  }
  
  // Add Sitniks customer ID to JWT if available
  if (sitniksCustomerId) {
    payload.sitniksCustomerId = sitniksCustomerId;
  }

  const token = await signJwt(payload, secret);

  const res = NextResponse.json(payload);
  res.cookies.set("fhm_auth", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}

