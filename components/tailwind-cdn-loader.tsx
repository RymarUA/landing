"use client";

import { useEffect } from "react";

/**
 * Tailwind CSS v4 CDN Loader
 *
 * CODESANDBOX: Uses CDN (lightningcss binary doesn't work in browser)
 * VERCEL: This file is REPLACED by empty-loader.tsx via webpack (no CDN!)
 *
 * IMPORTANT: If this code executes, it means we're in preview/development
 * (CodeSandbox, E2B, localhost). On Vercel production, webpack replaces
 * this entire file with an empty component, so this code never runs.
 */
export function TailwindCDNLoader() {
  useEffect(() => {
    // If this code runs, we're in preview/development - ALWAYS load CDN
    // On Vercel, webpack replaces this file so this code never executes
    if (typeof window !== "undefined") {
      console.log("🎨 [Tailwind] Loading CDN for preview/development");

      // CRITICAL: Load Tailwind config BEFORE the CDN script
      const tailwindStyle = document.createElement("style");
      tailwindStyle.type = "text/tailwindcss";
      tailwindStyle.textContent = `
          @theme {
            /* Base radius */
            --radius: 0.625rem;

            /* Neutral colors */
            --color-neutral-50: rgb(250 250 250);
            --color-neutral-100: rgb(245 245 245);
            --color-neutral-200: rgb(229 229 229);
            --color-neutral-300: rgb(212 212 212);
            --color-neutral-400: rgb(163 163 163);
            --color-neutral-500: rgb(115 115 115);
            --color-neutral-600: rgb(82 82 82);
            --color-neutral-700: rgb(64 64 64);
            --color-neutral-800: rgb(38 38 38);
            --color-neutral-900: rgb(23 23 23);

            /* Custom colors from config */
            --color-primary: #020022;
            --color-muted: rgb(82 82 82);
            --color-muted-light: rgb(212 212 212);

            /* Custom animations */
            --animate-scroll: scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite;
            --animate-marquee: marquee var(--marquee-duration) linear infinite;
            --animate-fade-in: fade-in 0.5s linear forwards;
          }

          /* Keyframes from config */
          @keyframes scroll {
            to { transform: translate(calc(-50% - 0.5rem)); }
          }

          @keyframes marquee {
            100% { transform: translateY(-50%); }
          }

          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          /* Custom utilities - box-shadows */
          .shadow-derek {
            box-shadow: 0px 0px 0px 1px rgb(0 0 0 / 0.06),
              0px 1px 1px -0.5px rgb(0 0 0 / 0.06),
              0px 3px 3px -1.5px rgb(0 0 0 / 0.06),
              0px 6px 6px -3px rgb(0 0 0 / 0.06),
              0px 12px 12px -6px rgb(0 0 0 / 0.06),
              0px 24px 24px -12px rgb(0 0 0 / 0.06);
          }

          .shadow-aceternity {
            box-shadow: 0px 2px 3px -1px rgba(0,0,0,0.1),
              0px 1px 0px 0px rgba(25,28,33,0.02),
              0px 0px 0px 1px rgba(25,28,33,0.08);
          }

          /* Background images */
          .bg-gradient-radial {
            background-image: radial-gradient(var(--tw-gradient-stops));
          }

          .bg-gradient-conic {
            background-image: conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops));
          }

      `;
      document.head.insertBefore(tailwindStyle, document.head.firstChild);

      // Load Tailwind v4 browser CDN (AFTER config)
      const tailwindScript = document.createElement("script");
      tailwindScript.src =
        "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";
      document.head.appendChild(tailwindScript);
    }
  }, []);

  return null;
}
