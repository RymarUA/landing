"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
import type { CatalogProduct as Product } from "@/lib/instagram-catalog";

export type { Product };

const ALL_CATEGORIES = ["Всі", "Для чоловіків", "Для жінок", "Для дітей", "Іграшки", "Дім", "Авто"];

type SortKey = "default" | "price_asc" | "price_desc" | "rating" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "За замовчуванням" },
  { value: "newest", label: "Спочатку нові" },
  { value: "price_asc", label: "Від дешевих" },
  { value: "price_desc", label: "Від дорогих" },
  { value: "rating", label: "За рейтингом" },
];

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
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all duration-200 z-10 ${
        isWished
          ? "bg-rose-500 text-white"
          : "bg-white/80 backdrop-blur-sm text-gray-400 hover:text-rose-400"
      }`}
    >
      <Heart size={14} className={isWished ? "fill-white" : ""} />
    </button>
  );
}

/* ─── Product Modal ───────────────────────────────── */
function ProductModal({
  product,
  onClose,
  onAddToCart,
  searchQuery,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  searchQuery?: string;
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
        >
          <X size={18} className="text-gray-600" />
        </button>

        <div className="flex flex-col sm:flex-row overflow-y-auto">
          {/* ── Image ── */}
          <div className="relative sm:w-80 h-60 sm:h-auto flex-shrink-0">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
              priority
            />
            {product.badge && (
              <span className={`absolute top-3 left-3 ${product.badgeColor} text-white text-xs font-black px-2.5 py-1 rounded-full`}>
                {product.badge}
              </span>
            )}
            {discount && (
              <span className="absolute top-3 right-3 bg-amber-400 text-gray-900 text-xs font-black px-2.5 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* ── Info ── */}
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-1">{product.category}</p>
              <h2 className="text-xl font-black text-gray-900 leading-snug">
                <Highlight text={product.name} query={searchQuery ?? ""} />
              </h2>
            </div>

            <StarRow rating={product.rating} count={product.reviews} />

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900">{product.price.toLocaleString("uk-UA")} грн</span>
              {product.oldPrice && (
                <span className="text-lg text-gray-400 line-through">{product.oldPrice} грн</span>
              )}
            </div>

            {product.stock <= 5 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold bg-amber-50 px-3 py-2 rounded-xl">
                <Flame size={14} />
                Залишилось лише {product.stock} шт.!
              </div>
            )}

            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>

            {product.sizes.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Розмір</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${
                        selectedSize === s
                          ? "border-rose-500 bg-rose-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-rose-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-auto pt-2">
              <button
                onClick={() => { onAddToCart(product); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                <ShoppingCart size={16} />
                До кошика
              </button>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                Оформити
              </Link>
            </div>

            {/* Link to product page */}
            <Link
              href={`/product/${product.id}`}
              onClick={onClose}
              className="text-center text-xs text-gray-400 hover:text-rose-500 transition-colors"
            >
              Відкрити сторінку товару →
            </Link>
          </div>
        </div>
      </div>
    </div>
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
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white shadow-lg rounded-full items-center justify-center hover:bg-rose-50 transition-colors hidden sm:flex"
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
                  <span className="bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
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
                <span className="text-rose-500 font-black text-base">{product.price} грн</span>
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
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white shadow-lg rounded-full items-center justify-center hover:bg-rose-50 transition-colors hidden sm:flex"
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

export function ShopCatalog({ products }: ShopCatalogProps) {
  const [active, setActive] = useState("Всі");
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCart();

  /* Read ?search= from URL hash on mount */
  useEffect(() => {
    const tryReadSearch = () => {
      const hash = window.location.hash;
      const match = hash.match(/search=([^&]*)/);
      if (match) {
        setSearchQuery(decodeURIComponent(match[1]));
        searchInputRef.current?.focus();
      }
    };
    tryReadSearch();
    window.addEventListener("hashchange", tryReadSearch);
    return () => window.removeEventListener("hashchange", tryReadSearch);
  }, []);

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

  const handleAddToCart = useCallback((product: Product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
    }, 1200);
  }, [addItem]);

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

      {/* ── New Arrivals ── */}
      <section id="new-arrivals" className="bg-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-rose-500" />
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Щойно додано</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Нові надходження та хіти</h2>
            </div>
            <button
              onClick={() => setActive("Всі")}
              className="text-sm text-rose-500 font-semibold hover:underline hidden sm:block"
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
              className="w-full pl-9 pr-10 py-3 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white shadow-sm"
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

          {/* ── Category tabs ── */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  active === cat
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:text-rose-500"
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
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:border-rose-300 transition-colors shadow-sm"
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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-rose-50 hover:text-rose-600 ${
                          sortKey === opt.value ? "font-bold text-rose-500 bg-rose-50" : "text-gray-700"
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
                    ? "bg-rose-500 border-rose-500 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-rose-300"
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
                  className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold transition-colors"
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
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
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
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-rose-500 w-4 h-4 rounded"
                />
                Тільки в наявності
              </label>
            </div>
          )}

          {/* ── Grid ── */}
          {sorted.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold text-lg text-gray-500">Нічого не знайдено</p>
              <p className="text-sm mt-1">Спробуйте змінити фільтри або пошуковий запит</p>
              <button onClick={clearFilters} className="mt-4 text-rose-500 font-semibold text-sm hover:underline">
                Скинути фільтри
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sorted.map((product) => {
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

                    {/* Image */}
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
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
                        <span className="text-rose-500 font-black text-base">{product.price} грн</span>
                        {product.oldPrice && (
                          <span className="text-gray-400 text-xs line-through">{product.oldPrice} грн</span>
                        )}
                      </div>

                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { handleAddToCart(product); setModalProduct(product); }}
                          className="flex items-center justify-center gap-1 flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-200"
                        >
                          <CreditCard size={13} />
                          Купити
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className={`flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                            addedIds.has(product.id)
                              ? "bg-green-500 text-white scale-110"
                              : "bg-gray-100 hover:bg-gray-900 text-gray-500 hover:text-white"
                          }`}
                          title="До кошика"
                        >
                          <ShoppingCart size={14} className={addedIds.has(product.id) ? "animate-bounce" : ""} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
