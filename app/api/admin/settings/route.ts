/**
 * GET /api/admin/settings
 * PUT /api/admin/settings
 * 
 * Site settings management
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getKVStore } from "@/lib/persistent-kv-store";

const SETTINGS_KEY = "admin:site_settings";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    adminEmailNotifications: boolean;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCost: number;
  };
}

// Default settings
const defaultSettings: SiteSettings = {
  siteName: "FamilyHub Market",
  siteDescription: "FamilyHub Market — інтернет-магазин якісних товарів для всієї родини",
  contactEmail: "admin@familyhubmarket.com",
  contactPhone: "+380507877430",
  socialLinks: {
    facebook: "",
    instagram: "",
    telegram: "",
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    adminEmailNotifications: true,
  },
  appearance: {
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
  },
  shipping: {
    freeShippingThreshold: 1000,
    defaultShippingCost: 50,
  },
};

/**
 * Get settings from KV Store (Redis) or fallback to ENV/defaults
 */
async function getSettings(): Promise<SiteSettings> {
  const kv = getKVStore();
  
  try {
    // Try to get saved settings from KV Store
    const savedSettings = await kv.get<SiteSettings>(SETTINGS_KEY);
    
    if (savedSettings) {
      console.log("[admin/settings] Loaded settings from KV Store");
      return savedSettings;
    }
  } catch (error) {
    console.error("[admin/settings] Failed to load from KV Store:", error);
  }
  
  // Fallback to ENV variables and defaults
  console.log("[admin/settings] Using ENV/default settings");
  return {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || defaultSettings.siteName,
    siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || defaultSettings.siteDescription,
    contactEmail: process.env.EMAIL_ADMIN || defaultSettings.contactEmail,
    contactPhone: process.env.CONTACT_PHONE || defaultSettings.contactPhone,
    socialLinks: {
      facebook: process.env.FACEBOOK_URL || "",
      instagram: process.env.INSTAGRAM_URL || "",
      telegram: process.env.TELEGRAM_URL || "",
    },
    notifications: {
      emailNotifications: process.env.EMAIL_NOTIFICATIONS_ENABLED !== "false",
      smsNotifications: process.env.SMS_NOTIFICATIONS_ENABLED === "true",
      adminEmailNotifications: process.env.ADMIN_EMAIL_NOTIFICATIONS !== "false",
    },
    appearance: {
      primaryColor: process.env.PRIMARY_COLOR || defaultSettings.appearance.primaryColor,
      secondaryColor: process.env.SECONDARY_COLOR || defaultSettings.appearance.secondaryColor,
    },
    shipping: {
      freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD) || defaultSettings.shipping.freeShippingThreshold,
      defaultShippingCost: Number(process.env.DEFAULT_SHIPPING_COST) || defaultSettings.shipping.defaultShippingCost,
    },
  };
}

/**
 * Save settings to KV Store (Redis)
 */
async function saveSettings(settings: SiteSettings): Promise<void> {
  const kv = getKVStore();
  
  // Save settings without expiration (persistent)
  await kv.set(SETTINGS_KEY, settings);
  console.log("[admin/settings] Settings saved to KV Store");
}

export async function GET(req: NextRequest) {
  return requireAdminAuth(req, async (_req, admin) => {
    try {
      console.log(`[api/admin/settings] Fetching settings for admin: ${admin.email}`);
    
    const settings = await getSettings();
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[api/admin/settings] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  });
}

export async function PUT(req: NextRequest) {
  return requireAdminAuth(req, async (_req, admin) => {
    try {
      console.log(`[api/admin/settings] Updating settings for admin: ${admin.email}`);
    
    const body = await _req.json();
    console.log("[api/admin/settings] Received body:", body);
    
    const newSettings = body.settings as SiteSettings;
    
    // Validate settings
    if (!newSettings || typeof newSettings !== 'object') {
      console.error("[api/admin/settings] Invalid settings data:", body);
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 });
    }

    // Validate required fields
    if (!newSettings.siteName || typeof newSettings.siteName !== 'string') {
      return NextResponse.json({ error: "Site name is required" }, { status: 400 });
    }
    
    if (!newSettings.contactEmail || typeof newSettings.contactEmail !== 'string') {
      return NextResponse.json({ error: "Contact email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSettings.contactEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Save settings to KV Store (Redis)
    try {
      await saveSettings(newSettings);
      console.log("[api/admin/settings] Settings saved successfully:", newSettings);
      
      return NextResponse.json({ 
        success: true, 
        message: "Settings updated successfully",
        settings: newSettings 
      });
    } catch (saveError) {
      console.error("[api/admin/settings] Failed to save settings:", saveError);
      return NextResponse.json({ 
        error: "Failed to save settings to storage" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[api/admin/settings] PUT Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal error" 
    }, { status: 500 });
  }
  });
}
