/ Глобальные типы для window объекта

interface Window {
  gtag?: (
    command: string,
    targetId: string,
    config?: Record<string, any>
  ) => void;
  fbq?: (
    command: string,
    eventName: string,
    params?: Record<string, any>
  ) => void;
}

// Extend Next.js types
declare module 'next' {
  interface NextApiRequest {
    ip?: string;
  }
}

// ENV variables типизация
declare namespace NodeJS {
  interface ProcessEnv {
    // Required
    WAYFORPAY_MERCHANT_ACCOUNT: string;
    WAYFORPAY_MERCHANT_DOMAIN: string;
    WAYFORPAY_SECRET_KEY: string;
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHAT_ID: string;
    RESEND_API_KEY: string;
    EMAIL_FROM: string;
    EMAIL_ADMIN: string;
    JWT_SECRET: string;
    ADMIN_SECRET: string;
    
    // Optional
    SITNIKS_API_URL?: string;
    SITNIKS_API_KEY?: string;
    SITNIKS_WEBHOOK_SECRET?: string;
    INSTAGRAM_ACCESS_TOKEN?: string;
    INSTAGRAM_USER_ID?: string;
    NEXT_PUBLIC_META_PIXEL_ID?: string;
    NEXT_PUBLIC_GA4_ID?: string;
    NEXT_PUBLIC_SITE_URL?: string;
    
    // System
    NODE_ENV: 'development' | 'production' | 'test';
    VERCEL?: string;
    VERCEL_ENV?: string;
    VERCEL_URL?: string;
    NEXT_PHASE?: string;
  }
}

// Extend types for better autocomplete
declare module '@/lib/types' {
  export interface CatalogProduct {
    id: number;
    slug: string;
    name: string;
    category: string;
    price: number;
    oldPrice: number | null;
    image: string;
    badge: string | null;
    badgeColor: string;
    sizes: string[];
    rating: number;
    reviews: number;
    stock: number;
    description: string;
    isNew?: boolean;
    isHit?: boolean;
    instagramMediaId: string | null;
    instagramPermalink: string | null;
  }
}

