"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

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
}

const STORAGE_KEY = "fhm_cart_v1";

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastQuantityToast, setLastQuantityToast] = useState<{ name: string; quantity: number } | null>(null);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((v) => !v), []);

  // ── Rehydrate from localStorage on mount (client-only) ─────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        // Basic validation: must be array of objects with id & quantity
        if (Array.isArray(parsed) && parsed.every((i) => typeof i.id === "number")) {
          setItems(parsed);
        }
      }
    } catch {
      // Corrupt data — silently ignore
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // ── Persist to localStorage whenever cart changes (after hydration) ─
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage quota exceeded or blocked — ignore
    }
  }, [items, hydrated]);

  const matchItem = useCallback(
    (i: CartItem, id: number, size?: string | null) =>
      i.id === id && (i.size ?? "") === (size ?? ""),
    []
  );

  const addItem = useCallback((item: Omit<CartItem, "quantity">): AddItemResult => {
    let result: AddItemResult = { wasExisting: false, quantity: 1 };
    setItems((prev) => {
      const existing = prev.find((i) => matchItem(i, item.id, item.size));
      if (existing) {
        const newQty = existing.quantity + 1;
        result = { wasExisting: true, quantity: newQty };
        setLastQuantityToast({ name: item.name, quantity: newQty });
        return prev.map((i) =>
          matchItem(i, item.id, item.size) ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    return result;
  }, [matchItem]);

  useEffect(() => {
    if (!lastQuantityToast) return;
    const t = setTimeout(() => setLastQuantityToast(null), 2000);
    return () => clearTimeout(t);
  }, [lastQuantityToast]);

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
      (i.oldPrice ? (i.oldPrice - i.price) * i.quantity : 0),
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
