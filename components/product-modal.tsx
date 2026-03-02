"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Star, ShoppingCart, Flame, Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist-context";
import type { CatalogProduct as Product } from "@/lib/instagram-catalog";

const SWIPE_CLOSE_THRESHOLD = 80;

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

export interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, size?: string | null) => void;
  searchQuery?: string;
}

export function ProductModal({ product, onClose, onAddToCart, searchQuery }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0] ?? null);
  const { has, toggle, hydrated } = useWishlist();
  const isWished = hydrated && has(product.id);
  const touchStartY = useRef<number>(0);
  const swipeClosedRef = useRef(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    swipeClosedRef.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeClosedRef.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > SWIPE_CLOSE_THRESHOLD) {
      swipeClosedRef.current = true;
      onClose();
    }
  };

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize ?? undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col touch-none sm:touch-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Закрити"
        >
          <X size={18} className="text-gray-600" />
        </button>

        <div className="flex flex-col sm:flex-row overflow-y-auto">
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

          <div className="flex-1 p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">{product.category}</p>
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
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
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
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                <ShoppingCart size={16} />
                До кошика
              </button>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                Оформити
              </Link>
            </div>

            <button
              type="button"
              onClick={(e) => { e.preventDefault(); toggle(product.id); }}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 font-semibold text-sm transition-all ${
                isWished
                  ? "border-orange-200 bg-orange-50 text-orange-500"
                  : "border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-400"
              }`}
              aria-label={isWished ? "Видалити зі списку бажань" : "Додати до бажань"}
            >
              <Heart size={16} className={isWished ? "fill-orange-500 text-orange-500" : ""} />
              {isWished ? "У списку бажань" : "Додати до бажань"}
            </button>

            <Link
              href={`/product/${product.id}`}
              onClick={onClose}
              className="text-center text-xs text-gray-400 hover:text-orange-500 transition-colors"
            >
              Відкрити сторінку товару →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
