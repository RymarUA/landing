import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, ChevronLeft, Flame, Sparkles } from "lucide-react";
import {
  getCatalogProducts,
  getCatalogProductById,
} from "@/lib/instagram-catalog";
import { AddToCartButton } from "./add-to-cart-button";
import { siteConfig } from "@/lib/site-config";

/* ─────────────────────────────────────────────────────────────────────────
   Static params — pre-render all product pages at build time
   ───────────────────────────────────────────────────────────────────────── */
export async function generateStaticParams() {
  const products = await getCatalogProducts();
  return products.map((p) => ({ id: String(p.id) }));
}

/* ─────────────────────────────────────────────────────────────────────────
   Dynamic metadata per product (SEO)
   ───────────────────────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getCatalogProductById(Number(id));

  if (!product) {
    return { title: "Товар не знайдено" };
  }

  const title = `${product.name} — купити в ${siteConfig.name}`;
  const description = `${product.description} Ціна: ${product.price.toLocaleString("uk-UA")} грн.${
    product.oldPrice ? ` Стара ціна: ${product.oldPrice} грн.` : ""
  } Доставка Новою Поштою по всій Україні.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: product.image, width: 800, height: 600, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
    alternates: {
      canonical: `/product/${product.id}`,
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   Product Page (Server Component)
   ───────────────────────────────────────────────────────────────────────── */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getCatalogProductById(Number(id));
  if (!product) notFound();

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  // Related products: same category, excluding current
  const allProducts = await getCatalogProducts();
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-rose-500 transition-colors">Головна</Link>
          <span>/</span>
          <Link href="/#catalog" className="hover:text-rose-500 transition-colors">Каталог</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
        >
          <ChevronLeft size={16} />
          Назад до каталогу
        </Link>

        {/* ── Main Product Card ── */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">

            {/* Image */}
            <div className="relative h-80 md:h-auto min-h-[360px]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.badge && (
                  <span className={`${product.badgeColor} text-white text-sm font-black px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                    {product.isHit && <Flame size={12} />}
                    {product.isNew && <Sparkles size={12} />}
                    {product.badge}
                  </span>
                )}
                {discount && (
                  <span className="bg-amber-400 text-gray-900 text-sm font-black px-3 py-1.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>
              {product.stock <= 5 && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-700 text-sm font-semibold flex items-center gap-2">
                    <Flame size={14} />
                    Залишилось лише {product.stock} шт.!
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-8 flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">{product.category}</p>
                <h1 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">{product.rating}</span>
                <span className="text-sm text-gray-400">({product.reviews} відгуків)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-gray-900">{product.price.toLocaleString("uk-UA")} грн</span>
                {product.oldPrice && (
                  <span className="text-xl text-gray-400 line-through">{product.oldPrice.toLocaleString("uk-UA")} грн</span>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>

              {/* Add to cart + Buy now (client component) */}
              <AddToCartButton product={product} />

              {/* IG fallback (only if product originated from Instagram) */}
              {product.instagramPermalink && (
                <a
                  href={product.instagramPermalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-500 font-semibold py-3 rounded-2xl transition-all text-sm"
                >
                  Переглянути пост в Instagram
                </a>
              )}

              {/* Delivery info */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
                📦 Доставка Новою Поштою по всій Україні. Відео розпакування кожної посилки.
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Схожі товари</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/product/${rp.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={rp.image}
                      alt={rp.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{rp.category}</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-1.5">{rp.name}</p>
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < Math.round(rp.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-0.5">({rp.reviews})</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-rose-500 font-black">{rp.price.toLocaleString("uk-UA")} грн</span>
                      {rp.oldPrice && (
                        <span className="text-gray-400 text-xs line-through">{rp.oldPrice} грн</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
