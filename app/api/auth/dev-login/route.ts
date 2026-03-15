/**
 * POST /api/auth/dev-login
 * 
 * Development only: Skip OTP and login directly
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/auth-jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Create JWT token
    const payload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      email: email,
    };

    const token = await signJwt(payload, process.env.JWT_SECRET ?? "dev-secret");

    const res = NextResponse.json(payload);
    res.cookies.set("fhm_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (error) {
    console.error("[auth/dev-login] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
