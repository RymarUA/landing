"use client";

import { useEffect } from "react";

export function CatalogSearchPrefetcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const idleCallback: typeof requestIdleCallback =
      "requestIdleCallback" in window
        ? window.requestIdleCallback.bind(window)
        : (cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 1200);

    const cancelIdle =
      "cancelIdleCallback" in window
        ? window.cancelIdleCallback.bind(window)
        : (id: number) => window.clearTimeout(id);

    const id = idleCallback(async () => {
      try {
        const cached = sessionStorage.getItem("catalog_search_index");
        if (cached) return;

        const res = await fetch("/api/catalog-search", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && Array.isArray(data.products)) {
          sessionStorage.setItem("catalog_search_index", JSON.stringify(data.products));
        }
      } catch (error) {
        console.debug("[CatalogSearchPrefetcher] Prefetch failed", error);
      }
    });

    return () => {
      cancelIdle(id as number);
    };
  }, []);

  return null;
}
