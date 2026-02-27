"use client";

import { useEffect } from "react";

/**
 * Kleap Badge Component
 * Displays "Made with Kleap" badge on ALL sites created with Kleap
 * Shows everywhere: CodeSandbox, Vercel, iframe, direct URLs
 * This is the Kleap signature - always visible unless explicitly hidden
 *
 * 🎯 TRACKING: Badge clicks are tracked with UTM params + beacon API
 */
export function KleapBadge() {
  useEffect(() => {
    // Always show badge (can be hidden via dashboard settings later)
    if (typeof window !== "undefined") {
      // Check if badge already exists
      if (document.querySelector("[data-kleap-badge]")) {
        return;
      }

      // Get app ID from config or URL
      const appId = (window as any)._kleap?.id || "preview";

      // Create badge container
      const badge = document.createElement("div");
      badge.setAttribute("data-kleap-badge", "true");
      badge.style.cssText =
        "position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,system-ui,sans-serif;";

      // 🎯 UTM TRACKING: Better attribution for badge clicks
      const badgeUrl = `https://kleap.co/from-badge?utm_source=badge&utm_medium=built-with&utm_campaign=app-${appId}&ref=${appId}`;

      // Create link
      const link = document.createElement("a");
      link.href = badgeUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.style.cssText =
        "display:inline-flex;align-items:center;gap:4px;padding:8px 12px;background:white;color:#000;text-decoration:none;font-size:14px;font-weight:500;border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,0.08),0 2px 8px rgba(0,0,0,0.12);transition:all 0.15s ease;";
      link.innerHTML =
        'Made with <strong style="color:#ff0055;">Kleap</strong>';

      // 📊 CLICK TRACKING: Track badge clicks for analytics
      link.onclick = () => {
        // Track via Umami if available
        if ((window as any).umami?.track) {
          (window as any).umami.track("badge_click", { app_id: appId });
        }
        // Also track via Kleap API for backend analytics
        try {
          navigator.sendBeacon(
            "https://kleap.co/api/track-badge-click",
            JSON.stringify({
              appId: appId,
              timestamp: Date.now(),
              referrer: window.location.href,
            }),
          );
        } catch {
          /* sendBeacon may fail silently */
        }
      };

      // Add hover effects
      link.onmouseenter = () => {
        link.style.transform = "translateY(-2px)";
        link.style.boxShadow =
          "0 0 0 1px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.15)";
      };
      link.onmouseleave = () => {
        link.style.transform = "";
        link.style.boxShadow =
          "0 0 0 1px rgba(0,0,0,0.08),0 2px 8px rgba(0,0,0,0.12)";
      };

      badge.appendChild(link);
      document.body.appendChild(badge);

      // Cleanup on unmount
      return () => {
        badge.remove();
      };
    }
  }, []);

  return null;
}
