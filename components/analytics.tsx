// @ts-nocheck
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
import { useEffect } from "react";
import { useWindow } from "@/hooks/use-isomorphic";
import { useLocalStorage } from "@/hooks/use-isomorphic";

/* ─── Extend Window for fbq / gtag ──────────────────────── */
declare global {
  interface Window {
    fbq?: (
      command: string,
      eventName: string,
      params?: Record<string, any>
    ) => void;
    _fbq?: unknown;
    dataLayer: unknown[];
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA4_ID   = process.env.NEXT_PUBLIC_GA4_ID;

const STORAGE_KEY = "fhm_cookie_consent";

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  ts: number;
}

/* ─── Analytics script component ────────────────────────── */
interface AnalyticsProps {
  cspNonce?: string;
}

export function Analytics({ cspNonce }: AnalyticsProps) {
  const { isClient } = useWindow();
  const [consent] = useLocalStorage<CookieConsent | null>(STORAGE_KEY, null);
  
  // Setup global error handling when component mounts
  useEffect(() => {
    if (isClient) {
      setupGlobalErrorHandling();
    }
  }, [isClient]);

  // Check if analytics and marketing are allowed
  const allowAnalytics = consent?.analytics ?? false;
  const allowMarketing = consent?.marketing ?? false;

  // Prevent double-firing by ensuring scripts only load once
  const metaPixelLoaded = typeof window !== 'undefined' && window.fbq;
  const ga4Loaded = typeof window !== 'undefined' && window.dataLayer?.length > 0;

  return (
    <>
      {/* ── Meta Pixel (Marketing) ── */}
      {PIXEL_ID && allowMarketing && !metaPixelLoaded && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive" nonce={cspNonce}>{`
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
              className="fb-pixel-noscript"
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* ── Google Analytics 4 (Analytics) ── */}
      {GA4_ID && allowAnalytics && !ga4Loaded && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive" nonce={cspNonce}>{`
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
  // Check consent before tracking
  if (typeof window !== 'undefined') {
    try {
      const consentStr = localStorage.getItem(STORAGE_KEY);
      if (consentStr) {
        const consent: CookieConsent | null = JSON.parse(consentStr);
        if (!consent) return;
        
        // Meta Pixel requires marketing consent
        if (window.fbq && consent.marketing) {
          window.fbq("trackCustom", eventName, params ?? {});
        }
        
        // GA4 requires analytics consent
        if (window.gtag && consent.analytics) {
          window.gtag("event", eventName, params ?? {});
        }
      }
    } catch (e) {
      console.warn("[analytics] trackEvent error:", e);
    }
  }
}

/** 🛒 Purchase — fire on /checkout/success */
export function trackPurchase(params: PurchaseParams) {
  const { value, currency = "UAH", orderId, contents } = params;
  if (typeof window !== 'undefined') {
    try {
      const consentStr = localStorage.getItem(STORAGE_KEY);
      if (consentStr) {
        const consent: CookieConsent | null = JSON.parse(consentStr);
        if (!consent) return;
        
        /* Meta Pixel - requires marketing consent */
        if (window.fbq && consent.marketing) {
          window.fbq("track", "Purchase", {
            value,
            currency,
            order_id: orderId,
            content_type: "product",
            ...(contents ? { contents } : {}),
          });
        }
        
        /* GA4 - requires analytics consent */
        if (window.gtag && consent.analytics) {
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
}

/** 🛍️ AddToCart */
export function trackAddToCart(params: AddToCartParams) {
  const { contentId, contentName, value, currency = "UAH" } = params;
  if (typeof window !== 'undefined') {
    try {
      const consentStr = localStorage.getItem(STORAGE_KEY);
      if (consentStr) {
        const consent: CookieConsent | null = JSON.parse(consentStr);
        if (!consent) return;
        
        if (window.fbq && consent.marketing) {
          window.fbq("track", "AddToCart", {
            content_ids: [String(contentId)],
            content_name: contentName,
            value,
            currency,
            content_type: "product",
          });
        }
        
        if (window.gtag && consent.analytics) {
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
}

/** 👁️ ViewContent — fire on product pages */
export function trackViewContent(params: ViewContentParams) {
  const { contentId, contentName, contentCategory, value, currency = "UAH" } = params;
  if (typeof window !== 'undefined') {
    try {
      const consentStr = localStorage.getItem(STORAGE_KEY);
      if (consentStr) {
        const consent: CookieConsent | null = JSON.parse(consentStr);
        if (!consent) return;
        
        if (window.fbq && consent.marketing) {
          window.fbq("track", "ViewContent", {
            content_ids: [String(contentId)],
            content_name: contentName,
            content_category: contentCategory,
            value,
            currency,
            content_type: "product",
          });
        }
        
        if (window.gtag && consent.analytics) {
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
}

/** 🔍 Search */
export function trackSearch(query: string) {
  if (typeof window !== 'undefined') {
    try {
      const consentStr = localStorage.getItem(STORAGE_KEY);
      if (consentStr) {
        const consent: CookieConsent | null = JSON.parse(consentStr);
        if (!consent) return;
        
        if (window.fbq && consent.marketing) {
          window.fbq("track", "Search", { search_string: query });
        }
        
        if (window.gtag && consent.analytics) {
          window.gtag("event", "search", { search_term: query });
        }
      }
    } catch (e) {
      console.warn("[analytics] trackSearch error:", e);
    }
  }
}

/** ❤️ AddToWishlist */
export function trackAddToWishlist(params: { contentId: string | number; contentName: string; value: number }) {
  if (typeof window !== 'undefined') {
    try {
      const consentStr = localStorage.getItem(STORAGE_KEY);
      if (consentStr) {
        const consent: CookieConsent | null = JSON.parse(consentStr);
        if (!consent) return;
        
        if (window.fbq && consent.marketing) {
          window.fbq("track", "AddToWishlist", {
            content_ids: [String(params.contentId)],
            content_name: params.contentName,
            value: params.value,
            currency: "UAH",
          });
        }
        
        if (window.gtag && consent.analytics) {
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
}

/** 📋 InitiateCheckout */
export function trackInitiateCheckout(params: { value: number; numItems: number }) {
  if (typeof window !== 'undefined') {
    try {
      const consentStr = localStorage.getItem(STORAGE_KEY);
      if (consentStr) {
        const consent: CookieConsent | null = JSON.parse(consentStr);
        if (!consent) return;
        
        if (window.fbq && consent.marketing) {
          window.fbq("track", "InitiateCheckout", {
            value: params.value,
            currency: "UAH",
            num_items: params.numItems,
          });
        }
        
        if (window.gtag && consent.analytics) {
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
}

/* ──────────────────────────────────────────────────────────────────────
   Logs JavaScript errors to console and optionally to Telegram
   ────────────────────────────────────────────────────────────────────── */

// Rate limiting for error logging to prevent spam
const ERROR_LOG_LIMIT = 5; // Max 5 errors per session
const ERROR_LOG_KEY = 'fhm_error_log_count';
const ERROR_LOG_TIMESTAMP_KEY = 'fhm_error_log_timestamp';

/** Log client-side JavaScript errors */
export const logClientError = async function(errorData: {
  label?: string;
  message?: string;
  url?: string;
  timestamp?: string;
  stack?: string;
}) {
  try {
    // Rate limiting check
    if (typeof window !== 'undefined') {
      const errorCount = parseInt(localStorage.getItem(ERROR_LOG_KEY) || '0');
      const lastLogTime = parseInt(localStorage.getItem(ERROR_LOG_TIMESTAMP_KEY) || '0');
      const now = Date.now();
      
      // Reset count if it's been more than an hour
      if (now - lastLogTime > 3600000) { // 1 hour
        localStorage.setItem(ERROR_LOG_KEY, '0');
        localStorage.setItem(ERROR_LOG_TIMESTAMP_KEY, now.toString());
      }
      
      // Skip if we've exceeded the limit
      if (errorCount >= ERROR_LOG_LIMIT) {
        console.warn(`[Analytics] Error logging limit reached (${ERROR_LOG_LIMIT} errors/hour), skipping`);
        return;
      }
      
      // Increment counter
      localStorage.setItem(ERROR_LOG_KEY, (errorCount + 1).toString());
      localStorage.setItem(ERROR_LOG_TIMESTAMP_KEY, now.toString());
    }
    
    // Validate input parameter
    if (!errorData || typeof errorData !== 'object') {
      console.warn('[Analytics] Invalid error data received, skipping');
      return;
    }
    
    // Check if errorData is completely empty
    const keys = Object.keys(errorData);
    if (keys.length === 0) {
      console.warn('[Analytics] Empty error object received, skipping');
      return;
    }
    
    // Validate error data before logging
    if (!errorData) {
      return;
    }
    
    // Check if all required fields are empty or invalid
    const hasValidMessage = errorData.message && errorData.message.trim() !== '';
    const hasValidLabel = errorData.label && errorData.label.trim() !== '';
    const hasValidUrl = errorData.url && errorData.url.trim() !== '';
    
    if (!hasValidMessage && !hasValidLabel && !hasValidUrl) {
      // Skip completely empty error objects
      return;
    }
    
    // Log to console
    console.error('[Client Error]', {
      label: errorData.label || 'Unknown',
      message: errorData.message || 'No message',
      url: errorData.url || 'Unknown URL',
      timestamp: errorData.timestamp || new Date().toISOString(),
    });
    
    // Send to Telegram if configured
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const message = `
🚨 <b>Client Error</b>

📍 <b>Location:</b> ${errorData.label || 'Unknown'}
⚠️ <b>Message:</b> ${errorData.message}
🔗 <b>URL:</b> ${errorData.url}
⏰ <b>Time:</b> ${errorData.timestamp}

<pre>${errorData.stack?.slice(0, 500) || 'No stack trace'}</pre>
      `.trim();
      
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: 'HTML',
            }),
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
      } catch (telegramError) {
        console.error('Failed to send error to Telegram:', telegramError);
      }
    }
  } catch (error) {
    console.error('Error logging error:', error);
  }
}

/** Setup global error handlers */
export function setupGlobalErrorHandling(): void {
  // Handle uncaught JavaScript errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      // Validate error before processing
      if (!event.message || event.message.trim() === '') {
        return;
      }
      
      // Filter out common React DOM errors that are non-critical
      if (event.message.includes("Cannot read properties of null (reading 'removeChild')")) {
        // This is a common React cleanup error, log at warning level instead of error
        console.warn('[React DOM Cleanup Warning]', {
          message: event.message,
          url: event.filename || window.location.href,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      // Filter out common browser extension errors
      if (event.filename && (
        event.filename.includes('extension://') ||
        event.filename.includes('chrome-extension://') ||
        event.filename.includes('moz-extension://')
      )) {
        // Skip browser extension errors
        return;
      }
      
      // Filter out common non-critical errors
      const nonCriticalErrors = [
        'Script error',
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        'Network request failed'
      ];
      
      if (nonCriticalErrors.some(pattern => event.message.includes(pattern))) {
        console.warn('[Non-critical Error]', {
          message: event.message,
          url: event.filename || window.location.href,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      // Additional validation for the error object
      const errorData = {
        label: 'Global Error Handler',
        message: event.message,
        url: event.filename || window.location.href,
        timestamp: new Date().toISOString(),
        stack: event.error?.stack,
      };
      
      // Only log if we have meaningful data
      if (errorData.message && errorData.message.trim() !== '') {
        logClientError(errorData);
      }
    });
  }
  
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      // Validate rejection reason before processing
      const reasonMessage = event.reason?.message || String(event.reason);
      
      // Skip empty rejection reasons
      if (!reasonMessage || reasonMessage.trim() === '') {
        return;
      }
      
      // Filter out common non-critical promise rejections
      const nonCriticalRejections = [
        'Non-Error promise rejection captured',
        'Network request failed',
        'AbortError',
        'ResizeObserver loop limit exceeded'
      ];
      
      if (nonCriticalRejections.some(pattern => reasonMessage.includes(pattern))) {
        console.warn('[Non-critical Promise Rejection]', {
          message: reasonMessage,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      const errorData = {
        label: 'Unhandled Promise Rejection',
        message: reasonMessage,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        stack: event.reason?.stack,
      };
      
      logClientError(errorData);
    });
  }
}

