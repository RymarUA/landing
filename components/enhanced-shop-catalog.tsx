// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { X, Search, ArrowUpDown, ChevronDown, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useCart } from "@/components/cart-context";
import { ProductModalSkeleton } from "@/components/product-modal-skeleton";
import { PromoBannerSlider } from "@/components/promo-banner-slider";
import { CategoryIconsSlider } from "@/components/category-icons-slider";
import { ModernProductCard } from "@/components/modern-product-card";
import { QuickBuyModal } from "@/components/quick-buy-modal";
import { ALL_CATEGORIES, SORT_OPTIONS, type SortKey } from "@/lib/catalog-config";
import type { CatalogProduct as Product } from "@/lib/instagram-catalog";

const ProductModal = dynamic(
  () => import("@/components/product-modal").then(m => ({ default: m.ProductModal })),
  { loading: () => <ProductModalSkeleton /> }
);

export type { Product };

interface EnhancedShopCatalogProps {
  products: Product[];
}

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 8;

export function EnhancedShopCatalog({ products }: EnhancedShopCatalogProps) {
  const [active, setActive] = useState("Всі");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<{ id: number; name: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [catalogVisible, setCatalogVisible] = useState(true);
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
        searchInputRef.current?.focus();
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
    if (active !== "Всі" && p.category !== active) return false;
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
    },
    [addItem, addToast]
  );

  const handleSwipe = useCallback((_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > 40 && Math.abs(offset.x) > Math.abs(offset.y) && Math.abs(velocity.x) > 200) {
      const idx = ALL_CATEGORIES.indexOf(active as (typeof ALL_CATEGORIES)[number]);
      let nextIdx;
      if (offset.x < 0) {
        nextIdx = (idx + 1) % ALL_CATEGORIES.length;
      } else {
        nextIdx = (idx - 1 + ALL_CATEGORIES.length) % ALL_CATEGORIES.length;
      }
      if (nextIdx !== idx) {
        const nextCat = ALL_CATEGORIES[nextIdx];
        setActive(nextCat);
        window.history.replaceState(null, "", `#category=${encodeURIComponent(nextCat)}`);
        setVisibleCount(INITIAL_VISIBLE);
        setCatalogVisible(false);
        setTimeout(() => setCatalogVisible(true), 120);
      }
    }
  }, [active]);

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

      <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-24 z-[55] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-gray-900 text-white text-sm font-medium py-3 px-4 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 duration-300"
            role="status"
          >
            «{t.name}» додано до кошика
          </div>
        ))}
      </div>

      <motion.section id="catalog" className="bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Promo Banner */}
          {active === "Всі" && !searchQuery && <PromoBannerSlider />}

          {/* Category Icons Slider */}
          <CategoryIconsSlider
            onCategoryChange={(cat) => {
              setActive(cat);
              setVisibleCount(INITIAL_VISIBLE);
              setCatalogVisible(false);
              setTimeout(() => setCatalogVisible(true), 120);
              window.history.replaceState(null, "", `#category=${encodeURIComponent(cat)}`);
            }}
            initialCategory={active}
          />

          {/* Search bar */}
          <div className="relative mb-5 mt-6 max-w-xl mx-auto">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за назвою, категорією…"
              className="w-full pl-9 pr-10 py-3 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:border-emerald-300 transition-colors shadow-sm"
                >
                  <ArrowUpDown size={14} className="text-gray-400" />
                  {activeSortLabel}
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                {sortOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg z-30 min-w-[200px] overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortKey(opt.value); setSortOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-emerald-50 hover:text-emerald-600 ${
                          sortKey === opt.value ? "font-bold text-emerald-500 bg-emerald-50" : "text-gray-700"
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
                className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-sm font-semibold transition-colors shadow-sm ${
                  showFilters
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300"
                }`}
              >
                <SlidersHorizontal size={14} />
                Фільтри
                {(minPrice || maxPrice || onlyInStock) && (
                  <span className="bg-[#D4AF37] text-white text-xs font-black rounded-full w-4 h-4 flex items-center justify-center">!</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {sorted.length} товар{sorted.length === 1 ? "" : sorted.length >= 5 ? "ів" : "и"}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-700 font-semibold transition-colors"
                >
                  <X size={12} />
                  Скинути
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Від (грн)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="100"
                  min={0}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">До (грн)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="5000"
                  min={0}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
          )}

          {/* Grid */}
          {sorted.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-lg text-gray-500">Нічого не знайдено</p>
              <p className="text-sm mt-1">Спробуйте змінити фільтри або пошуковий запит</p>
              <button onClick={clearFilters} className="mt-4 text-emerald-500 font-semibold text-sm hover:underline">
                Скинути фільтри
              </button>
            </div>
          ) : (
            <>
              <motion.div
                className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity duration-150 ${catalogVisible ? "opacity-100" : "opacity-0"}`}
                onPanEnd={handleSwipe}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragSnapToOrigin={true}
              >
                <AnimatePresence mode="wait">
                  {visibleSorted.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
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
              </motion.div>
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
                    className="px-6 py-3 rounded-2xl border-2 border-emerald-500 text-emerald-500 font-bold text-sm hover:bg-emerald-50 transition-colors"
                  >
                    Завантажити ще
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
