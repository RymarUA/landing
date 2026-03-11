// @ts-nocheck
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowLeft, PackageOpen } from "lucide-react";
import { useWishlist } from "@/components/wishlist-context";
import { useCart } from "@/components/cart-context";
import type { CatalogProduct } from "@/lib/instagram-catalog";

interface Props {
  allProducts: CatalogProduct[];
}

export function WishlistPageClient({ allProducts }: Props) {
  const { ids, toggle, hydrated } = useWishlist();
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const items = useMemo(() => allProducts.filter((p) => ids.has(p.id)), [allProducts, ids]);

  useEffect(() => {
    const timers = timeoutsRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const getSize = (product: CatalogProduct) =>
    selectedSizes[product.id] ?? product.sizes[0] ?? "";

  const handleAddToCart = (product: CatalogProduct) => {
    const size = product.sizes.length > 0 ? getSize(product) : undefined;
    const key = `${product.id}-${size ?? ""}`;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: size ?? null,
      oldPrice: product.oldPrice ?? null,
    });
    setAddedIds((prev: Set<string>) => new Set(prev).add(key));
    const timeout = setTimeout(() => {
      setAddedIds((prev: Set<string>) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
      timeoutsRef.current.delete(timeout);
    }, 1200);
    timeoutsRef.current.add(timeout);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Завантаження…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="text-orange-500" size={24} fill="currentColor" />
            <div>
              <h1 className="text-xl font-black text-gray-900">Список бажань</h1>
              <p className="text-sm text-gray-400">{items.length} товар{items.length === 1 ? "" : items.length >= 5 ? "ів" : "и"}</p>
            </div>
          </div>
          <Link
            href="/#catalog"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft size={16} />
            До каталогу
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center">
              <PackageOpen size={36} className="text-orange-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Список бажань порожній</h2>
              <p className="text-gray-400 text-sm max-w-xs">
                Натисніть ❤️ на картці товару, щоб зберегти його тут.
              </p>
            </div>
            <Link
              href="/#catalog"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
            >
              Переглянути каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((product) => {
              const discount = product.oldPrice
                ? Math.round((1 - product.price / product.oldPrice) * 100)
                : null;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group relative"
                >
                  {/* Remove from wishlist */}
                  <button
                    onClick={() => toggle(product.id)}
                    title="Видалити зі списку бажань"
                    aria-label="Видалити зі списку бажань"
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-orange-50 transition-colors"
                  >
                    <Trash2 size={14} className="text-orange-400" />
                  </button>

                  {/* Image */}
                  <Link href={`/product/${product.id}`}>
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
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
                  </Link>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{product.category}</p>
                    <Link href={`/product/${product.id}`}>
                      <p className="text-sm font-bold text-gray-900 leading-tight mb-1.5 line-clamp-2 hover:text-orange-500 transition-colors">
                        {product.name}
                      </p>
                    </Link>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-orange-500 font-semibold">{product.price.toLocaleString("uk-UA")} грн</span>
                      {product.oldPrice && (
                        <span className="text-gray-400 text-xs line-through">{product.oldPrice} грн</span>
                      )}
                    </div>

                    {product.sizes.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Розмір</p>
                        <div className="flex flex-wrap gap-1.5">
                          {product.sizes.map((s: string) => (
                            <button
                              key={s}
                              onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: s }))}
                              className={`w-8 h-8 rounded-lg text-xs font-bold border-2 transition-all ${
                                getSize(product) === s
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

                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-all duration-200 ${
                        addedIds.has(`${product.id}-${getSize(product)}`)
                          ? "bg-green-500 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                    >
                      <ShoppingCart size={13} className={addedIds.has(`${product.id}-${getSize(product)}`) ? "animate-bounce" : ""} />
                      {addedIds.has(`${product.id}-${getSize(product)}`) ? "Додано!" : "До кошика"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

