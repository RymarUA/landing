// @ts-nocheck
"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

export interface CartItem {
  id: number;
  productId?: number;
  variationId?: number;
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
  addItem: (item: Omit<CartItem, "quantity">, showToast?: boolean) => AddItemResult;
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
const CART_TIMESTAMP_KEY = "fhm_cart_first_item_timestamp";

const CartContext = createContext<CartContextType | null>(null);

async function migrateLegacyCartItems(items: CartItem[]): Promise<CartItem[]> {
  let changed = false;

  const migrated = await Promise.all(
    items.map(async (item) => {
      if (item.productId != null) {
        return item;
      }

      try {
        const response = await fetch(`/api/catalog/product/${item.id}`);
        if (!response.ok) {
          return item;
        }

        const product = await response.json();
        if (!product?.id) {
          return item;
        }

        changed = true;
        return {
          ...item,
          id: product.id,
          productId: product.id,
          variationId: item.id !== product.id ? item.id : product.variationId,
        };
      } catch (error) {
        console.error("[Cart] Failed to migrate legacy cart item:", error);
        return item;
      }
    })
  );

  return changed ? migrated : items;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastQuantityToast, setLastQuantityToast] = useState<{ name: string; quantity: number } | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef(0);

  // Load initial items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setItems(parsed);

        if (parsed.some((item) => item && typeof item === "object" && item.productId == null)) {
          migrateLegacyCartItems(parsed).then((migratedItems) => {
            setItems((currentItems) => {
              if (JSON.stringify(currentItems) === JSON.stringify(migratedItems)) {
                return currentItems;
              }
              return migratedItems;
            });
          });
        }
      }
    } catch (error) {
      console.error('[Cart] Failed to load items from localStorage:', error);
      setItems([]);
    }
    setHydrated(true);
  }, []);

  // ── Sync items to localStorage whenever they change ─────────────
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        // Clear cart timestamp when cart becomes empty
        if (items.length === 0) {
          localStorage.removeItem(CART_TIMESTAMP_KEY);
        }
      } catch (error) {
        console.error('[Cart] Failed to save items to localStorage:', error);
      }
    }
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((v) => !v), []);
  
  const resetSessionTimer = useCallback(() => {
    setSessionStartTime(Date.now());
  }, []);

  // ── Prevent body scroll when cart is open ─────────────
  useEffect(() => {
    if (isCartOpen) {
      scrollPositionRef.current = window.scrollY || window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      if (scrollPositionRef.current) {
        window.scrollTo({ top: scrollPositionRef.current });
        scrollPositionRef.current = 0;
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      if (scrollPositionRef.current) {
        window.scrollTo({ top: scrollPositionRef.current });
        scrollPositionRef.current = 0;
      }
    };
  }, [isCartOpen]);

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

  const addItem = useCallback((item: Omit<CartItem, "quantity">, showToast: boolean = true): AddItemResult => {
    let wasExisting = false;
    let finalQuantity = 1;

    setItems((prev) => {
      const existing = prev.find((i) => matchItem(i, item.id, item.size));

      if (existing) {
        wasExisting = true;
        finalQuantity = existing.quantity + 1;
        if (showToast) {
          setLastQuantityToast({ name: item.name, quantity: finalQuantity });
        }
        return prev.map((i) =>
          matchItem(i, item.id, item.size) ? { ...i, quantity: finalQuantity } : i
        );
      }

      finalQuantity = 1;
      if (showToast) {
        setLastQuantityToast({ name: item.name, quantity: finalQuantity });
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    // Clear previous timer and set new one
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    
    if (showToast) {
      toastTimerRef.current = setTimeout(() => {
        setLastQuantityToast(null);
        toastTimerRef.current = null;
      }, 2000);
    }

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
    // Clear the cart timestamp when cart is cleared
    localStorage.removeItem(CART_TIMESTAMP_KEY);
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

