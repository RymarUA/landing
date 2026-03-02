"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, CheckCircle, CreditCard, Heart } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useWishlist } from "@/components/wishlist-context";
import { trackAddToCart, trackViewContent, trackAddToWishlist, trackInitiateCheckout } from "@/components/analytics";
import type { CatalogProduct } from "@/lib/instagram-catalog";

export function AddToCartButton({ product }: { product: CatalogProduct }) {
  const { addItem, totalCount, totalPrice } = useCart();
  const { has, toggle, hydrated } = useWishlist();
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? "");
  const [added, setAdded] = useState(false);
  const isWished = hydrated && has(product.id);

  /* 👁️ ViewContent — fire once when component mounts (= product page view) */
  useEffect(() => {
    trackViewContent({
      contentId: product.id,
      contentName: product.name,
      contentCategory: product.category,
      value: product.price,
      currency: "UAH",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);

    /* 🛒 AddToCart */
    trackAddToCart({
      contentId: product.id,
      contentName: product.name,
      value: product.price,
    });
  };

  const handleWishlist = () => {
    toggle(product.id);
    if (!has(product.id)) {
      /* ❤️ AddToWishlist (only when adding, not removing) */
      trackAddToWishlist({
        contentId: product.id,
        contentName: product.name,
        value: product.price,
      });
    }
  };

  const handleCheckout = () => {
    /* 📋 InitiateCheckout — before going to checkout */
    trackInitiateCheckout({
      value: totalPrice + product.price,
      numItems: totalCount + 1,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Size selector */}
      {product.sizes.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Розмір</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`w-11 h-11 rounded-xl text-sm font-bold border-2 transition-all ${
                  selectedSize === s
                    ? "border-rose-500 bg-rose-500 text-white shadow-md"
                    : "border-gray-200 text-gray-600 hover:border-rose-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA buttons row */}
      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className={`flex-1 flex items-center justify-center gap-2.5 font-black py-4 rounded-2xl transition-all duration-300 shadow-md text-base ${
            added
              ? "bg-green-500 text-white shadow-green-200"
              : "bg-gray-900 hover:bg-gray-800 text-white shadow-gray-200"
          }`}
        >
          {added ? (
            <>
              <CheckCircle size={20} />
              Додано!
            </>
          ) : (
            <>
              <ShoppingCart size={20} />
              До кошика
            </>
          )}
        </button>

        <Link
          href="/checkout"
          onClick={handleCheckout}
          className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all duration-200 shadow-md shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5 text-base"
        >
          <CreditCard size={18} />
          Купити
        </Link>
      </div>

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 ${
          isWished
            ? "border-rose-200 bg-rose-50 text-rose-500"
            : "border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-400"
        }`}
      >
        <Heart size={16} className={isWished ? "fill-rose-500 text-rose-500" : ""} />
        {isWished ? "У списку бажань" : "Додати до бажань"}
      </button>
    </div>
  );
}
