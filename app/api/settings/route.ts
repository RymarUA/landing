// @ts-nocheck
/**
 * app/api/settings/route.ts
 * 
 * GET /api/settings — повертає налаштування сайту з Sitniks CRM
 */

import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/sitniks-consolidated";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Кеш на 1 хвилину

export async function GET() {
  try {
    const settings = await getSiteSettings();
    
    if (!settings) {
      // Fallback на статичні налаштування з site-config.ts
      console.log("[API] No settings from Sitniks, using fallback from site-config");
      return NextResponse.json({
        success: true,
        settings: {
          announcementText: siteConfig.announcementText,
          telegramUsername: siteConfig.telegramUsername,
          viberPhone: siteConfig.viberPhone,
          instagramUsername: siteConfig.instagramUsername,
          phone: siteConfig.phone,
        },
        source: "fallback",
      });
    }
    
    return NextResponse.json({
      success: true,
      settings,
      source: "sitniks",
    });
  } catch (error) {
    console.error("[API] Failed to fetch settings from Sitniks:", error);
    
    // Fallback на статичні налаштування
    return NextResponse.json({
      success: true,
      settings: {
        announcementText: siteConfig.announcementText,
        telegramUsername: siteConfig.telegramUsername,
        viberPhone: siteConfig.viberPhone,
        instagramUsername: siteConfig.instagramUsername,
        phone: siteConfig.phone,
      },
      source: "fallback",
    });
  }
}
