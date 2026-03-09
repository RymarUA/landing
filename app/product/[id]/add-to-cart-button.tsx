"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle, CreditCard, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { useWishlist } from "@/components/wishlist-context";
import {
  trackAddToCart,
  trackViewContent,
  trackAddToWishlist,
  trackInitiateCheckout,
} from "@/components/analytics";
import type { CatalogProduct } from "@/lib/instagram-catalog";

// ─── Shared size selector + CTA buttons ────────────────────────────────────────
// Props allow the parent (ProductPage) to lift selectedSize state so that both
// the inline form and the mobile sticky bar share the same value.

interface AddToCartButtonProps {
  product: CatalogProduct;
  /** Controlled selected size — pass from parent so sticky bar stays in sync */
  selectedSize?: string;
  /** Called when user picks a size */
  onSizeChange?: (size: string) => void;
  /** When true, hides the size selector (sticky bar uses inline layout) */
  hideSizeSelector?: boolean;
  /** When true, show only one primary "Купити" button (for mobile sticky bar, Rozetka-style) */
  stickyCtaOnly?: boolean;
  /** When false, hides the quantity selection block (default: true) */
  showQuantity?: boolean;
}

const MIN_QTY = 1;
const MAX_QTY = 10;

export function AddToCartButton({
  product,
  selectedSize: controlledSize,
  onSizeChange,
  hideSizeSelector = false,
  stickyCtaOnly = false,
  showQuantity = true,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem, totalCount, totalPrice } = useCart();
  const { has, toggle, hydrated } = useWishlist();

  // Support lifted state while providing a stable default
  const defaultSize = product.sizes[0] ?? "";
  const [internalSize, setInternalSize] = useState<string>(defaultSize);
  const selectedSize = controlledSize ?? internalSize;
  const [quantity, setQuantity] = useState(1);

  const handleSizeChange = (s: string) => {
    if (onSizeChange) {
      onSizeChange(s);
    } else {
      setInternalSize(s);
    }
  };

  const [added, setAdded] = useState(false);
  const isWished = hydrated ? has(product.id) : false;

  const isOutOfStock = product.stock <= 0;
  const requiresSize = product.sizes.length > 0;
  const canAdd = !requiresSize || !!selectedSize;

  // ── Analytics: fire once per product mount ──────────────────────────────────
  useEffect(() => {
    trackViewContent({
      contentId: product.id,
      contentName: product.name,
      contentCategory: product.category,
      value: product.price,
      currency: "UAH",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const addQty = showQuantity ? quantity : 1;

  const handleAdd = () => {
    if (!canAdd || isOutOfStock) return;

    for (let i = 0; i < addQty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: selectedSize || null,
        oldPrice: product.oldPrice ?? null,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);

    trackAddToCart({
      contentId: product.id,
      contentName: product.name,
      value: product.price * addQty,
    });
  };

  const handleWishlist = () => {
    // Capture current state BEFORE toggling so analytics fires correctly
    const wasWished = has(product.id);
    toggle(product.id);

    if (!wasWished) {
      trackAddToWishlist({
        contentId: product.id,
        contentName: product.name,
        value: product.price,
      });
    }
  };

  const handleCheckout = () => {
    if (!canAdd || isOutOfStock) return;

    for (let i = 0; i < addQty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: selectedSize || null,
        oldPrice: product.oldPrice ?? null,
      });
    }

    trackInitiateCheckout({
      value: totalPrice + product.price * addQty,
      numItems: totalCount + addQty,
    });

    router.push("/checkout");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Size selector — hidden in sticky bar to avoid duplication */}
      {!hideSizeSelector && product.sizes.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Розмір
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => handleSizeChange(s)}
                className={`w-11 h-11 rounded-xl text-sm font-bold border-2 transition-all ${
                  selectedSize === s
                    ? "border-orange-500 bg-orange-500 text-white shadow-md"
                    : "border-gray-200 text-gray-600 hover:border-orange-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity selector — hidden when showQuantity is false */}
      {showQuantity && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Кількість
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(MIN_QTY, q - 1))}
              disabled={quantity <= MIN_QTY}
              className="w-11 h-11 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Зменшити кількість"
            >
              −
            </button>
            <span className="w-10 text-center font-black text-gray-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
              disabled={quantity >= MAX_QTY}
              className="w-11 h-11 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Збільшити кількість"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className={`flex gap-3 ${stickyCtaOnly ? "flex-col" : ""}`}>
        {!stickyCtaOnly && (
          <button
            onClick={handleAdd}
            disabled={!canAdd || isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all duration-200 text-base ${
              !canAdd || isOutOfStock
                ? "bg-orange-300 cursor-not-allowed"
                : added
                ? "bg-green-500 text-white shadow-green-200"
                : "bg-orange-500 hover:bg-orange-600 hover:-translate-y-0.5 shadow-md shadow-orange-200"
            } text-white`}
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
        )}

        <button
          onClick={stickyCtaOnly ? handleAdd : handleCheckout}
          disabled={!canAdd || isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-all duration-200 shadow-md shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5 text-base ${
            !canAdd || isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
          } ${stickyCtaOnly ? "py-3.5" : ""} ${added && stickyCtaOnly ? "bg-green-500" : ""}`}
        >
          {stickyCtaOnly ? (
            added ? (
              <>
                <CheckCircle size={20} />
                Додано!
              </>
            ) : (
              <>
                <ShoppingCart size={20} />
                Купити
              </>
            )
          ) : (
            <>
              <CreditCard size={18} />
              Купити
            </>
          )}
        </button>
      </div>

      {/* Wishlist — not shown in sticky bar to keep it compact */}
      {!hideSizeSelector && (
        <button
          onClick={handleWishlist}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 ${
            isWished
              ? "border-orange-200 bg-orange-50 text-orange-500"
              : "border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-400"
          }`}
          aria-label={isWished ? "Видалити зі списку бажань" : "Додати до бажань"}
        >
          <Heart
            size={16}
            className={isWished ? "fill-orange-500 text-orange-500" : ""}
          />
          {isWished ? "У списку бажань" : "Додати до бажань"}
        </button>
      )}
    </div>
  );
}
