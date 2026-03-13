// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, ArrowUpDown, ChevronDown, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/components/cart-context";
import { PromoBannerSlider } from "@/components/promo-banner-slider";
import { ModernProductCard } from "@/components/modern-product-card";
import { ProductModal } from "@/components/product-modal";
import { QuickBuyModal } from "@/components/quick-buy-modal";
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
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);
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

      {quickBuyProduct && (
        <QuickBuyModal
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-24 z-[55] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-900 text-white text-sm font-medium py-3 px-4 rounded-2xl shadow-xl pointer-events-auto"
              role="status"
            >
              «{t.name}» додано до кошика
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <section id="catalog" className="bg-white py-6 px-3 min-h-screen">
        <div className="max-w-[1400px] mx-auto">
          {/* Promo Banner */}
          {active === "Всі" && !searchQuery && (
            <div className="mb-4">
              <PromoBannerSlider />
            </div>
          )}

          {/* Заголовок каталогу */}
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-1">
              {active === "Всі" ? "Всі товари" : active}
            </h2>
            <p className="text-gray-500 text-sm">
              {sorted.length} {sorted.length === 1 ? "товар" : sorted.length < 5 ? "товари" : "товарів"}
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2 bg-gray-50 p-3 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Сортування */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300 transition-colors"
                >
                  <ArrowUpDown size={14} className="text-gray-400" />
                  <span className="hidden sm:inline">{activeSortLabel}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                {sortOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-30 min-w-[200px] overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortKey(opt.value); setSortOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-gray-50 ${
                          sortKey === opt.value ? "font-bold text-emerald-600 bg-emerald-50" : "text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Фільтри */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  showFilters
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Фільтри</span>
                {(minPrice || maxPrice || onlyInStock) && (
                  <span className="bg-[#FF8C00] text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Скинути фільтри */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                <X size={14} />
                Скинути
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-600 uppercase">
                    Від (грн)
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="100"
                    min={0}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-600 uppercase">
                    До (грн)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="5000"
                    min={0}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded"
                  />
                  Тільки в наявності
                </label>
              </div>
            </div>
          )}

          {/* Grid - ЯК НА TEMU */}
          {sorted.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl">
              <Search size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-lg text-gray-500 mb-2">Нічого не знайдено</p>
              <p className="text-sm text-gray-400 mb-4">
                Спробуйте змінити фільтри
              </p>
              <button 
                onClick={clearFilters} 
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-lg transition-colors"
              >
                Скинути фільтри
              </button>
            </div>
          ) : (
            <>
              {/* СІТКА ЯК НА TEMU - щільна, без великих gap */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                <AnimatePresence mode="popLayout">
                  {visibleSorted.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      <ModernProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        onClick={setModalProduct}
                        onQuickBuy={setQuickBuyProduct}
                        searchQuery={searchQuery}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
                    className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Завантажити ще ({sorted.length - visibleCount})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

export default React.memo(EnhancedShopCatalog);
