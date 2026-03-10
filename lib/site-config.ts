/**
 * Site Configuration - EDIT THIS FILE to customize your site
 * All metadata, OG images, and branding read from here automatically.
 */

export const siteConfig = {
  // Basic Info
  name: "Семейный Магазин",
  tagline: "Магазин для всей семьи с товарами и услугами на каждый день",
  description:
    "Онлайн-магазин товаров для повседневных нужд: качественная одежда, товары для дома, косметика, бытовая техника, детские товары, спортивное питание. Доставка товаров, быстрая оплата, удобный возврат, круглосуточная поддержка.",

  // Site URL (replaced automatically on deploy)
  url: process.env.NEXT_PUBLIC_URL || "https://your-app.kleap.io",

  // Layout: navbar is hidden by default. Set to true for marketing/landing sites.
  showNavbar: false,

  // Navigation links (only used when showNavbar is true)
  navLinks: [
    { title: "Каталог", link: "/#catalog" },
    { title: "Рекомендации", link: "/#featured" },
    { title: "О нас", link: "/#guide" },
    { title: "О нас", link: "/about" },
  ] as { title: string; link: string }[],

  // SEO Keywords
  keywords: [
    "семейные товары",
    "повседневные нужды",
    "товары для дома",
    "онлайн магазин",
    "качественная одежда",
    "бытовая техника",
    "детские товары",
    "спортивное питание",
    "доставка",
  ],

  // Author/Company
  author: "Семейный Магазин",
  company: "Семейный Магазин",

  // OG Image: set to a generated image URL for rich link previews
  ogImage: "",

  // Theme colors for OG image (fallback when ogImage is empty)
  ogBackground: "#0F2D2A",
  ogAccent1: "#1F6B5E",
  ogAccent2: "#C9B27C",

  // -- Announcement Bar -------------------------------------------------
  // Set announcementText to "" to hide the bar entirely.
  // Plain text only (HTML not supported for security).
  announcementText: "?? ������� ����������: ?12% �� ���� ����������. ��������: EAST12",

  // -- Catalog Categories -----------------------------------------------
  // Sync these with your Sitniks CRM status labels.
  // "��" must always be first � it shows all products.
  catalogCategories: [
    "��",
    "˳�������� �������",
    "������ �� ������",
    "��������",
    "��� �� �����",
    "����������� �������",
    "��������� �������",
    "���� ������",
  ] as const,

  // -- Contact / Support links ------------------------------------------
  // Used by SupportButton floating widget. Set to "" to hide that channel.
  telegramUsername: "",
  viberPhone: "+380936174140",             // viber://chat?number=...
  instagramUsername: "",
  phone: "+380936174140",
  twitterHandle: "",
};

export type SiteConfig = typeof siteConfig;

