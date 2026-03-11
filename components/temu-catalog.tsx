"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Star,
  Heart,
  Flame,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useWishlist } from "@/components/wishlist-context";
import { ProductModal } from "@/components/product-modal";
import { TemuCategorySlider } from "./temu-category-slider";
import type { CatalogProduct as Product } from "@/lib/instagram-catalog";
import { blurProps } from "@/lib/utils";

export type { Product };

interface TemuCatalogProps {
  products: Product[];
}

const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 20;

// Sort options
const SORT_OPTIONS = [
  { value: "default" as const, label: "За замовчуванням" },
  { value: "price-asc" as const, label: "Ціна: від низької" },
  { value: "price-desc" as const, label: "Ціна: від високої" },
  { value: "rating" as const, label: "За рейтингом" },
  { value: "reviews" as const, label: "За відгуками" },
];

type SortKey = typeof SORT_OPTIONS[number]["value"];

/* ─── Free Shipping Banner Component ─────────────── */
function FreeShippingBanner({ onFilterFreeShipping }: { onFilterFreeShipping: () => void }) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 mx-2 cursor-pointer hover:shadow-lg transition-all"
         onClick={onFilterFreeShipping}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
          <Truck size={32} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-xl mb-1">Безкоштовна доставка</h3>
          <p className="text-white/90 text-sm">Обрати товари з безкоштовною доставкою</p>
        </div>
        <ChevronRight size={24} className="text-white flex-shrink-0" />
      </div>
    </div>
  );
}

/* ─── Horizontal New Arrivals / Hits / Free Shipping Scroll ─────────────── */
function HorizontalScroll({
  items,
  title,
  onOpen,
  onAddToCart,
}: {
  items: Product[];
  title: string;
  onOpen: (p: Product) => void;
  onAddToCart: (p: Product) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { has, toggle } = useWishlist();

  const scroll = (dir: "left" | "right") =>
    ref.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-2">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {title === "Нові надходження" ? (
            <Sparkles size={18} className="text-green-500" />
          ) : title === "Безкоштовна доставка" ? (
            <Truck size={18} className="text-green-500" />
          ) : (
            <Flame size={18} className="text-orange-500" />
          )}
          {title}
        </h2>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center hover:bg-orange-50 transition-colors hidden sm:flex"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>

        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((product) => {
            const isWished = has(product.id);
            const discount = product.oldPrice
              ? Math.round((1 - product.price / product.oldPrice) * 100)
              : null;

            return (
              <div
                key={product.id}
                onClick={() => onOpen(product)}
                className="flex-shrink-0 w-44 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer snap-start relative group"
              >
                {/* Wishlist */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(product.id);
                  }}
                  className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all ${
                    isWished ? "bg-red-500 text-white" : "bg-white/80 backdrop-blur-sm text-gray-400"
                  }`}
                >
                  <Heart size={11} className={isWished ? "fill-white" : ""} />
                </button>

                {/* Image */}
                <div className="relative h-44 overflow-hidden rounded-t-lg bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="176px"
                    className="object-cover"
                    {...blurProps()}
                  />
                  {discount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                      -{discount}%
                    </div>
                  )}
                  {product.badge && (
                    <div className={`absolute bottom-2 left-2 ${product.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
                      {product.badge}
                    </div>
                  )}
                  {/* Free Shipping Badge */}
                  {(product as any).freeShipping && (
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <Truck size={10} />
                      Безкошт. дост.
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-2">
                  <div className="text-sm text-gray-800 line-clamp-2 leading-tight mb-1 min-h-[2.5rem]">
                    {product.name}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={9}
                        className={i < Math.round(product.rating) ? "fill-orange-400 text-orange-400" : "fill-gray-200 text-gray-200"}
                      />
                    ))}
                    <span className="text-xs text-gray-500">{product.reviews}</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-red-500 font-semibold text-base">₴{product.price}</span>
                    {product.oldPrice && (
                      <span className="text-gray-400 text-xs line-through">₴{product.oldPrice}</span>
                    )}
                  </div>

                  {/* Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-1.5 rounded transition-colors"
                  >
                    До кошика
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center hover:bg-orange-50 transition-colors hidden sm:flex"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}

/* ─── Product Card Component ─────────────────────────── */
function TemuProductCard({
  product,
  onAddToCart,
  onClick,
  searchQuery = "",
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onClick: (p: Product) => void;
  searchQuery?: string;
}) {
  const { has, toggle } = useWishlist();
  const isWished = has(product.id);
  const [imageLoaded, setImageLoaded] = useState(false);

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  const hasFreeShipping = (product as any).freeShipping === true;

  // Highlight search query in text
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      onClick={() => onClick(product)}
      className="bg-white rounded-lg overflow-hidden cursor-pointer relative group"
    >
      {/* Wishlist Heart */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle(product.id);
        }}
        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all ${
          isWished
            ? "bg-red-500 text-white"
            : "bg-white/80 backdrop-blur-sm text-gray-400"
        }`}
      >
        <Heart size={12} className={isWished ? "fill-white" : ""} />
      </button>

      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className={`object-cover transition-all duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          {...blurProps()}
        />

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <div
            className={`absolute bottom-2 left-2 ${product.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded`}
          >
            {product.badge}
          </div>
        )}

        {/* Free Shipping Badge - ГЛАВНОЕ! */}
        {hasFreeShipping && (
          <div className="absolute top-2 right-9 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md">
            <Truck size={10} />
            Безкошт. дост.
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        {/* Free Shipping Banner in Content */}
        {hasFreeShipping && (
          <div className="bg-green-50 border border-green-200 rounded px-2 py-1 mb-1 flex items-center gap-1">
            <Truck size={12} className="text-green-600" />
            <span className="text-green-700 text-xs font-semibold">Безкоштовна доставка</span>
          </div>
        )}

        {/* Name */}
        <div className="text-sm text-gray-800 line-clamp-2 leading-tight mb-1 min-h-[2.5rem]">
          {highlightText(product.name)}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={10}
                className={
                  i < Math.round(product.rating)
                    ? "fill-orange-400 text-orange-400"
                    : "fill-gray-200 text-gray-200"
                }
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {product.reviews > 1000
              ? `${(product.reviews / 1000).toFixed(1)}k`
              : product.reviews}
          </span>
        </div>

        {/* Stock Warning */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="flex items-center gap-1 text-orange-600 text-xs mb-1">
            <Flame size={10} />
            <span>Залишилось {product.stock}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-red-500 font-semibold text-lg">
            ₴{product.price.toLocaleString("uk-UA")}
          </span>
          {product.oldPrice && (
            <span className="text-gray-400 text-xs line-through">
              ₴{product.oldPrice.toLocaleString("uk-UA")}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded transition-colors"
        >
          <ShoppingCart size={14} className="inline mr-1" />
          До кошика
        </button>
      </div>
    </div>
  );
}

/* ─── Main Catalog Component ─────────────────────────── */
export function TemuCatalog({ products }: TemuCatalogProps) {
  const { addItem } = useCart();

  const [activeCategory, setActiveCategory] = useState("Всі");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Filters and sorting
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyFreeShipping, setOnlyFreeShipping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Read search from URL hash
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      const searchMatch = hash.match(/search=([^&]*)/);
      if (searchMatch) {
        setSearchQuery(decodeURIComponent(searchMatch[1]));
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  // Filter products
  let filtered = activeCategory === "Всі"
    ? products
    : products.filter((p) => p.category === activeCategory);

  // Apply search
  if (searchQuery.trim()) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply free shipping filter
  if (onlyFreeShipping) {
    filtered = filtered.filter((p) => (p as any).freeShipping === true);
  }

  // Apply price filters
  if (minPrice) {
    filtered = filtered.filter((p) => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter((p) => p.price <= parseFloat(maxPrice));
  }
  if (onlyInStock) {
    filtered = filtered.filter((p) => p.stock > 0);
  }

  // Sort products
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "reviews":
        return b.reviews - a.reviews;
      default:
        return 0;
    }
  });

  const visibleProducts = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  // Special collections
  const newArrivals = products.filter((p) => p.isNew).slice(0, 10);
  const hits = products.filter((p) => p.isHit && !p.isNew).slice(0, 10);
  const freeShippingProducts = products.filter((p) => (p as any).freeShipping === true).slice(0, 10);

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.sizes[0] ?? undefined,
    });

    const timeout = setTimeout(() => {
      timersRef.current.delete(product.id);
    }, 1500);
    timersRef.current.set(product.id, timeout);
  };
/* ... */


  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [activeCategory]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timersMap = timersRef.current;

    return () => {
      timersMap.forEach((timer) => clearTimeout(timer));
      timersMap.clear();
    };
  }, []);

  const hasActiveFilters = minPrice || maxPrice || onlyInStock || onlyFreeShipping || searchQuery;
  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label;

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setOnlyInStock(false);
    setOnlyFreeShipping(false);
    setSearchQuery("");
    window.location.hash = "";
  };

  // Filter by free shipping
  const handleFilterFreeShipping = () => {
    setOnlyFreeShipping(true);
    setActiveCategory("Всі");
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <>
      <section id="catalog" className="pt-2 pb-20 bg-gray-50">
        {/* Category Slider */}
        <TemuCategorySlider
          onCategoryChange={setActiveCategory}
          initialCategory={activeCategory}
        />

        <div className="max-w-7xl mx-auto px-2 py-3">
          {/* Free Shipping Banner */}
          {freeShippingProducts.length > 0 && activeCategory === "Всі" && !onlyFreeShipping && !searchQuery && (
            <FreeShippingBanner onFilterFreeShipping={handleFilterFreeShipping} />
          )}

          {/* New Arrivals */}
          {newArrivals.length > 0 && activeCategory === "Всі" && !onlyFreeShipping && !searchQuery && (
            <HorizontalScroll
              items={newArrivals}
              title="Нові надходження"
              onOpen={setModalProduct}
              onAddToCart={handleAddToCart}
            />
          )}

          {/* Hits */}
          {hits.length > 0 && activeCategory === "Всі" && !onlyFreeShipping && !searchQuery && (
            <HorizontalScroll
              items={hits}
              title="Хіти продажів"
              onOpen={setModalProduct}
              onAddToCart={handleAddToCart}
            />
          )}

          {/* Free Shipping Products Scroll */}
          {freeShippingProducts.length > 0 && activeCategory === "Всі" && !onlyFreeShipping && !searchQuery && (
            <HorizontalScroll
              items={freeShippingProducts}
              title="Безкоштовна доставка"
              onOpen={setModalProduct}
              onAddToCart={handleAddToCart}
            />
          )}

          {/* Filter & Sort Bar */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2 px-2">
            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 transition-colors"
                >
                  <ArrowUpDown size={14} />
                  <span className="hidden sm:inline">{activeSortLabel}</span>
                  <ChevronDown size={14} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                {sortOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-30 min-w-[180px]">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortKey(opt.value);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-orange-50 ${
                          sortKey === opt.value ? "font-semibold text-orange-500 bg-orange-50" : "text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  showFilters
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-orange-300"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Фільтри</span>
                {(minPrice || maxPrice || onlyInStock || onlyFreeShipping) && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {sorted.length} товарів
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium"
                >
                  <X size={12} />
                  Скинути
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white border border-gray-100 rounded-lg p-3 mb-4 mx-2 flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Від (грн)</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="100"
                  className="w-24 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">До (грн)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="5000"
                  className="w-24 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-orange-500 w-4 h-4"
                />
                Тільки в наявності
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-green-700">
                <input
                  type="checkbox"
                  checked={onlyFreeShipping}
                  onChange={(e) => setOnlyFreeShipping(e.target.checked)}
                  className="accent-green-500 w-4 h-4"
                />
                <Truck size={14} />
                Безкоштовна доставка
              </label>
            </div>
          )}

          {/* Active Filter Badge */}
          {onlyFreeShipping && (
            <div className="mb-4 px-2">
              <div className="inline-flex items-center gap-2 bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Truck size={14} />
                Товари з безкоштовною доставкою
                <button
                  onClick={() => setOnlyFreeShipping(false)}
                  className="ml-1 hover:bg-green-200 rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {sorted.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-2">Товари не знайдені</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-orange-500 font-medium text-sm hover:underline"
                >
                  Скинути фільтри
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {visibleProducts.map((product) => (
                  <TemuProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onClick={setModalProduct}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
                    className="px-8 py-3 bg-white border-2 border-orange-500 text-orange-500 font-medium rounded-full hover:bg-orange-50 transition-colors"
                  >
                    Завантажити ще
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Product Modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToCart={() => handleAddToCart(modalProduct)}
        />
      )}
    </>
  );
}

/* ─── Catalog Skeleton ─────────────────────────── */
export function CatalogSkeleton({ count = 20 }: { count?: number }) {
  return (
    <section className="pt-2 pb-20 bg-gray-50">
      <div className="sticky top-[52px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex overflow-x-auto scrollbar-hide px-3 py-2.5 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 h-9 rounded-full bg-gray-200 animate-pulse"
              style={{ width: `${60 + i * 10}px` }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 py-3">
        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-3 mx-2" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse" />
              <div className="p-2 space-y-2">
                <div className="h-4 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
                <div className="h-5 bg-gray-200 animate-pulse rounded w-2/3" />
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

