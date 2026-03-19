import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";

export async function GET(req: NextRequest) {
  try {
    // Get JWT token from the correct cookie name
    const token = req.cookies.get("fhm_auth")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
    let payload: any;
    try {
      payload = await verifyJwt(token, secret);
    } catch (error) {
      console.error("[api/auth/check-admin] JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get admin emails from environment variable
    const adminEmailsEnv = process.env.ADMIN_EMAILS;
    if (!adminEmailsEnv) {
      console.error("[api/auth/check-admin] ADMIN_EMAILS environment variable not set");
      return NextResponse.json({ error: "Admin configuration missing" }, { status: 500 });
    }

    // Parse and clean admin emails
    const adminEmails = adminEmailsEnv
      .split(",")
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    if (adminEmails.length === 0) {
      console.error("[api/auth/check-admin] No admin emails configured");
      return NextResponse.json({ error: "No admins configured" }, { status: 500 });
    }

    // Check if user email is in admin list
    const userEmail = payload.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found in token" }, { status: 401 });
    }

    const isAdmin = adminEmails.includes(userEmail);
    
    if (!isAdmin) {
      console.warn("[api/auth/check-admin] Unauthorized admin access attempt by:", userEmail);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Return admin role with actual user data
    return NextResponse.json({ 
      role: "admin",
      email: payload.email,
      userId: payload.userId || payload.sub || "unknown"
    });

  } catch (error) {
    console.error("[api/auth/check-admin] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
