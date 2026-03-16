// @ts-nocheck
"use client";
/**
 * WishlistContext — persists a list of product IDs to localStorage.
 * Key: "fhm_wishlist_v1"
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-isomorphic";
import { useWishlistSync } from "@/hooks/use-product-tracking";

const STORAGE_KEY = "fhm_wishlist_v1";

interface WishlistContextValue {
  ids: Set<number>;
  toggle: (id: number) => void;
  has: (id: number) => boolean;
  count: number;
  hydrated: boolean;
}

const WishlistContext = createContext<WishlistContextValue>({
  ids: new Set(),
  toggle: () => {},
  has: () => false,
  count: 0,
  hydrated: false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [idsArray, setIdsArray] = useLocalStorage<number[]>(STORAGE_KEY, []);
  const [hydrated, setHydrated] = useState(false);
  const { syncWishlist } = useWishlistSync();
  const ids = new Set(idsArray);

  /* ── Mark as hydrated after localStorage load ── */
  useEffect(() => {
    setHydrated(true);
  }, []);

  /* ── Sync wishlist to Sitniks when it changes ── */
  useEffect(() => {
    if (hydrated && idsArray.length > 0) {
      console.log("[wishlist-context] Syncing wishlist:", idsArray.length, "items");
      
      // Debounce sync to avoid too many requests
      const timer = setTimeout(() => {
        syncWishlist(idsArray);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [idsArray, hydrated, syncWishlist]);

  const toggle = useCallback((id: number) => {
    setIdsArray((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  }, [setIdsArray]);

  return (
    <WishlistContext.Provider
      value={{ ids, toggle, has: (id) => ids.has(id), count: ids.size, hydrated }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}

