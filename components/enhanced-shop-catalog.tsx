// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, ArrowUpDown, ChevronDown, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useCart } from "@/components/cart-context";
import { PromoBannerSlider } from "@/components/promo-banner-slider";
import { ModernProductCard } from "@/components/modern-product-card";
import { ProductModal } from "@/components/product-modal";
import { ALL_CATEGORIES, SORT_OPTIONS, type SortKey } from "@/lib/catalog-config";
import type { CatalogProduct as Product } from "@/lib/instagram-catalog";
import { trackAddToCart } from "@/components/analytics";

export type { Product };

interface EnhancedShopCatalogProps {
  products: Product[];
}

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;

export function EnhancedShopCatalog({ products }: EnhancedShopCatalogProps) {
  const [active, setActive] = useState("Всі");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<{ id: number; name: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const toastTimers = useRef<Map<number, number>>(new Map());
  const { addItem } = useCart();

  const addToast = useCallback((name: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, name }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current.delete(id);
    }, 2000);
    toastTimers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const toastTimersMap = toastTimers.current;
    return () => {
      toastTimersMap.forEach((t) => clearTimeout(t));
      toastTimersMap.clear();
    };
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      const searchMatch = hash.match(/search=([^&]*)/);
      if (searchMatch) {
        setSearchQuery(decodeURIComponent(searchMatch[1].replace(/^#/, "")));
      }
      const catMatch = hash.match(/category=([^&#]*)/);
      if (catMatch) {
        const cat = decodeURIComponent(catMatch[1].trim());
        if (ALL_CATEGORIES.includes(cat as (typeof ALL_CATEGORIES)[number])) {
          setActive(cat);
          setVisibleCount(INITIAL_VISIBLE);
        }
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const filtered = products.filter((p) => {
    // Special category: "Безкоштовна доставка" filters by freeShipping flag
    if (active === "Безкоштовна доставка") {
      if (!p.freeShipping) return false;
    } else if (active !== "Всі" && p.category !== active) {
      return false;
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      )
        return false;
    }
    if (minPrice && p.price < Number(minPrice)) return false;
    if (maxPrice && p.price > Number(maxPrice)) return false;
    if (onlyInStock && p.stock === 0) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "rating": return b.rating - a.rating;
      case "newest": return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      default: return 0;
    }
  });

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: product.sizes[0] ?? null,
        oldPrice: product.oldPrice ?? null,
      });
      addToast(product.name);
      
      // Track add to cart event
      trackAddToCart({
        contentId: product.id,
        contentName: product.name,
        value: product.price,
        currency: "UAH",
      });
    },
    [addItem, addToast]
  );

  const handleCategoryChange = useCallback((category: string) => {
    setActive(category);
    window.location.hash = `category=${encodeURIComponent(category)}`;
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  // СВАЙП ПО КАТЕГОРІЯХ
  const handleSwipe = useCallback((_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > 50 && Math.abs(offset.x) > Math.abs(offset.y) && Math.abs(velocity.x) > 300) {
      const idx = ALL_CATEGORIES.indexOf(active as (typeof ALL_CATEGORIES)[number]);
      let nextIdx;
      if (offset.x < 0) {
        nextIdx = (idx + 1) % ALL_CATEGORIES.length;
      } else {
        nextIdx = (idx - 1 + ALL_CATEGORIES.length) % ALL_CATEGORIES.length;
      }
      if (nextIdx !== idx) {
        const nextCat = ALL_CATEGORIES[nextIdx];
        handleCategoryChange(nextCat);
      }
    }
  }, [active, handleCategoryChange]);

  const clearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyInStock(false);
    setSortKey("default");
    setActive("Всі");
  };

  const hasActiveFilters = searchQuery || minPrice || maxPrice || onlyInStock || sortKey !== "default" || active !== "Всі";
  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Сортування";
  const visibleSorted = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <>
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToCart={handleAddToCart}
          searchQuery={searchQuery}
        />
      )}

      {/* Toast notifications with animation */}
      <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-24 z-[55] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-gray-900 text-white text-sm font-medium py-3 px-4 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
            role="status"
          >
            «{t.name}» додано до кошика
          </div>
        ))}
      </div>

      {/* Motion section with swipe */}
      <motion.section 
        id="catalog" 
        className="bg-white py-4 sm:py-6 px-2 sm:px-3"
        onPanEnd={handleSwipe}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        dragSnapToOrigin={true}
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Promo Banner */}
          {active === "Всі" && !searchQuery && (
            <div className="mb-3 sm:mb-4">
              <PromoBannerSlider />
            </div>
          )}

          {/* Заголовок */}
          <div className="mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 mb-0.5 sm:mb-1">
              {active === "Всі" ? "Всі товари" : active}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              {sorted.length} {sorted.length === 1 ? "товар" : sorted.length < 5 ? "товари" : "товарів"}
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-1.5 sm:gap-2 bg-gray-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-1 sm:gap-2 bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-gray-700 hover:border-gray-300 transition-colors"
                >
                  <ArrowUpDown size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400" />
                  <span className="hidden sm:inline">{activeSortLabel}</span>
                  <ChevronDown size={12} className={`sm:w-[14px] sm:h-[14px] text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                {sortOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg sm:rounded-xl shadow-xl z-30 min-w-[160px] sm:min-w-[200px] overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortKey(opt.value); setSortOpen(false); }}
                        className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs transition-colors hover:bg-gray-50 ${
                          sortKey === opt.value ? "font-bold text-emerald-600 bg-emerald-50" : "text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-1 sm:gap-2 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold transition-colors ${
                  showFilters
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <SlidersHorizontal size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span className="hidden sm:inline">Фільтри</span>
                {(minPrice || maxPrice || onlyInStock) && (
                  <span className="bg-[#FF8C00] text-white text-[9px] sm:text-[10px] font-black rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">!</span>
                )}
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                Скинути
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex flex-wrap gap-2 sm:gap-3 items-end">
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  <label className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase">Від (грн)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="100"
                    min={0}
                    className="w-20 sm:w-24 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  <label className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase">До (грн)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="5000"
                    min={0}
                    className="w-20 sm:w-24 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="accent-emerald-500 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded"
                  />
                  Тільки в наявності
                </label>
              </div>
            </div>
          )}

          {/* Grid */}
          {sorted.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl sm:rounded-2xl">
              <Search size={40} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
              <p className="font-bold text-base sm:text-lg text-gray-500 mb-1 sm:mb-2">Нічого не знайдено</p>
              <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">Спробуйте змінити фільтри</p>
              <button 
                onClick={clearFilters} 
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors"
              >
                Скинути фільтри
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2">
                <AnimatePresence mode="popLayout">
                  {visibleSorted.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-full"
                    >
                      <ModernProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        onClick={setModalProduct}
                        searchQuery={searchQuery}
                        priority={index < 6} // First 6 images get priority in grid
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {hasMore && (
                <div className="mt-4 sm:mt-6 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                  >
                    Завантажити ще ({sorted.length - visibleCount})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.section>
    </>
  );
}

export default React.memo(EnhancedShopCatalog);
