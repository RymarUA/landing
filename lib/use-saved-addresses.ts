// @ts-nocheck
"use client";
/**
 * useSavedAddresses — persist last delivery address (city + warehouse) in localStorage.
 * Key: fhm_last_address
 * Used on checkout to suggest "Використати збережену адресу".
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "fhm_last_address";

export interface SavedAddress {
  city: string;
  warehouse: string;
  cityRef?: string;
}

export function useSavedAddresses() {
  const [saved, setSaved] = useState<SavedAddress | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as SavedAddress;
        if (parsed && typeof parsed.city === "string" && typeof parsed.warehouse === "string") {
          setSaved(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  const save = useCallback((address: SavedAddress) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
      setSaved(address);
    } catch {
      // quota or private mode
    }
  }, []);

  return { saved, save, hydrated };
}

