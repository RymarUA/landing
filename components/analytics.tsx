"use client";
/**
 * components/analytics.tsx
 *
 * Meta Pixel (Facebook) + Google Analytics 4 — loaded client-side
 * via next/script with strategy="afterInteractive" so they never block rendering.
 *
 * ENV VARS (set in Vercel dashboard):
 *   NEXT_PUBLIC_META_PIXEL_ID   — numeric pixel ID from Meta Events Manager
 *   NEXT_PUBLIC_GA4_ID          — G-XXXXXXXXXX measurement ID from GA4
 *
 * Both are optional: if missing the component renders nothing.
 *
 * Usage:
 *   import { Analytics } from "@/components/analytics"
 *   // place anywhere inside <body> — layout.tsx is ideal
 *
 * Tracking helpers (call from any client component):
 *   import { trackEvent, trackPurchase, trackAddToCart, trackViewContent } from "@/components/analytics"
 */

import Script from "next/script";

/* ─── Extend Window for fbq / gtag ──────────────────────── */
declare global {
  interface Window {
    fbq?: (
      command: string,
      eventName: string,
      params?: Record<string, any>
    ) => void;
    _fbq?: unknown;
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: unknown[];
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA4_ID   = process.env.NEXT_PUBLIC_GA4_ID;

/* ─── Analytics script component ────────────────────────── */
export function Analytics() {
  return (
    <>
      {/* ── Meta Pixel ── */}
      {PIXEL_ID && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `}</Script>
          {/* NoScript fallback */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* ── Google Analytics 4 ── */}
      {GA4_ID && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `}</Script>
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRACKING HELPERS — call from any "use client" component
   ═══════════════════════════════════════════════════════════ */

interface PurchaseParams {
  value: number;
  currency?: string;
  orderId?: string | number;
  contents?: Array<{ id: string | number; quantity: number; item_price: number }>;
}

interface AddToCartParams {
  contentId: string | number;
  contentName: string;
  value: number;
  currency?: string;
}

interface ViewContentParams {
  contentId: string | number;
  contentName: string;
  contentCategory?: string;
  value?: number;
  currency?: string;
}

/** Fire a custom Meta Pixel event + GA4 custom event */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined") {
      if (window.fbq) window.fbq("trackCustom", eventName, params ?? {});
      if (window.gtag) window.gtag("event", eventName, params ?? {});
    }
  } catch (e) {
    console.warn("[analytics] trackEvent error:", e);
  }
}

/** 🛒 Purchase — fire on /checkout/success */
export function trackPurchase(params: PurchaseParams) {
  const { value, currency = "UAH", orderId, contents } = params;
  try {
    if (typeof window !== "undefined") {
      /* Meta Pixel */
      if (window.fbq) {
        window.fbq("track", "Purchase", {
          value,
          currency,
          order_id: orderId,
          content_type: "product",
          ...(contents ? { contents } : {}),
        });
      }
      /* GA4 — standard e-commerce event */
      if (window.gtag) {
        window.gtag("event", "purchase", {
          transaction_id: orderId,
          value,
          currency,
          items: contents?.map((c) => ({
            item_id: c.id,
            quantity: c.quantity,
            price: c.item_price,
          })) ?? [],
        });
      }
    }
  } catch (e) {
    console.warn("[analytics] trackPurchase error:", e);
  }
}

/** 🛍️ AddToCart */
export function trackAddToCart(params: AddToCartParams) {
  const { contentId, contentName, value, currency = "UAH" } = params;
  try {
    if (typeof window !== "undefined") {
      if (window.fbq) {
        window.fbq("track", "AddToCart", {
          content_ids: [String(contentId)],
          content_name: contentName,
          value,
          currency,
          content_type: "product",
        });
      }
      if (window.gtag) {
        window.gtag("event", "add_to_cart", {
          currency,
          value,
          items: [{ item_id: contentId, item_name: contentName, price: value }],
        });
      }
    }
  } catch (e) {
    console.warn("[analytics] trackAddToCart error:", e);
  }
}

/** 👁️ ViewContent — fire on product pages */
export function trackViewContent(params: ViewContentParams) {
  const { contentId, contentName, contentCategory, value, currency = "UAH" } = params;
  try {
    if (typeof window !== "undefined") {
      if (window.fbq) {
        window.fbq("track", "ViewContent", {
          content_ids: [String(contentId)],
          content_name: contentName,
          content_category: contentCategory,
          value,
          currency,
          content_type: "product",
        });
      }
      if (window.gtag) {
        window.gtag("event", "view_item", {
          currency,
          value,
          items: [{ item_id: contentId, item_name: contentName, item_category: contentCategory, price: value }],
        });
      }
    }
  } catch (e) {
    console.warn("[analytics] trackViewContent error:", e);
  }
}

/** 🔍 Search */
export function trackSearch(query: string) {
  try {
    if (typeof window !== "undefined") {
      if (window.fbq) window.fbq("track", "Search", { search_string: query });
      if (window.gtag) window.gtag("event", "search", { search_term: query });
    }
  } catch (e) {
    console.warn("[analytics] trackSearch error:", e);
  }
}

/** ❤️ AddToWishlist */
export function trackAddToWishlist(params: { contentId: string | number; contentName: string; value: number }) {
  try {
    if (typeof window !== "undefined") {
      if (window.fbq) {
        window.fbq("track", "AddToWishlist", {
          content_ids: [String(params.contentId)],
          content_name: params.contentName,
          value: params.value,
          currency: "UAH",
        });
      }
      if (window.gtag) {
        window.gtag("event", "add_to_wishlist", {
          currency: "UAH",
          value: params.value,
          items: [{ item_id: params.contentId, item_name: params.contentName, price: params.value }],
        });
      }
    }
  } catch (e) {
    console.warn("[analytics] trackAddToWishlist error:", e);
  }
}

/** 📋 InitiateCheckout */
export function trackInitiateCheckout(params: { value: number; numItems: number }) {
  try {
    if (typeof window !== "undefined") {
      if (window.fbq) {
        window.fbq("track", "InitiateCheckout", {
          value: params.value,
          currency: "UAH",
          num_items: params.numItems,
        });
      }
      if (window.gtag) {
        window.gtag("event", "begin_checkout", {
          currency: "UAH",
          value: params.value,
        });
      }
    }
  } catch (e) {
    console.warn("[analytics] trackInitiateCheckout error:", e);
  }
}

