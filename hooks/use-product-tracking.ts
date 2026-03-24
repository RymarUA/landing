// @ts-nocheck
"use client";

import { useCallback, useEffect } from "react";
import { useWindow } from "./use-isomorphic";

/**
 * Hook for tracking product views and interactions
 */
export function useProductTracking() {
  const { isClient } = useWindow();

  const trackView = useCallback(async (
    product: {
      id: number;
      name: string;
      category: string;
      price: number;
      source?: string;
    },
    options?: { isClient?: boolean }
  ) => {
    // Check if we're in a client environment (passed as parameter or detected)
    const clientSide = options?.isClient ?? typeof window !== 'undefined';
    if (!clientSide) return;

    // Validate product data before sending
    if (!product.id || !product.name || !product.category || product.price === undefined) {
      console.error("[useProductTracking] Invalid product data for trackView:", product);
      return;
    }

    try {
      const response = await fetch("/api/analytics/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          category: product.category,
          price: product.price,
          source: product.source || "catalog",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn("[useProductTracking] Failed to track view:", response.status, errorData);
      }
    } catch (error) {
      console.error("[useProductTracking] Failed to track view:", error);
    }
  }, []);

  const trackClick = useCallback(async (
    product: {
      id: number;
      name: string;
      category: string;
      price: number;
    },
    options?: { isClient?: boolean }
  ) => {
    // Check if we're in a client environment (passed as parameter or detected)
    const clientSide = options?.isClient ?? typeof window !== 'undefined';
    if (!clientSide) return;

    console.log("[useProductTracking] Tracking click:", product.id, product.name);

    // Validate product data before sending
    if (!product.id || !product.name || !product.category || product.price === undefined) {
      console.error("[useProductTracking] Invalid product data:", product);
      return;
    }

    try {
      const response = await fetch("/api/analytics/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          category: product.category,
          price: product.price,
          source: "click",
        }),
      });

      if (response.ok) {
        console.log("[useProductTracking] Successfully tracked:", product.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn("[useProductTracking] Failed to track:", response.status, errorData);
      }
    } catch (error) {
      console.error("[useProductTracking] Failed to track click:", error);
    }
  }, []);

  return { trackView, trackClick };
}

/**
 * Hook for syncing wishlist with Sitniks
 */
export function useWishlistSync() {
  const { isClient } = useWindow();

  const syncWishlist = useCallback(async (
    productIds: number[],
    products?: Array<{ id: number; name: string; price: number; category: string }>,
    options?: { isClient?: boolean }
  ) => {
    // Check if we're in a client environment (passed as parameter or detected)
    const clientSide = options?.isClient ?? typeof window !== 'undefined';
    if (!clientSide || productIds.length === 0) return;

    console.log("[useWishlistSync] Starting sync:", productIds.length, "items");

    try {
      const response = await fetch("/api/wishlist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, products }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("[useWishlistSync] Synced successfully:", result.synced, "items");
      } else {
        console.warn("[useWishlistSync] Sync failed:", response.status);
      }
    } catch (error) {
      console.error("[useWishlistSync] Failed to sync:", error);
    }
  }, []);

  const getAlerts = useCallback(async (options?: { isClient?: boolean }) => {
    // Check if we're in a client environment (passed as parameter or detected)
    const clientSide = options?.isClient ?? typeof window !== 'undefined';
    if (!clientSide) return null;

    try {
      const response = await fetch("/api/wishlist/alerts");
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug("[useWishlistSync] Failed to get alerts:", error);
    }
    return null;
  }, []);

  return { syncWishlist, getAlerts };
}

/**
 * Hook for product notifications
 */
export function useProductNotifications() {
  const { isClient } = useWindow();

  const subscribeToPriceDrop = useCallback(async (
    productId: number,
    currentPrice: number,
    options?: { isClient?: boolean }
  ) => {
    // Check if we're in a client environment (passed as parameter or detected)
    const clientSide = options?.isClient ?? typeof window !== 'undefined';
    if (!clientSide) return false;

    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "price-drop",
          productId,
          currentPrice,
        }),
      });

      return response.ok;
    } catch (error) {
      console.debug("[useProductNotifications] Failed to subscribe:", error);
      return false;
    }
  }, []);

  const subscribeToBackInStock = useCallback(async (
    productId: number,
    options?: { isClient?: boolean }
  ) => {
    // Check if we're in a client environment (passed as parameter or detected)
    const clientSide = options?.isClient ?? typeof window !== 'undefined';
    if (!clientSide) return false;

    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "back-in-stock",
          productId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.debug("[useProductNotifications] Failed to subscribe:", error);
      return false;
    }
  }, []);

  const getAlerts = useCallback(async (options?: { isClient?: boolean }) => {
    // Check if we're in a client environment (passed as parameter or detected)
    const clientSide = options?.isClient ?? typeof window !== 'undefined';
    if (!clientSide) return null;

    console.log("[useProductNotifications] Getting alerts...");

    try {
      const response = await fetch("/api/notifications/alerts");
      if (response.ok) {
        const data = await response.json();
        console.log("[useProductNotifications] Alerts received:", data.total, "total");
        return data;
      } else {
        console.warn("[useProductNotifications] Failed to get alerts:", response.status);
      }
    } catch (error) {
      console.error("[useProductNotifications] Failed to get alerts:", error);
    }
    return null;
  }, []);

  return { subscribeToPriceDrop, subscribeToBackInStock, getAlerts };
}
