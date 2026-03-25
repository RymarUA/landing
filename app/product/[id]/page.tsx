// @ts-nocheck
import type { Metadata } from "next/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Star, ChevronLeft, Flame, Shield, Truck, CreditCard, Package, Tag } from "lucide-react";
import {
  getCatalogProducts,
  getCatalogProductById,
} from "@/lib/instagram-catalog";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductImageLightbox } from "./product-image-lightbox";
import { ShareButton } from "./share-button";
import { ReviewsBlock } from "./reviews-block";
import { ShopFooter } from "@/components/shop-footer";
import { PhotoGallery } from "@/components/photo-gallery";
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
  const [product, allProducts] = await Promise.all([
    getCatalogProductById(Number(id)),
    getCatalogProducts(),
  ]);
  if (!product) notFound();

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;
  const related: typeof allProducts = [];
  for (const p of allProducts) {
    if (p.category === product.category && p.id !== product.id) {
      related.push(p);
      if (related.length === 4) break;
    }
  }

  const galleryImages = (() => {
    const source = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image];
    const unique = Array.from(new Set(source.filter(Boolean)));
    if (unique.length === 0) unique.push(product.image);
    // Добавляем больше изображений для демонстрации, если их мало
    if (unique.length < 3) {
      // Дублируем существующие изображения для создания галереи
      const additionalImages = [];
      for (let i = 0; i < 3 - unique.length; i++) {
        additionalImages.push(unique[i % unique.length]);
      }
      return [...unique, ...additionalImages];
    }
    return unique;
  })();

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

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10">
          {/* Кнопка "Назад до каталогу" */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <Link
                href="/#catalog"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                Назад до каталогу
              </Link>
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 text-[10px] sm:text-xs font-bold uppercase tracking-wide px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                <Tag size={10} className="sm:w-3 sm:h-3" />
                {product.category}
              </span>
            </div>
          </div>

        {/* ── Main Product Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column: Image Gallery (lg:col-span-6) */}
          <div className="lg:col-span-6">
            <ProductImageLightbox src={product.image} alt={product.name} images={galleryImages}>
                            {discount && (
                <span className="absolute top-1 left-1.5 sm:top-1.5 sm:left-2 bg-[#FF4444] text-white text-[11px] sm:text-[12px] font-black px-2 py-1 rounded shadow-lg z-10">
                  -{discount}%
                </span>
              )}
              {product.stock <= 5 && product.stock > 0 && (
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 lg:bottom-4 lg:left-4 z-10">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-amber-700 text-[10px] sm:text-xs lg:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                    <Flame size={12} className="sm:w-[14px] sm:h-[14px]" />
                    <span>Залишилось {product.stock} шт.</span>
                  </div>
                </div>
              )}
            </ProductImageLightbox>
          </div>

          {/* Right Column: Product Info (lg:col-span-6) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-2 sm:gap-3">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {product.freeShipping && (
                    <div className="inline-block">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-600 text-xs sm:text-sm font-bold uppercase tracking-wide px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                        <Truck size={12} className="sm:w-4 sm:h-4" />
                        Безкоштовна доставка
                      </span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight">
                  {product.name}
                </h1>

                {/* 2. РЕЙТИНГ ТА ВІДГУКИ */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3">
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

                {/* Ціна */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-orange-500">{product.price.toLocaleString("uk-UA")} грн</span>
                  {product.oldPrice && (
                    <span className="text-lg text-gray-400 line-through">{product.oldPrice.toLocaleString("uk-UA")} грн</span>
                  )}
                </div>

                {/* 3. РОЗМІРИ ТА КНОПКА КУПИТИ */}
                <div data-main-cta className="mb-2 sm:mb-3">
                  <AddToCartButton product={product} />
                </div>

                {/* Trust Badges - ✅ ВИПРАВЛЕННЯ: Збільшені іконки та текст */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
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
                <div className="mb-2 sm:mb-3">
                  <ShareButton title={product.name} path={`/product/${product.id}`} />
                </div>

                {/* 2. ВІДГУКИ (ПОСЛЯ ВСІХ ОСНОВНИХ ЕЛЕМЕНТІВ) */}
                <div id="reviews" className="mt-4">
                  <ReviewsBlock 
                    productId={product.id}
                    rating={product.rating}
                    totalReviews={product.reviews}
                    sizeDistribution={{
                      small: 2,
                      trueToSize: 91,
                      large: 7
                    }}
                  />
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

        {/* 4. ОПИС ТА ПОВНІ ФОТО */}
        <div id="overview" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12">
              <div id="description" className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Опис товару</h2>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  {product.description}
                </div>
              </div>

              {/* Повні фото товару в ряд або сітці */}
              <div id="photos" className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Детальні фото ({galleryImages.length} шт.)</h3>
                <PhotoGallery images={galleryImages} productName={product.name} />
              </div>
            </div>
          </div>
        </div>

        {/* 5. ЗАПРОПОНОВАНІ ТОВАРИ */}
        <div id="recommended" className="mt-12">
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
      </div>

      {/* ✅ ВИПРАВЛЕННЯ: ДОДАНО FOOTER */}
      <ShopFooter />
    </div>
  );
}
