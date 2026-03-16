// @ts-nocheck
import type { Metadata } from "next/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Star, ChevronLeft, Flame, Sparkles, Shield, Truck, CreditCard, Package } from "lucide-react";
import {
  getCatalogProducts,
  getCatalogProductById,
} from "@/lib/instagram-catalog";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductImageLightbox } from "./product-image-lightbox";
import { ShareButton } from "./share-button";
import { RecentlyViewedBlock } from "./recently-viewed-block";
import { ShopFooter } from "@/components/shop-footer";
import { siteConfig } from "@/lib/site-config";
import {
  JsonLd,
  generateProductSchema,
  generateBreadcrumbSchema,
} from "@/components/seo/JsonLd";
import { blurProps } from "@/lib/utils";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProductFeedSkeleton } from "@/components/product-feed-skeleton";

const InfiniteProductFeed = dynamic(
  () => import("./infinite-product-feed").then(m => ({ default: m.InfiniteProductFeed })),
  { loading: () => <ProductFeedSkeleton /> }
);

// export async function generateStaticParams() {
//   const products = await getCatalogProducts();
//   return products.map((p) => ({ id: String(p.id) }));
// }

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

  const allProducts = await getCatalogProducts();
  const related: typeof allProducts = [];
  for (const p of allProducts) {
    if (p.category === product.category && p.id !== product.id) {
      related.push(p);
      if (related.length === 4) break;
    }
  }

  const productSchema = generateProductSchema({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    image: product.image,
    category: product.category,
    rating: product.rating,
    reviews: product.reviews,
    stock: product.stock,
    badge: product.badge,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Головна", url: siteConfig.url },
    { name: "Каталог", url: `${siteConfig.url}/#catalog` },
    { name: product.name, url: `${siteConfig.url}/product/${product.id}` },
  ]);

  return (
    <div className="min-h-screen bg-[#fdf6f0] flex flex-col">
      <JsonLd id="product-schema" data={productSchema} />
      <JsonLd id="breadcrumb-schema" data={breadcrumbSchema} />

      {/* ── Breadcrumb - ✅ ВИПРАВЛЕННЯ: Збільшений текст з text-xs до text-sm ── */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-stone-500 overflow-x-auto">
          <Link href="/" className="hover:text-orange-500 transition-colors whitespace-nowrap">Головна</Link>
          <span>/</span>
          <Link href="/#catalog" className="hover:text-orange-500 transition-colors whitespace-nowrap">Каталог</Link>
          <span>/</span>
          <span className="text-stone-900 font-medium truncate max-w-[120px] sm:max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10">
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-stone-500 hover:text-stone-700 transition-colors mb-4 sm:mb-6"
        >
          <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
          Назад до каталогу
        </Link>

        {/* ── Main Product Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column: Image Gallery (lg:col-span-6) */}
          <div className="lg:col-span-6">
            <div className="bg-stone-50 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm overflow-hidden max-h-[550px]">
              <ProductImageLightbox src={product.image} alt={product.name} images={product.images}>
                {product.badge && (
                  <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-orange-500 text-white text-xs sm:text-sm font-black px-3 py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-lg ring-2 ring-white/50 z-10">
                    {product.isHit && <Flame size={12} className="sm:w-4 sm:h-4 flex-shrink-0" />}
                    {product.isNew && <Sparkles size={12} className="sm:w-4 sm:h-4 flex-shrink-0" />}
                    <span className="flex-shrink-0">{product.badge}</span>
                  </span>
                )}
                {discount && (
                  <span className="absolute top-12 left-1.5 sm:top-14 sm:left-2 bg-[#FF4444] text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded shadow-lg z-10">
                    -{discount}%
                  </span>
                )}
                {product.stock <= 5 && product.stock > 0 && (
                  <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 lg:bottom-4 lg:left-4 lg:right-4 z-10">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-amber-700 text-[10px] sm:text-xs lg:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                      <Flame size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span>Залишилось {product.stock} шт.</span>
                    </div>
                  </div>
                )}
              </ProductImageLightbox>
            </div>
          </div>

          {/* Right Column: Product Info (lg:col-span-6) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Category Badge */}
                <div className="inline-block">
                  <span className="inline-block bg-orange-100 text-orange-600 text-[10px] sm:text-xs font-bold uppercase tracking-wide px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                    {product.category}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">
                  {product.name}
                </h1>

                {/* Rating - ✅ ВИПРАВЛЕННЯ: Збільшені зірки з 11px до 14px */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const isFull = i < Math.floor(product.rating);
                      const isHalf = i === Math.floor(product.rating) && product.rating % 1 >= 0.3 && product.rating % 1 < 0.8;
                      const starSize = 14;
                      return (
                        <div key={i} className="relative" style={{ width: starSize, height: starSize }}>
                          <Star
                            size={starSize}
                            className={isFull ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                          />
                          {isHalf && (
                            <div className="absolute inset-0 overflow-hidden" style={{ width: `${starSize / 2}px` }}>
                              <Star size={starSize} className="fill-amber-400 text-amber-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900">{product.rating}</span>
                  <span className="text-xs sm:text-sm text-gray-400">({product.reviews} відгук{product.reviews === 1 ? '' : product.reviews >= 2 && product.reviews <= 4 ? 'и' : 'ів'})</span>
                </div>

                {/* Price Block */}
                <div className="mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-stone-100">
                  <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-2">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-500">{product.price.toLocaleString("uk-UA")} грн</span>
                    {product.oldPrice && (
                      <span className="text-base sm:text-lg text-gray-400 line-through">{product.oldPrice.toLocaleString("uk-UA")} грн</span>
                    )}
                  </div>
                  {discount && (
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      <Flame size={12} className="sm:w-[14px] sm:h-[14px]" />
                      <span className="whitespace-nowrap">Знижка {discount}%</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline whitespace-nowrap">Економія {(product.oldPrice! - product.price).toLocaleString("uk-UA")} грн</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm mb-4 sm:mb-5">{product.description}</p>

                {/* Add to Cart Button */}
                <div data-main-cta className="mb-3 sm:mb-4">
                  <AddToCartButton product={product} />
                </div>

                {/* Trust Badges - ✅ ВИПРАВЛЕННЯ: Збільшені іконки та текст */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-3.5">
                    <Shield size={16} className="sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-emerald-700 text-center">Гарантія якості</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-100 rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-3.5">
                    <CreditCard size={16} className="sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-blue-700 text-center">Безпечна оплата</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-purple-50 border border-purple-100 rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-3.5">
                    <Truck size={16} className="sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-purple-700 text-center">Швидка доставка</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-100 rounded-lg sm:rounded-xl px-3 py-3 sm:px-4 sm:py-3.5">
                    <Package size={16} className="sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-amber-700 text-center">Відео розпакування</span>
                  </div>
                </div>

                {/* Share Button */}
                <div className="mb-3 sm:mb-4">
                  <ShareButton title={product.name} path={`/product/${product.id}`} />
                </div>

                {/* Instagram Link */}
                {product.instagramPermalink && (
                  <a
                    href={product.instagramPermalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 font-semibold py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm"
                  >
                    Переглянути в Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <ErrorBoundary label="Нещодавно переглянуті">
            <RecentlyViewedBlock products={allProducts} currentId={product.id} />
          </ErrorBoundary>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-6 sm:mt-8 lg:mt-10">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-stone-900 mb-3 sm:mb-4 lg:mb-6">Схожі товари</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/product/${rp.id}`}
                  className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <Image
                      src={rp.image}
                      alt={rp.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      {...blurProps()}
                    />
                  </div>
                  <div className="p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-stone-500 mb-0.5">{rp.category}</p>
                    <p className="text-xs sm:text-sm font-bold text-stone-900 leading-tight line-clamp-2 mb-1 sm:mb-1.5">{rp.name}</p>
                    <div className="flex items-center gap-0.5 mb-1 sm:mb-1.5">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const isFull = i < Math.floor(rp.rating);
                        const isHalf = i === Math.floor(rp.rating) && rp.rating % 1 >= 0.3 && rp.rating % 1 < 0.8;
                        const starSize = 9;
                        return (
                          <div key={i} className="relative" style={{ width: starSize, height: starSize }}>
                            <Star
                              size={starSize}
                              className={isFull ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}
                            />
                            {isHalf && (
                              <div className="absolute inset-0 overflow-hidden" style={{ width: `${starSize / 2}px` }}>
                                <Star size={starSize} className="fill-amber-400 text-amber-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <span className="text-[10px] sm:text-xs text-stone-500 ml-0.5">({rp.reviews} відгук{rp.reviews === 1 ? '' : rp.reviews >= 2 && rp.reviews <= 4 ? 'и' : 'ів'})</span>
                    </div>
                    <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm text-orange-500 font-semibold">{rp.price.toLocaleString("uk-UA")} грн</span>
                      {rp.oldPrice && (
                        <span className="text-stone-400 text-[10px] sm:text-xs line-through">
                          {rp.oldPrice.toLocaleString("uk-UA")} грн
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <ErrorBoundary label="Схожі товари">
          <InfiniteProductFeed
            category={product.category}
            currentProductId={product.id}
            relatedIds={related.map((r) => r.id)}
            allProducts={allProducts}
          />
        </ErrorBoundary>
      </div>
      </div>

      {/* ✅ ВИПРАВЛЕННЯ: ДОДАНО FOOTER */}
      <ShopFooter />
    </div>
  );
}
