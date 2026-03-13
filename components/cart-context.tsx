// @ts-nocheck
"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/use-isomorphic";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string | null;
  oldPrice?: number | null;
}

/** Unique key for cart line: same product + same size = one line */
export function getCartItemKey(item: Pick<CartItem, "id" | "size">): string {
  return `${item.id}-${item.size ?? ""}`;
}

export type AddItemResult = { wasExisting: boolean; quantity: number };

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => AddItemResult;
  removeItem: (id: number, size?: string | null) => void;
  updateQuantity: (id: number, qty: number, size?: string | null) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
  totalSavings: number;
  hydrated: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  lastQuantityToast: { name: string; quantity: number } | null;
  sessionStartTime: number;
  resetSessionTimer: () => void;
}

const STORAGE_KEY = "fhm_cart_v1";

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems, hydrateCart] = useLocalStorage<CartItem[]>(STORAGE_KEY, []);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastQuantityToast, setLastQuantityToast] = useState<{ name: string; quantity: number } | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((v) => !v), []);
  
  const resetSessionTimer = useCallback(() => {
    setSessionStartTime(Date.now());
  }, []);

  // ── Mark as hydrated after localStorage load ─────────────
  useEffect(() => {
    setHydrated(true);
  }, []);

  // ── Cleanup toast timer on unmount ─────────────
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const matchItem = useCallback(
    (i: CartItem, id: number, size?: string | null) =>
      i.id === id && (i.size ?? "") === (size ?? ""),
    []
  );

  const addItem = useCallback((item: Omit<CartItem, "quantity">): AddItemResult => {
    let wasExisting = false;
    let finalQuantity = 1;

    setItems((prev) => {
      const existing = prev.find((i) => matchItem(i, item.id, item.size));

      if (existing) {
        wasExisting = true;
        finalQuantity = existing.quantity + 1;
        setLastQuantityToast({ name: item.name, quantity: finalQuantity });
        return prev.map((i) =>
          matchItem(i, item.id, item.size) ? { ...i, quantity: finalQuantity } : i
        );
      }

      finalQuantity = 1;
      setLastQuantityToast({ name: item.name, quantity: finalQuantity });
      return [...prev, { ...item, quantity: 1 }];
    });

    // Clear previous timer and set new one
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    
    toastTimerRef.current = setTimeout(() => {
      setLastQuantityToast(null);
      toastTimerRef.current = null;
    }, 2000);

    return { wasExisting, quantity: finalQuantity };
  }, [matchItem]);

  const removeItem = useCallback(
    (id: number, size?: string | null) => {
      setItems((prev) => prev.filter((i) => !matchItem(i, id, size)));
    },
    [matchItem]
  );

  const updateQuantity = useCallback(
    (id: number, qty: number, size?: string | null) => {
      if (qty <= 0) {
        setItems((prev) => prev.filter((i) => !matchItem(i, id, size)));
      } else {
        setItems((prev) =>
          prev.map((i) =>
            matchItem(i, id, size) ? { ...i, quantity: qty } : i
          )
        );
      }
    },
    [matchItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalSavings = items.reduce(
    (sum, i) =>
      sum +
      (i.oldPrice ? Math.max(0, i.oldPrice - i.price) * i.quantity : 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalPrice,
        totalSavings,
        hydrated,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        lastQuantityToast,
        sessionStartTime,
        resetSessionTimer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

