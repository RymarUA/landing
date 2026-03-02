"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { useCart } from "@/components/cart-context";
import type { Product } from "@/lib/products";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? "");
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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

      {/* CTA buttons */}
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
              Додано до кошика!
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
          className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-colors shadow-md shadow-rose-200 text-base"
        >
          Купити зараз
        </Link>
      </div>
    </div>
  );
}
