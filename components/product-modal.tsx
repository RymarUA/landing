// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ShoppingCart, Flame, Heart, Truck } from "lucide-react";
import { useWishlist } from "@/components/wishlist-context";
import { useCart } from "@/components/cart-context";
import type { CatalogProduct as Product } from "@/lib/instagram-catalog";
import { blurProps } from "@/lib/utils";
import { Highlight } from "@/components/shared/highlight";
import { StarRating } from "@/components/shared/star-rating";
import { siteConfig } from "@/lib/site-config";

export interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, size?: string | null) => void;
  searchQuery?: string;
}

export function ProductModal({ product, onClose, onAddToCart, searchQuery }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0] ?? null);
  const { has, toggle, hydrated } = useWishlist();
  const { addItem } = useCart();
  const router = useRouter();
  const isWished = hydrated && has(product.id);
  const scrollYRef = useRef(0);

  useEffect(() => {
    // Зберігаємо позицію скролу
    scrollYRef.current = window.scrollY;

    // Блокуємо скрол body без зсуву контенту
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflowY = "scroll";

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);

    return () => {
      // Відновлюємо точну позицію
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflowY = "";
      window.scrollTo(0, scrollYRef.current);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize ?? undefined);
    onClose();
  };

  const handleQuickCheckout = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize,
      oldPrice: product.oldPrice ?? null,
    });
    onClose();
    router.push("/checkout");
  };

  const getCategoryColor = (category: string) => {
    const categoryIndex = siteConfig.catalogCategories.indexOf(category);
    const colors = [
      "text-gray-500",
      "text-emerald-600",
      "text-blue-600",
      "text-orange-500",
      "text-purple-600",
      "text-pink-600",
      "text-indigo-600",
      "text-teal-600",
      "text-rose-600",
    ];
    return categoryIndex >= 0 && categoryIndex < colors.length
      ? colors[categoryIndex]
      : "text-orange-500";
  };

  return (
    /*
     * КЛЮЧОВЕ ВИПРАВЛЕННЯ:
     * fixed inset-0 + flex items-center justify-center
     * = завжди по центру VIEWPORT, незалежно від позиції скролу.
     * body заблокований через position:fixed (не overflow:hidden),
     * тому layout не зсувається і модалка не стрибає вниз.
     */
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Картка модалки — завжди по центру екрану */}
      <div
        className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* Кнопка закрити */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Закрити"
        >
          <X size={18} className="text-gray-600" />
        </button>

        {/* Контент — скролиться всередині */}
        <div className="flex flex-col sm:flex-row overflow-y-auto" style={{ maxHeight: "90vh" }}>
          {/* Зображення */}
          <div className="relative sm:w-80 h-60 sm:h-auto flex-shrink-0" style={{ minHeight: "220px" }}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
              priority
              {...blurProps()}
            />
            {product.badge && (
              <span className={`absolute top-3 left-3 z-10 ${product.badgeColor} text-white text-xs font-black px-2.5 py-1 rounded-full`}>
                {product.badge}
              </span>
            )}
            {discount && (
              <span className="absolute top-3 right-3 z-10 bg-rose-100 text-rose-600 text-xs font-black px-2.5 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Інфо */}
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div>
              <p className={`text-xs font-semibold ${getCategoryColor(product.category)} uppercase tracking-widest mb-1`}>{product.category}</p>
              <h2 className="text-xl font-black text-gray-900 leading-snug">
                <Highlight text={product.name} query={searchQuery ?? ""} />
              </h2>
            </div>

            <StarRating rating={product.rating} count={product.reviews} />

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#FF4444]">{product.price.toLocaleString("uk-UA")} грн</span>
              {product.oldPrice && (
                <span className="text-lg text-gray-400 line-through">{product.oldPrice} грн</span>
              )}
            </div>

            {product.freeShipping && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold bg-emerald-50 px-3 py-2 rounded-xl">
                <Truck size={16} className="shrink-0" aria-hidden />
                Безкоштовна доставка
              </div>
            )}

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
              <button
                onClick={handleQuickCheckout}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                Оформити
              </button>
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

