// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ShoppingCart, X, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart-context";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function CartWidget() {
  const pathname = usePathname();
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
    lastQuantityToast,
  } = useCart();
  const [animate, setAnimate] = useState(false);
  const prevCount = useRef(totalCount);

  const isProductPage = pathname?.startsWith("/product/");

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

  const showBadge = hydrated && totalCount > 0;

  return (
    <>
      {/* ── Floating button: on product page move up on mobile to avoid sticky bar ── */}
      <motion.button
        onClick={toggleCart}
        className={`fixed right-6 z-[110] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center
          ${isProductPage ? "bottom-32 md:bottom-24" : "bottom-20 md:bottom-24"}
          bg-gradient-to-br from-emerald-600 to-emerald-700 text-white`}
        aria-label="Відкрити кошик"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={animate ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <ShoppingCart size={26} />
        <AnimatePresence>
          {showBadge && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow"
            >
              {totalCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Drawer ──────────────────────────────────── */}
      <div className={`fixed inset-0 z-[105] ${isCartOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeCart}
        />

        {/* Panel */}
        <div
          className={`absolute bottom-0 right-0 w-full sm:w-[400px] bg-white rounded-t-3xl sm:rounded-tl-3xl sm:rounded-tr-none shadow-2xl transition-transform duration-300 flex flex-col max-h-[90vh]
            ${isCartOpen ? "translate-y-0" : "translate-y-full"}`}
        >
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

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">Кошик порожній</p>
                <p className="text-gray-300 text-xs mt-1">Додайте товари з каталогу</p>
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
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                        aria-label="Зменшити"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-bold text-gray-900 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
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

          {items.length > 0 && (
            <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-100">
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
              <div className="mb-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">З цим товаром також купують:</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-32 bg-gray-50 rounded-xl p-2">
                      <div className="relative h-20 rounded-lg overflow-hidden bg-gray-200 mb-2">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-orange-500 font-bold">{item.price} грн</p>
                    </div>
                  ))}
                </div>
              </div>

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
      {lastQuantityToast && (
        <div
          className="fixed bottom-24 md:bottom-6 left-4 right-4 sm:left-auto sm:right-24 z-[60] max-w-sm bg-gray-900 text-white text-sm font-medium py-3 px-4 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300"
          role="status"
        >
          Кількість товару «{lastQuantityToast.name}» збільшено до {lastQuantityToast.quantity}
        </div>
      )}
    </>
  );
}

