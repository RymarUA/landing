"use client";

import { useEffect } from "react";

/**
 * Kleap Analytics Component
 * Loads analytics when configured
 * Note: In production, analytics ID will be injected via Vercel deployment
 */
export function KleapAnalytics() {
  useEffect(() => {
    // Only load analytics when inside an iframe (Kleap environment)
    if (typeof window !== "undefined" && window.parent !== window) {
      // In preview mode, we don't have real analytics
      // This is just a placeholder for the structure
      // Real analytics will be injected during Vercel deployment

      // Add window.kleap.track function for compatibility
      (window as any).kleap = (window as any).kleap || {};
      (window as any).kleap.track = function (name: string, data?: any) {
        console.debug("[Kleap Analytics]", name, data);
        // In production, this will call umami.track
      };
    }
  }, []);

  return null;
}
