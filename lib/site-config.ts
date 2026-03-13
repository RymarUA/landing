// @ts-nocheck
/**
 * Site Configuration - EDIT THIS FILE to customize your site
 * All metadata, OG images, and branding read from here automatically.
 */

export const siteConfig = {
  // Basic Info
  name: "Здоровʼя Сходу",
  tagline: "Ритуали східної медицини для дому та клініки",
  description:
    "Центр східної медицини: лікувальні чаї, зігріваючі пластирі, ароматерапія та ортези з доставкою по Україні. Персональні рекомендації та підтримка від експертів щодня.",

  // Site URL (replaced automatically on deploy)
  url: process.env.NEXT_PUBLIC_URL || "https://your-app.kleap.io",

  // Layout: navbar is hidden by default. Set to true for marketing/landing sites.
  showNavbar: true,

  // Navigation links (only used when showNavbar is true)
  navLinks: [
    { title: "Каталог", link: "/#catalog" },
    { title: "Рекомендації", link: "/#featured" },
    { title: "Про нас", link: "/#guide" },
    { title: "Контакти", link: "/about" },
  ] as { title: string; link: string }[],

  // SEO Keywords
  keywords: [
    "східна медицина",
    "лікувальні чаї",
    "зігріваючі пластирі",
    "ароматерапія",
    "ортези та бандажі",
    "масла та бальзами",
    "ритуали здоровʼя",
    "консультація травника",
  ],

  // Author/Company
  author: "Здоровʼя Сходу",
  company: "Здоровʼя Сходу",

  // OG Image: set to a generated image URL for rich link previews
  ogImage: "",

  // Theme colors for OG image (fallback when ogImage is empty)
  ogBackground: "#065F46",
  ogAccent1: "#065F46",
  ogAccent2: "#D4AF37",

  // -- Announcement Bar -------------------------------------------------
  // Set announcementText to "" to hide the bar entirely.
  // Plain text only (HTML not supported for security).
  announcementText:
    "✨ Подарунок від «Здоровʼя Сходу»: використайте промокод EAST12 та отримайте -12% вже зараз",

  // -- Catalog Categories -----------------------------------------------
  // Sync these with your Sitniks CRM status labels.
  // "Всі" must always be first – it shows all products.
  catalogCategories: [
    "Всі",
    "Безкоштовна доставка",
    "Наколінники",
    "Лікувальні пластирі",
    "Налокотники",
    "Бандажі",
    "Масажери",
    "Мазі та гелі",
    "Компресійна білизна",
    "Інше",
  ] as const,

  // -- Contact / Support links ------------------------------------------
  // Used by SupportButton floating widget. Set to "" to hide that channel.
  telegramUsername: "zdorovia_skhodu",
  viberPhone: "+380507877430",             // viber://chat?number=...
  instagramUsername: "zdorovia.skhodu",
  tiktokUsername: "zdorovia.skhodu",
  phone: "+380507877430",
  twitterHandle: "zdorovia_skhodu",
};

export type SiteConfig = typeof siteConfig;

