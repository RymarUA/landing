// @ts-nocheck
"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ShoppingCart, X, Trash2, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { getCrossSellTitle, isGoodDeal, getDiscountPercentage, type CrossSellProduct } from "@/lib/cross-sell-recommendations";
import { OptimizedImage } from "./optimized-image";

export function CartWidget() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalCount,
    totalPrice,
    totalSavings,
    hydrated,
    isCartOpen,
    closeCart,
    toggleCart,
  } = useCart();
  const [crossSellItems, setCrossSellItems] = useState<CrossSellProduct[]>([]);
  const [loadingCrossSell, setLoadingCrossSell] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [lastQuantityToast, setLastQuantityToast] = useState<{ name: string; quantity: number } | null>(null);
  const prevCount = useRef(totalCount);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create a stable key for cart items to prevent infinite re-renders
  const cartItemsKey = useMemo(() => {
    return items.map(item => `${item.id}:${item.quantity}`).sort().join('|');
  }, [items]);

  // Wrapper for updateQuantity with toast
  const handleUpdateQuantity = useCallback((id: number, qty: number, size?: string | null) => {
    const currentItem = items.find(item => matchItem(item, id, size));
    const currentQty = currentItem?.quantity || 0;
    
    updateQuantity(id, qty, size);
    
    // Show toast only when increasing quantity
    if (qty > currentQty && currentItem) {
      setLastQuantityToast({
        name: currentItem.name,
        quantity: qty
      });
      
      // Clear any existing toast timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      
      // Clear toast after 2 seconds
      toastTimeoutRef.current = setTimeout(() => {
        setLastQuantityToast(null);
        toastTimeoutRef.current = null;
      }, 2000);
    }
  }, [items, updateQuantity]);

  // Helper function to match cart items
  const matchItem = (item: any, id: number, size?: string | null) => {
    return item.id === id && (size ?? null) === (item.size ?? null);
  };

  // Load cross-sell recommendations when cart changes
  useEffect(() => {
    if (!hydrated || items.length === 0) {
      setCrossSellItems([]);
      return;
    }

    const loadRecommendations = async () => {
      setLoadingCrossSell(true);
      try {
        const res = await fetch("/api/cross-sell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItems: items.map((i) => ({ id: i.id })), maxPrice: 500, limit: 3 }),
        });
        const recommendations: CrossSellProduct[] = res.ok ? await res.json() : [];
        setCrossSellItems(recommendations);
      } catch {
        setCrossSellItems([]);
      } finally {
        setLoadingCrossSell(false);
      }
    };

    loadRecommendations();
    // CRITICAL: Only cartItemsKey in dependencies, not items array
    // items changes reference on every cart update, causing unnecessary re-renders
    // cartItemsKey is a stable identifier that only changes when cart composition changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItemsKey, hydrated]);

  // const isProductPage = pathname?.startsWith("/product/");

  useEffect(() => {
    if (!hydrated) return;
    if (totalCount > prevCount.current) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 600);
      prevCount.current = totalCount;
      return () => clearTimeout(t);
    }
    prevCount.current = totalCount;
  }, [totalCount, hydrated]);

  // Cleanup toast timeout on component unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showBadge = hydrated && totalCount > 0;

  return (
    <>
      {/* ── Floating Cart Button ───────────────────── */}
      <AnimatePresence>
        {!isCartOpen && (
          <motion.button
            onClick={toggleCart}
            className={`fixed right-6 bottom-24 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-[110]
              bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white`}
            aria-label="Відкрити кошик"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={animate ? { 
              scale: [1, 1.2, 1.1, 1.2, 1], 
              boxShadow: [
                "0 0 0 0 rgba(27, 94, 32, 0.4)",
                "0 0 0 8px rgba(27, 94, 32, 0.2)",
                "0 0 0 16px rgba(27, 94, 32, 0.1)",
                "0 0 0 8px rgba(27, 94, 32, 0.2)",
                "0 0 0 0 rgba(27, 94, 32, 0)"
              ]
            } : { scale: 1, boxShadow: "0 0 0 0 rgba(27, 94, 32, 0)" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            initial={{ opacity: 0, scale: 0 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <ShoppingCart size={26} />
            <AnimatePresence>
              {showBadge && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1 -right-1 bg-[#FF4444] text-white text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow"
                >
                  {totalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Drawer ──────────────────────────────────── */}
      <div className={`fixed inset-0 z-[105] ${isCartOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeCart}
        />

        {/* Panel */}
        <div
          className={`absolute bottom-0 left-0 right-0 w-full bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 flex flex-col h-[70vh] overflow-hidden
            ${isCartOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          {/* Header - фиксированный */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-emerald-600" />
              <span className="font-black text-gray-900 text-lg">Кошик</span>
              {showBadge && (
                <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalCount} шт.
                </span>
              )}
            </div>
            <button
              onClick={closeCart}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Закрити"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Scrollable Content - занимает все доступное пространство */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center py-8 w-full">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShoppingCart size={64} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg font-medium mb-2">Кошик порожній</p>
                    <p className="text-gray-300 text-sm">Додайте товари з каталогу</p>
                  </motion.div>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.id}-${item.size ?? ""}`}
                  className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 transition-[max-height,opacity] duration-300 ease-out overflow-hidden max-h-32 opacity-100 data-[removing]:max-h-0 data-[removing]:opacity-0 data-[removing]:py-0 data-[removing]:mb-0"
                >
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{item.name}</p>
                    {item.size && (
                      <p className="text-xs text-gray-500">Розмір: {item.size}</p>
                    )}
                    <p className="text-emerald-600 font-black text-sm mt-0.5">
                      {(item.price * item.quantity).toLocaleString("uk-UA")} грн
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.size)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                        aria-label="Зменшити"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-bold text-gray-900 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.size)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                        aria-label="Збільшити"
                      >
                        <Plus size={11} />
                      </button>
                      <span className="text-xs text-gray-400 ml-1">× {item.price} грн</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id, item.size)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    aria-label="Видалити"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Sticky Footer - всегда виден внизу */}
          {items.length > 0 && (
            <div className="mt-auto sticky bottom-0 bg-white px-6 pb-6 pt-4 border-t border-gray-100">
              {totalSavings > 0 && (
                <p className="text-green-600 text-sm font-semibold mb-2">
                  Ви заощадили: {totalSavings.toLocaleString("uk-UA")} грн
                </p>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Разом:</span>
                <span className="text-2xl font-black text-gray-900">
                  {totalPrice.toLocaleString("uk-UA")} грн
                </span>
              </div>

              {/* Cross-sell section */}
              {(loadingCrossSell || crossSellItems.length > 0) && (
                <div className="mb-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">
                    {getCrossSellTitle(500)}
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {loadingCrossSell ? (
                      // Скелетоны для загрузки
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={`skeleton-${index}`} className="flex-shrink-0 w-36 bg-gray-50 rounded-xl p-3">
                          <div className="h-20 rounded-lg bg-gray-200 mb-2 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded mb-1 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                      ))
                    ) : (
                      crossSellItems.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-36 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors border border-gray-100">
                          {/* Product image - clickable to product page */}
                          <Link 
                            href={`/product/${item.id}`} 
                            className="block relative h-20 rounded-lg overflow-hidden bg-gray-200 mb-2 group"
                            onClick={closeCart}
                          >
                            <OptimizedImage
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="144px"
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            {/* Badge для выгодных предложений */}
                            {isGoodDeal(item) && (
                              <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                -{getDiscountPercentage(item)}%
                              </div>
                            )}
                          </Link>
                          <p className="text-xs font-medium text-gray-900 truncate leading-tight mb-1">{item.name}</p>
                          <div className="flex items-center gap-1 mb-1">
                            <p className="text-sm text-orange-500 font-bold">{item.price} грн</p>
                            {item.oldPrice && (
                              <p className="text-xs text-gray-400 line-through">{item.oldPrice} грн</p>
                            )}
                          </div>
                          {/* Rating indicator */}
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex text-yellow-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={`text-xs ${i < Math.floor(item.rating) ? '' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">({item.rating})</span>
                          </div>
                          {/* Add to cart button */}
                          <button 
                            onClick={() => handleAddRelatedProduct(item)}
                            className="w-full text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm hover:shadow-md"
                          >
                            Додати
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm shadow-lg shadow-emerald-200"
                >
                  Оформити замовлення
                </Link>
                <button
                  onClick={clearCart}
                  className="w-12 flex items-center justify-center bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-400 rounded-2xl transition-colors"
                  title="Очистити кошик"
                  aria-label="Очистити кошик"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast: quantity increased */}
      <AnimatePresence>
        {lastQuantityToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ 
              duration: 0.15,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="fixed left-4 right-4 sm:left-auto sm:right-28 z-[60] max-w-sm bottom-48 sm:bottom-32"
          >
          <motion.div 
            initial={{ scale: 0.98, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.02, duration: 0.1 }}
            className="bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-[#2E7D32]/20"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.04, duration: 0.08 }}
              className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm"
            >
              <ShoppingCart size={20} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.p 
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.1 }}
                className="text-sm font-bold leading-tight"
              >
                {lastQuantityToast.quantity === 1 ? "Товар додано в кошик!" : "Кількість збільшено!"}
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.1 }}
                className="text-xs text-white/90 mt-0.5 truncate"
              >
                {lastQuantityToast.name} × {lastQuantityToast.quantity}
              </motion.p>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.08 }}
              className="text-sm bg-white/25 px-3 py-1.5 rounded-full font-bold backdrop-blur-sm border border-white/20"
            >
              +1
            </motion.div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

