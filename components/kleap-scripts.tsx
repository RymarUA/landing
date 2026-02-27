"use client";

import { useEffect } from "react";
import { KleapBadge } from "./kleap-badge";
import { KleapAnalytics } from "./kleap-analytics";

/**
 * Kleap Scripts Loader
 *
 * NOTE: Tailwind CDN is now loaded in layout.tsx <head> SSR (not here!)
 * This ensures it's available BEFORE React renders, fixing JIT class generation
 *
 * IMPORTANT: Scripts are loaded from kleap.co CDN so that updates propagate
 * to all existing sandboxes without needing to update each one individually.
 */
export function KleapScripts() {
  useEffect(() => {
    // Only load Kleap scripts when inside an iframe (Kleap environment)
    if (typeof window !== "undefined" && window.parent !== window) {
      // Load scripts from kleap.co CDN for automatic updates across all sandboxes
      const CDN_BASE = "https://kleap.co/_kleap";
      const scriptNames = [
        "kleap-shim.js",
        "kleap-nextjs-error-detector.js", // Next.js build error detection
        "kleap-component-selector-client.js",
        "kleap-react-tagger.js",
      ];

      scriptNames.forEach((name) => {
        const src = `${CDN_BASE}/${name}`;
        // Check if script is already loaded (check both CDN and local paths)
        if (
          !document.querySelector(`script[src="${src}"]`) &&
          !document.querySelector(`script[src="/_kleap/${name}"]`)
        ) {
          const script = document.createElement("script");
          script.src = src;
          script.defer = true;
          script.crossOrigin = "anonymous"; // Required for CDN scripts
          script.onerror = () => console.warn("Kleap script not found:", src);
          document.head.appendChild(script);
        }
      });
    }
  }, []);

  return (
    <>
      <KleapBadge />
      <KleapAnalytics />
    </>
  );
}
