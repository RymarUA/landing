"use client";

import { useState, useEffect } from "react";
import { useCart } from "./cart-context";
import { ShoppingCart, X } from "lucide-react";

export function CartReminder() {
  const { items, totalCount, totalPrice, openCart, sessionStartTime, resetSessionTimer } = useCart();
  const [showReminder, setShowReminder] = useState(false);
  const [hasShownReminder, setHasShownReminder] = useState(false);

  useEffect(() => {
    // Only show reminder if there are items in cart and we haven't shown it yet
    if (items.length === 0 || hasShownReminder) return;

    // Calculate time since session started
    const timeSinceStart = Date.now() - sessionStartTime;
    const timeUntilReminder = 5 * 60 * 1000 - timeSinceStart; // 5 minutes minus time already passed

    // If more than 5 minutes have already passed, show immediately
    if (timeSinceStart >= 5 * 60 * 1000) {
      setShowReminder(true);
      setHasShownReminder(true);
      return;
    }

    // Otherwise, set timer for remaining time
    const timer = setTimeout(() => {
      setShowReminder(true);
      setHasShownReminder(true);
    }, Math.max(0, timeUntilReminder));

    // Clear timer if component unmounts or cart becomes empty
    return () => clearTimeout(timer);
  }, [items.length, hasShownReminder, sessionStartTime]);

  // Reset reminder flag when cart becomes empty
  useEffect(() => {
    if (items.length === 0) {
      setHasShownReminder(false);
      setShowReminder(false);
    }
  }, [items.length]);

  // Reset session timer when user interacts with cart (opens it)
  useEffect(() => {
    if (showReminder) {
      resetSessionTimer();
    }
  }, [showReminder, resetSessionTimer]);

  if (!showReminder || items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 relative">
        {/* Close button */}
        <button
          onClick={() => setShowReminder(false)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Закрити"
        >
          <X size={14} className="text-gray-500" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={20} className="text-orange-500" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Забули щось? 🛒</h3>
            <p className="text-sm text-gray-600 mb-3">
              У вашому кошику {totalCount} {totalCount === 1 ? 'товар' : totalCount >= 5 ? 'товарів' : 'товари'} на суму {totalPrice.toLocaleString("uk-UA")} грн
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  openCart();
                  setShowReminder(false);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
              >
                Переглянути кошик
              </button>
              <button
                onClick={() => setShowReminder(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Пізніше
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
