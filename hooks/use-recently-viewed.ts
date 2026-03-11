// @ts-nocheck
"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fhm_recently_viewed";
const MAX_ITEMS = 6;

export function useRecentlyViewed() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as number[];
        if (Array.isArray(parsed)) setIds(parsed);
      }
    } catch {
      setIds([]);
    }
  }, []);

  const add = useCallback((id: number) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_ITEMS);
      try {
        if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { ids, add };
}

