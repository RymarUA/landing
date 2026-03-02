"use client";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, X, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart-context";
import Image from "next/image";
import Link from "next/link";

export function CartWidget() {
  const { items, removeItem, updateQuantity, clearCart, totalCount, totalPrice, hydrated } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const prevCount = useRef(totalCount);

  // Bounce animation when an item is added
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

  // Don't render badge until hydrated (avoids SSR mismatch)
  const showBadge = hydrated && totalCount > 0;

  return (
    <>
      {/* ── Floating button ─────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
          bg-gradient-to-br from-rose-500 to-pink-600 text-white
          ${animate ? "scale-125 rotate-12" : "scale-100 rotate-0"}
          hover:scale-110 hover:shadow-rose-500/50`}
        aria-label="Відкрити кошик"
      >
        <ShoppingCart size={26} />
        {showBadge && (
          <span
            className={`absolute -top-1 -right-1 bg-amber-400 text-gray-900 text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow
              ${animate ? "scale-125" : "scale-100"} transition-transform duration-300`}
          >
            {totalCount}
          </span>
        )}
      </button>

      {/* ── Drawer ──────────────────────────────────── */}
      <div className={`fixed inset-0 z-40 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute bottom-0 right-0 w-full sm:w-[400px] bg-white rounded-t-3xl sm:rounded-tl-3xl sm:rounded-tr-none shadow-2xl transition-transform duration-300 flex flex-col max-h-[90vh]
            ${isOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-rose-500" />
              <span className="font-black text-gray-900 text-lg">Кошик</span>
              {showBadge && (
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalCount} шт.
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Закрити"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">Кошик порожній</p>
                <p className="text-gray-300 text-xs mt-1">Додайте товари з каталогу</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                  {/* Product image */}
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{item.name}</p>
                    <p className="text-rose-500 font-black text-sm mt-0.5">
                      {(item.price * item.quantity).toLocaleString("uk-UA")} грн
                    </p>

                    {/* Quantity stepper */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-rose-300 hover:text-rose-500 transition-colors"
                        aria-label="Зменшити"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-bold text-gray-900 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-rose-300 hover:text-rose-500 transition-colors"
                        aria-label="Збільшити"
                      >
                        <Plus size={11} />
                      </button>
                      <span className="text-xs text-gray-400 ml-1">× {item.price} грн</span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    aria-label="Видалити"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-100">
              {/* Total */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Разом:</span>
                <span className="text-2xl font-black text-gray-900">
                  {totalPrice.toLocaleString("uk-UA")} грн
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm shadow-lg shadow-rose-200"
                >
                  Оформити замовлення
                </Link>
                <button
                  onClick={clearCart}
                  className="w-12 flex items-center justify-center bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-400 rounded-2xl transition-colors"
                  title="Очистити кошик"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
