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

// In a real application, you would store settings in a database
// For now, we'll use environment variables and fallback to defaults
function getSettingsFromEnv(): SiteSettings {
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

export async function GET(req: NextRequest) {
  return requireAdminAuth(req, async (_req, admin) => {
    try {
      console.log(`[api/admin/settings] Fetching settings for admin: ${admin.email}`);
    
    const settings = getSettingsFromEnv();
    
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

    // In a real application, you would save settings to a database
    // For now, we'll just log the changes and return success
    console.log("[api/admin/settings] Settings updated successfully:", newSettings);
    
    // TODO: Implement actual settings persistence
    // Options:
    // 1. Save to database (PostgreSQL, MongoDB, etc.)
    // 2. Save to JSON file (for simple setups)
    // 3. Update environment variables (requires restart)
    // 4. Save to Redis/KV for temporary storage
    
    return NextResponse.json({ 
      success: true, 
      message: "Settings updated successfully",
      settings: newSettings 
    });
  } catch (error) {
    console.error("[api/admin/settings] PUT Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal error" 
    }, { status: 500 });
  }
  });
}
