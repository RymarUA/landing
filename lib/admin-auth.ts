/**
 * lib/admin-auth.ts
 * 
 * Admin authentication helpers for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt, getJwtSecret } from "./auth-jwt";

// Admin email whitelist - configure via environment variable
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

export interface AdminUser {
  email: string;
  sitniksCustomerId?: number;
}

/**
 * Verify if the current user is an admin based on JWT token
 * Returns admin user data if authenticated, null otherwise
 */
export async function verifyAdminAuth(_req: NextRequest): Promise<AdminUser | null> {
  try {
    // Get JWT token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("fhm_auth")?.value;
    
    if (!token) {
      return null;
    }

    // Verify JWT
    let secret: string;
    try {
      secret = getJwtSecret();
    } catch (error) {
      console.error("[admin-auth] JWT secret not configured:", error);
      return null;
    }

    const payload = await verifyJwt(token, secret);
    
    if (!payload || !payload.email) {
      return null;
    }

    const email = String(payload.email);

    // Check if email is in admin whitelist
    if (!ADMIN_EMAILS.includes(email)) {
      console.warn(`[admin-auth] Unauthorized admin access attempt by: ${email}`);
      return null;
    }

    return {
      email,
      sitniksCustomerId: payload.sitniksCustomerId ? Number(payload.sitniksCustomerId) : undefined,
    };
  } catch (error) {
    console.error("[admin-auth] Error verifying admin auth:", error);
    return null;
  }
}

/**
 * Middleware wrapper to protect admin routes
 * Returns 401 Unauthorized if not authenticated as admin
 */
export async function requireAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, admin: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const admin = await verifyAdminAuth(req);
  
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    );
  }

  return handler(req, admin);
}

/**
 * Check if user is authenticated as admin (without requiring request)
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fhm_auth")?.value;
    
    if (!token) {
      return false;
    }

    const secret = getJwtSecret();
    const payload = await verifyJwt(token, secret);
    
    if (!payload || !payload.email) {
      return false;
    }

    return ADMIN_EMAILS.includes(String(payload.email));
  } catch {
    return false;
  }
}
