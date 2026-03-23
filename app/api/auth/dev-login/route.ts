/**
 * POST /api/auth/dev-login
 * 
 * Development only: Skip OTP and login directly
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/auth-jwt";
import { findOrCreateSitniksCustomer } from "@/lib/sitniks-customers";

export async function POST(req: NextRequest) {
  // SECURITY: Only allow dev-login in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const email = body.email;
    const phone = body.phone;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    console.log("[auth/dev-login] Processing dev login for:", { email, phone });

    // Find or create Sitniks customer
    let sitniksCustomerId = null;
    try {
      const sitniksResult = await findOrCreateSitniksCustomer(
        email,
        phone,
        email.split("@")[0] + "test" // Use email prefix + "test" to meet 3 char minimum
      );
      
      if (sitniksResult) {
        sitniksCustomerId = sitniksResult.customer.id;
        console.log(`[auth/dev-login] Sitniks customer ${sitniksResult.created ? "created" : "found"}: ${sitniksCustomerId}`);
      }
    } catch (error) {
      console.error("[auth/dev-login] Sitniks sync failed:", error);
      // Continue without Sitniks sync - don't block login
    }

    // Create JWT token
    const payload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      email: email,
      ...(sitniksCustomerId && { sitniksCustomerId }),
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
