// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/cart-context";
import { ShoppingCart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Abandoned Cart Notification Component
 * 
 * Shows a notification when:
 * 1. User has items in cart
 * 2. User hasn't completed checkout
 * 3. 3-5 minutes have passed since first item was added to cart
 * 4. User hasn't dismissed the notification in this session
 */

const SHOW_DELAY_MS = 240000; // 4 minutes (between 3-5 minutes)
const STORAGE_KEY = "fhm_abandoned_cart_dismissed";
const CART_TIMESTAMP_KEY = "fhm_cart_first_item_timestamp";

export function AbandonedCartNotification() {
  const { totalCount, totalPrice, hydrated, openCart } = useCart();
  const [showNotification, setShowNotification] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!hydrated || totalCount === 0) {
      setShowNotification(false);
      return;
    }

    // Check if user dismissed it in this session
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Get timestamp when first item was added to cart
    const cartTimestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
    if (!cartTimestamp) {
      // Set timestamp when first item appears in cart
      if (totalCount > 0) {
        localStorage.setItem(CART_TIMESTAMP_KEY, Date.now().toString());
      }
      return;
    }

    // Calculate time since first item was added
    const timeSinceFirstItem = Date.now() - parseInt(cartTimestamp);
    
    if (timeSinceFirstItem >= SHOW_DELAY_MS) {
      // Show immediately if enough time has passed
      setShowNotification(true);
    } else {
      // Set timer to show after remaining delay
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, SHOW_DELAY_MS - timeSinceFirstItem);

      return () => clearTimeout(timer);
    }
  }, [hydrated, totalCount]);

  const handleDismiss = () => {
    setShowNotification(false);
    setIsDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  const handleOpenCart = () => {
    openCart();
    handleDismiss();
  };

  if (!showNotification || isDismissed || totalCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed bottom-20 sm:bottom-6 right-4 z-[120] max-w-sm"
      >
        <div className="bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white rounded-2xl shadow-2xl p-4 relative">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            aria-label="Закрити"
          >
            <X size={14} />
          </button>

          {/* Content */}
          <div className="flex items-start gap-3 pr-6">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <ShoppingCart size={24} className="text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">
                У вас є товари в кошику!
              </h3>
              <p className="text-white/90 text-sm mb-3">
                {totalCount} {totalCount === 1 ? "товар" : totalCount < 5 ? "товари" : "товарів"} на суму {totalPrice.toLocaleString("uk-UA")} грн
              </p>
              
              <button
                onClick={handleOpenCart}
                className="w-full bg-white text-emerald-600 font-bold py-2.5 px-4 rounded-xl hover:bg-emerald-50 transition-colors text-sm"
              >
                Завершити покупку
              </button>
            </div>
          </div>

          {/* Decorative pulse effect */}
          <div className="absolute -inset-1 bg-emerald-400 rounded-2xl opacity-20 blur-xl -z-10 animate-pulse" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
