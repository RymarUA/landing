/**
 * POST /api/auth/register-from-checkout
 * 
 * Register a new user from checkout form data
 * Creates JWT token and sets cookie
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/auth-jwt";
import { isValidUkrainianPhone, normalizePhone } from "@/lib/phone-utils";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email } = await req.json();

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Ім'я та телефон обов'язкові" },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!isValidUkrainianPhone(phone)) {
      return NextResponse.json(
        { error: "Невірний формат телефону" },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email && !email.includes("@")) {
      return NextResponse.json(
        { error: "Невірний формат email" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

    // Check if user already exists (you might want to add database check here)
    // For now, we'll just create the token

    // Create JWT payload
    const payload = {
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone: normalizedPhone,
      email: email || undefined,
      name: name.trim(),
    };

    // Sign JWT
    const token = await signJwt(payload, secret);

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        userId: payload.userId,
        phone: payload.phone,
        email: payload.email,
      }
    });

    response.cookies.set("fhm_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[register-from-checkout] Error:", error);
    return NextResponse.json(
      { error: "Помилка реєстрації" },
      { status: 500 }
    );
  }
}
