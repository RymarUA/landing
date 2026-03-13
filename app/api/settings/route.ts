// @ts-nocheck
/**
 * app/api/settings/route.ts
 * 
 * GET /api/settings — повертає налаштування сайту з Sitniks CRM
 */

import { NextResponse } from "next/server";
import { getSiteSettingsWithFallback } from "@/lib/sitniks-consolidated";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Кеш на 1 хвилину

export async function GET() {
  try {
    const { settings, source } = await getSiteSettingsWithFallback();
    
    return NextResponse.json({
      success: true,
      settings,
      source,
    });
  } catch (error) {
    console.error("[API] Failed to fetch settings from Sitniks:", error);
    
    // getSiteSettingsWithFallback already handles fallback, so this should never be reached
    return NextResponse.json({
      success: false,
      error: "Failed to fetch settings",
    });
  }
}
