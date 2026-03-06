/**
 * Site Configuration - EDIT THIS FILE to customize your site
 * All metadata, OG images, and branding read from here automatically.
 */

export const siteConfig = {
  // Basic Info
  name: "FamilyHub Market",
  tagline: "Одяг, іграшки, аксесуари для всієї родини — доставка по Україні",
  description:
    "Жіночий, чоловічий та дитячий одяг, іграшки, товари для дому та авто. Доставка Новою Поштою по всій Україні. Якість від перевірених постачальників.",

  // Site URL (replaced automatically on deploy)
  url: process.env.NEXT_PUBLIC_URL || "https://your-app.kleap.io",

  // Layout: navbar is hidden by default. Set to true for marketing/landing sites.
  showNavbar: false,

  // Navigation links (only used when showNavbar is true)
  navLinks: [] as { title: string; link: string }[],

  // SEO Keywords
  keywords: ["одяг з Китаю", "дитячі іграшки", "кросівки репліка", "Нова Пошта", "FamilyHub Market", "Одеса"],

  // Author/Company
  author: "FamilyHub Market",
  company: "FamilyHub Market",

  // OG Image: set to a generated image URL for rich link previews
  ogImage: "",

  // Theme colors for OG image (fallback when ogImage is empty)
  ogBackground: "#020022",
  ogAccent1: "#1a1a4e",
  ogAccent2: "#2d1b4e",

  // ── Announcement Bar ─────────────────────────────────────────
  // Set announcementText to "" to hide the bar entirely.
  // Plain text only (HTML not supported for security).
  announcementText: "🔥 Акція до 31 березня: -15% на весь одяг! Промокод: FAMILY15",

  // ── Catalog Categories ────────────────────────────────────────
  // Sync these with your Sitniks CRM status labels.
  // "Всі" must always be first — it shows all products.
  catalogCategories: [
    "Всі",
    "Для жінок",
    "Для чоловіків",
    "Для дітей",
    "Іграшки",
    "Дім",
    "Авто",
  ] as const,

  // ── Contact / Support links ──────────────────────────────────
  // Used by SupportButton floating widget. Set to "" to hide that channel.
  telegramUsername: "familyhub_market",   // t.me/familyhub_market
  viberPhone: "+380936174140",             // viber://chat?number=...
  instagramUsername: "familyhub_market",  // instagram.com/familyhub_market
  phone: "+380936174140",
};

export type SiteConfig = typeof siteConfig;
