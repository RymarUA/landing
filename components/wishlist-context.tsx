// @ts-nocheck
"use client";
/**
 * WishlistContext — persists a list of product IDs to localStorage.
 * Key: "fhm_wishlist_v1"
 */
import { createContext, useContext, useEffect, useState } from "react";

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
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  /* ── Load from localStorage on mount ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: number[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setIds(new Set(parsed.filter((x) => typeof x === "number")));
        }
      }
    } catch {
      // ignore corrupt data
    } finally {
      setHydrated(true);
    }
  }, []);

  /* ── Persist to localStorage on change ── */
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // ignore quota exceeded
    }
  }, [ids, hydrated]);

  const toggle = (id: number) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

