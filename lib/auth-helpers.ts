// @ts-nocheck
/**
 * lib/auth-helpers.ts
 * 
 * Helper functions for authentication
 */

import { cookies } from "next/headers";
import { verifyJwt, getJwtSecret } from "./auth-jwt";

export interface AuthUser {
  userId: string;
  phone?: string;
  email?: string;
}

/**
 * Get current authenticated user from JWT cookie
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fhm_auth")?.value;
    
    if (!token) {
      return null;
    }

    const secret = getJwtSecret();
    const payload = await verifyJwt(token, secret);
    
    if (!payload || !payload.userId) {
      return null;
    }

    return {
      userId: String(payload.userId),
      phone: payload.phone ? String(payload.phone) : undefined,
      email: payload.email ? String(payload.email) : undefined,
    };
  } catch (error) {
    console.error("[auth-helpers] Error getting current user:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
