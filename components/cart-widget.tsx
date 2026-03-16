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
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [bottomNavHeight, setBottomNavHeight] = useState(0);
  const footerRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLDivElement>(null);
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

  // Track scroll position, viewport height, and element positions for collision detection
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleResize = () => setViewportHeight(window.innerHeight);
    
    const updateElementHeights = () => {
      // Check footer height
      const footer = document.querySelector('footer');
      if (footer) {
        setFooterHeight(footer.offsetHeight);
      }
      
      // Check bottom navigation height
      const bottomNav = document.querySelector('[data-bottom-nav]');
      if (bottomNav) {
        setBottomNavHeight(bottomNav.offsetHeight);
      }
    };
    
    handleScroll();
    handleResize();
    updateElementHeights();
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Use MutationObserver to detect when footer/bottom nav appears
    const observer = new MutationObserver(updateElementHeights);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  // Calculate adaptive bottom position with collision detection
  const getAdaptiveBottom = () => {
    const baseBottom = isProductPage ? 128 : 80; // 32 vs 20 * 4 for rem units
    const scrollThreshold = 200;
    const maxScrollOffset = 60;
    const cartButtonHeight = 64; // h-16 = 4rem = 64px
    const safetyMargin = 20; // Extra space between cart and elements
    
    let calculatedBottom = baseBottom;
    
    // Apply scroll-based adjustment
    if (scrollY > scrollThreshold) {
      const scrollProgress = Math.min((scrollY - scrollThreshold) / scrollThreshold, 1);
      calculatedBottom = baseBottom + (scrollProgress * maxScrollOffset);
    }
    
    // Check collision with footer
    if (footerHeight > 0) {
      const documentHeight = document.documentElement.scrollHeight;
      const footerTop = documentHeight - footerHeight - scrollY;
      const cartButtonTop = viewportHeight - calculatedBottom - cartButtonHeight;
      
      // If cart button would overlap with footer, lift it up
      if (cartButtonTop > footerTop - safetyMargin) {
        const overlap = cartButtonTop - (footerTop - safetyMargin);
        calculatedBottom += overlap + safetyMargin;
        console.log('🛡️ Collision detected with footer, lifting cart by', overlap + safetyMargin, 'px');
      }
    }
    
    // Check collision with bottom navigation (only on mobile)
    if (bottomNavHeight > 0 && viewportHeight < 1024) { // lg breakpoint
      calculatedBottom = Math.max(calculatedBottom, bottomNavHeight + safetyMargin);
      console.log('📱 Bottom nav detected, adjusting cart position to', calculatedBottom, 'px');
    }
    
    // Ensure maximum bottom position to prevent going off-screen
    const maxBottom = viewportHeight - cartButtonHeight - safetyMargin;
    calculatedBottom = Math.min(calculatedBottom, maxBottom);
    
    const finalBottom = Math.max(calculatedBottom, safetyMargin);
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🛒 Cart position debug:', {
        scrollY,
        viewportHeight,
        footerHeight,
        bottomNavHeight,
        baseBottom,
        calculatedBottom: finalBottom
      });
    }
    
    return finalBottom;
  };

  // Calculate adaptive bottom position for toast
  const getToastBottom = () => {
    const buttonBottom = getAdaptiveBottom();
    const toastOffset = 160; // Space above button
    return Math.max(buttonBottom + toastOffset, scrollY > 200 ? 240 : 160);
  };

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
      {/* ── Adaptive positioning container ── */}
      <div className="fixed inset-0 pointer-events-none z-[110]">
        {/* ── Adaptive floating button: position changes based on scroll ── */}
        <motion.button
          onClick={toggleCart}
          className={`absolute right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center pointer-events-auto
            bg-gradient-to-br from-emerald-600 to-emerald-700 text-white`}
          style={{
            bottom: `${getAdaptiveBottom()}px`,
            transition: 'bottom 0.3s ease-out'
          }}
          aria-label="Відкрити кошик"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={animate ? { 
            scale: [1, 1.2, 1.1, 1.2, 1], 
            boxShadow: [
              "0 0 0 0 rgba(16, 185, 129, 0.4)",
              "0 0 0 8px rgba(16, 185, 129, 0.2)",
              "0 0 0 16px rgba(16, 185, 129, 0.1)",
              "0 0 0 8px rgba(16, 185, 129, 0.2)",
              "0 0 0 0 rgba(16, 185, 129, 0)"
            ]
          } : { scale: 1, boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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
              <div className="mb-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-3">З цим товаром також куплять:</h3>
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
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ 
            duration: 0.15,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="fixed left-4 right-4 sm:left-auto sm:right-28 z-[60] max-w-sm"
          style={{
            bottom: `${getToastBottom()}px`,
            transition: 'bottom 0.3s ease-out'
          }}
        >
          <motion.div 
            initial={{ scale: 0.98, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.02, duration: 0.1 }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-emerald-400/20"
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
      </div>
    </>
  );
}

