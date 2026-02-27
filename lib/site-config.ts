/**
 * Site Configuration - EDIT THIS FILE to customize your site
 * All metadata, OG images, and branding read from here automatically.
 */

export const siteConfig = {
  // Basic Info
  name: "ShopOdessa",
  tagline: "Кросівки, іграшки, аксесуари — з Китаю в Одесу",
  description:
    "Жіночі кросівки з Китаю, дитячі іграшки, аксесуари для дому та авто. Доставка по всій Україні через Meest. Built with Kleap - the AI website builder.",

  // Site URL (replaced automatically on deploy)
  url: process.env.NEXT_PUBLIC_URL || "https://your-app.kleap.io",

  // Layout: navbar is hidden by default. Set to true for marketing/landing sites.
  showNavbar: false,

  // Navigation links (only used when showNavbar is true)
  navLinks: [] as { title: string; link: string }[],

  // SEO Keywords
  keywords: ["keyword1", "keyword2", "keyword3"],

  // Author/Company
  author: "Your Name",
  company: "Your Company",

  // Social
  twitter: "@yourtwitter",

  // OG Image: set to a generated image URL for rich link previews
  ogImage: "",

  // Theme colors for OG image (fallback when ogImage is empty)
  ogBackground: "#020022",
  ogAccent1: "#1a1a4e",
  ogAccent2: "#2d1b4e",
};

export type SiteConfig = typeof siteConfig;
