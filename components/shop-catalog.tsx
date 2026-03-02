"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  CreditCard,
  Heart,
  SlidersHorizontal,
  Search,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useWishlist } from "@/components/wishlist-context";
import { ProductModal } from "@/components/product-modal";
import { ALL_CATEGORIES, SORT_OPTIONS, type SortKey } from "@/lib/catalog-config";
import type { CatalogProduct as Product } from "@/lib/instagram-catalog";

export type { Product };

/* ─── Highlight matched text ─────────────────────────── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-gray-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ─── Stars ──────────────────────────────────────── */
function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
      <span className="text-xs text-gray-400 ml-0.5">({count})</span>
    </div>
  );
}

/* ─── Wishlist Heart Button ───────────────────────── */
function WishlistButton({ product }: { product: Product }) {
  const { has, toggle, hydrated } = useWishlist();
  const isWished = hydrated && has(product.id);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(product.id); }}
      title={isWished ? "Видалити зі списку бажань" : "Додати до бажань"}
      aria-label={isWished ? "Видалити зі списку бажань" : "Додати до бажань"}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all duration-200 z-10 ${
        isWished
          ? "bg-orange-500 text-white"
          : "bg-white/80 backdrop-blur-sm text-gray-400 hover:text-orange-400"
      }`}
    >
      <Heart size={14} className={isWished ? "fill-white" : ""} />
    </button>
  );
}

/* ─── Horizontal New Arrivals scroll ─────────────── */
function HorizontalScroll({ items, onOpen }: { items: Product[]; onOpen: (p: Product) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    ref.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white shadow-lg rounded-full items-center justify-center hover:bg-orange-50 transition-colors hidden sm:flex"
      >
        <ChevronLeft size={18} className="text-gray-600" />
      </button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((product) => (
          <div
            key={product.id}
            onClick={() => onOpen(product)}
            className="flex-shrink-0 w-52 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group snap-start relative"
          >
            <WishlistButton product={product} />
            <div className="relative h-36 overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="208px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                {product.isNew && (
                  <span className="bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={9} /> NEW
                  </span>
                )}
                {product.isHit && !product.isNew && (
                  <span className="bg-amber-400 text-gray-900 text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Flame size={9} /> ХІТ
                  </span>
                )}
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-400 mb-0.5">{product.category}</p>
              <p className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</p>
              <StarRow rating={product.rating} count={product.reviews} />
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-orange-500 font-black text-base">{product.price} грн</span>
                {product.oldPrice && (
                  <span className="text-gray-400 text-xs line-through">{product.oldPrice} грн</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white shadow-lg rounded-full items-center justify-center hover:bg-orange-50 transition-colors hidden sm:flex"
      >
        <ChevronRight size={18} className="text-gray-600" />
      </button>
    </div>
  );
}

/* ─── Main Catalog (Client Component, receives data via props) ──── */
interface ShopCatalogProps {
  products: Product[];
}

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 8;

export function ShopCatalog({ products }: ShopCatalogProps) {
  const [active, setActive] = useState("Всі");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
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
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const categoryTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { addItem } = useCart();

  const addToast = useCallback((name: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, name }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
  }, []);

  /* Read search and category from URL hash */
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
        if (ALL_CATEGORIES.includes(cat as (typeof ALL_CATEGORIES)[number])) setActive(cat);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  /* Scroll active category tab into view on mobile */
  useEffect(() => {
    const el = categoryTabRefs.current[active];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  /* Close sort dropdown on click outside */
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  /* Reset visible count when filters/category/search/sort change */
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [active, searchQuery, sortKey, minPrice, maxPrice, onlyInStock]);

  const newArrivals = products.filter((p) => p.isNew || p.isHit).slice(0, 6);

  /* ── Apply filters ── */
  const filtered = products
    .filter((p) => {
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

  /* ── Apply sorting ── */
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "price_asc":  return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "rating":     return b.rating - a.rating;
      case "newest":     return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      default:           return 0;
    }
  });

  const handleAddToCart = useCallback(
    (product: Product, size?: string | null) => {
      const key = `${product.id}-${size ?? ""}`;
      const result = addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: size ?? null,
        oldPrice: product.oldPrice ?? null,
      });
      setAddedIds((prev) => new Set(prev).add(key));
      setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(key); return n; }), 1200);
      if (!result.wasExisting) addToast(product.name);
    },
    [addItem, addToast]
  );

  const handleBuyNow = useCallback(
    (product: Product, size?: string | null) => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: size ?? null,
        oldPrice: product.oldPrice ?? null,
      });
      router.push("/checkout");
    },
    [addItem, router]
  );
  const clearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyInStock(false);
    setSortKey("default");
    setActive("Всі");
  };

  const hasActiveFilters =
    searchQuery || minPrice || maxPrice || onlyInStock || sortKey !== "default" || active !== "Всі";

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

      {/* Toasts: "X додано до кошика" */}
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

      {/* ── New Arrivals ── */}
      <section id="new-arrivals" className="bg-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Щойно додано</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Нові надходження та хіти</h2>
            </div>
            <button
              onClick={() => setActive("Всі")}
              className="text-sm text-orange-500 font-semibold hover:underline hidden sm:block"
            >
              Всі товари →
            </button>
          </div>
          <HorizontalScroll items={newArrivals} onOpen={setModalProduct} />
        </div>
      </section>

      {/* ── Main Catalog ── */}
      <section id="catalog" className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Каталог товарів</h2>
            <p className="text-gray-500">Оберіть категорію та натисніть на товар для деталей</p>
          </div>

          {/* ── Search bar ── */}
          <div className="relative mb-5 max-w-xl mx-auto">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за назвою, категорією…"
              className="w-full pl-9 pr-10 py-3 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm"
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

          {/* ── Category tabs (scrollable on mobile, scrollIntoView for active) ── */}
          <div className="flex gap-2 justify-center mb-4 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                ref={(el) => { categoryTabRefs.current[cat] = el; }}
                onClick={() => setActive(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  active === cat
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Toolbar: Sort + Filter toggle ── */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:border-orange-300 transition-colors shadow-sm"
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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-orange-50 hover:text-orange-600 ${
                          sortKey === opt.value ? "font-bold text-orange-500 bg-orange-50" : "text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-sm font-semibold transition-colors shadow-sm ${
                  showFilters
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-orange-300"
                }`}
              >
                <SlidersHorizontal size={14} />
                Фільтри
                {(minPrice || maxPrice || onlyInStock) && (
                  <span className="bg-amber-400 text-gray-900 text-xs font-black rounded-full w-4 h-4 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Results count + clear */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {sorted.length} товар{sorted.length === 1 ? "" : sorted.length >= 5 ? "ів" : "и"}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-semibold transition-colors"
                >
                  <X size={12} />
                  Скинути
                </button>
              )}
            </div>
          </div>

          {/* ── Advanced Filters Panel ── */}
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
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-orange-500 w-4 h-4 rounded"
                />
                Тільки в наявності
              </label>
            </div>
          )}

          {/* ── Grid + Load more ── */}
          {sorted.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-lg text-gray-500">Нічого не знайдено</p>
              <p className="text-sm mt-1">Спробуйте змінити фільтри або пошуковий запит</p>
              <button onClick={clearFilters} className="mt-4 text-orange-500 font-semibold text-sm hover:underline">
                Скинути фільтри
              </button>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visibleSorted.map((product) => {
                const discount = product.oldPrice
                  ? Math.round((1 - product.price / product.oldPrice) * 100)
                  : null;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer relative"
                    onClick={() => setModalProduct(product)}
                  >
                    {/* Wishlist */}
                    <WishlistButton product={product} />

                    {/* Image with skeleton */}
                    <div className="relative h-44 overflow-hidden bg-gray-100">
                      <div className="absolute inset-0 bg-gray-100 animate-pulse [.img-loaded_&]:opacity-0 [.img-loaded_&]:pointer-events-none transition-opacity duration-300" aria-hidden />
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onLoad={(e) => (e.currentTarget.closest(".relative") as HTMLElement)?.classList?.add("img-loaded")}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          Детальніше
                        </span>
                      </div>
                      {product.badge && (
                        <span className={`absolute top-2 left-2 ${product.badgeColor} text-white text-xs font-black px-2 py-0.5 rounded-full`}>
                          {product.badge}
                        </span>
                      )}
                      {discount && (
                        <span className="absolute bottom-2 left-2 bg-amber-400 text-gray-900 text-xs font-black px-2 py-0.5 rounded-full">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <div className="text-xs text-gray-400 mb-0.5">{product.category}</div>
                      <div className="text-sm font-bold text-gray-900 leading-tight mb-1.5 line-clamp-2">
                        <Highlight text={product.name} query={searchQuery} />
                      </div>
                      <StarRow rating={product.rating} count={product.reviews} />

                      {product.stock <= 5 && (
                        <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold mt-1.5">
                          <Flame size={10} />
                          Залишилось {product.stock} шт.
                        </div>
                      )}

                      {product.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.sizes.map((s) => (
                            <span key={s} className="text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 text-gray-500">{s}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-baseline gap-2 mt-2 mb-3">
                        <span className="text-orange-500 font-black text-base">{product.price} грн</span>
                        {product.oldPrice && (
                          <span className="text-gray-400 text-xs line-through">{product.oldPrice} грн</span>
                        )}
                      </div>

                      <div className="flex gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleBuyNow(product, product.sizes[0] ?? undefined)}
                          className="flex items-center justify-center gap-1 flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-200"
                        >
                          <CreditCard size={13} />
                          Купити
                        </button>
                        <button
                          onClick={() => handleAddToCart(product, product.sizes[0] ?? undefined)}
                          className={`flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                            addedIds.has(`${product.id}-${product.sizes[0] ?? ""}`)
                              ? "bg-green-500 text-white scale-110"
                              : "bg-gray-100 hover:bg-gray-900 text-gray-500 hover:text-white"
                          }`}
                          title="До кошика"
                          aria-label="Додати до кошика"
                        >
                          <ShoppingCart size={14} className={addedIds.has(`${product.id}-${product.sizes[0] ?? ""}`) ? "animate-bounce" : ""} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-center text-sm text-gray-500">
              Показано {visibleSorted.length} з {sorted.length} товарів
            </p>
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
                  className="px-6 py-3 rounded-2xl border-2 border-orange-500 text-orange-500 font-bold text-sm hover:bg-orange-50 transition-colors"
                >
                  Завантажити ще
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
