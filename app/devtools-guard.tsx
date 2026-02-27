"use client";

import { useEffect } from "react";

/**
 * 🛡️ DevTools Guard - Prevents corrupted React DevTools from crashing the app
 *
 * This component patches broken React DevTools extensions that have incomplete hooks.
 * Common in outdated Chrome extensions or when multiple versions conflict.
 *
 * Symptoms of broken DevTools:
 * - "Cannot read properties of undefined (reading 'call')"
 * - "window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on is not a function"
 * - App works in Firefox/Incognito but crashes in Chrome
 *
 * @see https://github.com/facebook/react/issues/25186
 */
export function DevToolsGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

    if (!hook) return; // No DevTools installed

    // Fix missing or broken methods
    if (typeof hook.on !== "function") {
      hook.on = () => {};
    }
    if (typeof hook.off !== "function") {
      hook.off = () => {};
    }
    if (typeof hook.emit !== "function") {
      hook.emit = () => {};
    }
    if (!hook.renderers) {
      hook.renderers = new Map();
    }
    if (!hook.supportsFiber) {
      hook.supportsFiber = true;
    }

    console.log(
      "✅ DevTools guard active - protected against broken extensions",
    );
  }, []);

  return null; // This component renders nothing
}
