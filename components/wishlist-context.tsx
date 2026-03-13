// @ts-nocheck
"use client";
/**
 * WishlistContext — persists a list of product IDs to localStorage.
 * Key: "fhm_wishlist_v1"
 */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-isomorphic";

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
  const ids = new Set(idsArray);

  /* ── Mark as hydrated after localStorage load ── */
  useEffect(() => {
    setHydrated(true);
  }, []);

  const toggle = useCallback((id: number) => {
    setIdsArray((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

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

