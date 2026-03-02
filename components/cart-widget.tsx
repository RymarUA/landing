"use client";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, X, Trash2, Instagram } from "lucide-react";
import { useCart } from "@/components/cart-context";

export function CartWidget() {
  const { items, removeItem, clearCart, totalCount, totalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const prevCount = useRef(totalCount);

  // Trigger animation when item is added
  useEffect(() => {
    if (totalCount > prevCount.current) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 600);
      prevCount.current = totalCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = totalCount;
  }, [totalCount]);

  return (
    <>
      {/* Floating cart button — always visible bottom-right */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
          bg-gradient-to-br from-rose-500 to-pink-600 text-white
          ${animate ? "scale-125 rotate-12" : "scale-100 rotate-0"}
          hover:scale-110 hover:shadow-rose-400/60`}
        aria-label="Кошик"
      >
        <ShoppingCart size={26} />
        {totalCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow
              ${animate ? "scale-125" : "scale-100"} transition-transform duration-300`}
          >
            {totalCount}
          </span>
        )}
      </button>

      {/* Cart drawer */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute bottom-0 right-0 w-full sm:w-96 bg-white rounded-t-3xl sm:rounded-tl-3xl sm:rounded-tr-none shadow-2xl transition-transform duration-300
            ${isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-full"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-rose-500" />
              <span className="font-black text-gray-900 text-lg">Кошик</span>
              {totalCount > 0 && (
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalCount} шт.
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Items */}
          <div className="px-6 py-4 max-h-72 overflow-y-auto space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Кошик порожній</p>
                <p className="text-gray-300 text-xs mt-1">Додайте товари з каталогу</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.quantity} шт. × {item.price} грн</div>
                    <div className="text-sm font-black text-rose-500">{item.price * item.quantity} грн</div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-6 pb-6 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Разом:</span>
                <span className="text-2xl font-black text-gray-900">{totalPrice} грн</span>
              </div>
              <div className="flex gap-2">
                <a
                  href="https://www.instagram.com/direct/new/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-sm"
                >
                  <Instagram size={16} />
                  Оформити замовлення
                </a>
                <button
                  onClick={clearCart}
                  className="px-3 py-3 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
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
