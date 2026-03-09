// @ts-nocheck
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
import { MobileStickyBar } from "./mobile-sticky-bar";
import { ProductImageLightbox } from "./product-image-lightbox";
import { ShareButton } from "./share-button";
import { RecentlyViewedBlock } from "./recently-viewed-block";
import { InfiniteProductFeed } from "./infinite-product-feed";
import { siteConfig } from "@/lib/site-config";
import {
  JsonLd,
  generateProductSchema,
  generateBreadcrumbSchema,
} from "@/components/seo/JsonLd";
import { blurProps } from "@/lib/utils";
import { ErrorBoundary } from "@/components/error-boundary";

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
    <div className="min-h-screen bg-[#fdf6f0] pb-28 md:pb-0">
      <JsonLd id="product-schema" data={productSchema} />
      <JsonLd id="breadcrumb-schema" data={breadcrumbSchema} />

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-stone-500">
          <Link href="/" className="hover:text-orange-500 transition-colors">Головна</Link>
          <span>/</span>
          <Link href="/#catalog" className="hover:text-orange-500 transition-colors">Каталог</Link>
          <span>/</span>
          <span className="text-stone-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-8"
        >
          <ChevronLeft size={16} />
          Назад до каталогу
        </Link>

        {/* ── Main Product Card ── */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image with lightbox */}
            <ProductImageLightbox src={product.image} alt={product.name}>
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
              {product.stock <= 5 && product.stock > 0 && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-700 text-sm font-semibold flex items-center gap-2">
                    <Flame size={14} />
                    Залишилось лише {product.stock} шт.!
                  </div>
                </div>
              )}
            </ProductImageLightbox>

            {/* Info */}
            <div className="p-8 flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">{product.category}</p>
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
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl font-semibold text-gray-900">{product.price.toLocaleString("uk-UA")} грн</span>
                {product.oldPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">{product.oldPrice.toLocaleString("uk-UA")} грн</span>
                    <span className="text-sm font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Економія {(product.oldPrice - product.price).toLocaleString("uk-UA")} грн
                    </span>
                  </>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>

              <div data-main-cta>
                <AddToCartButton product={product} />
              </div>

              <div className="flex gap-3">
                <ShareButton title={product.name} path={`/product/${product.id}`} />
              </div>

              {/* IG fallback */}
              {product.instagramPermalink && (
                <a
                  href={product.instagramPermalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 font-semibold py-3 rounded-2xl transition-all text-sm"
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

        <ErrorBoundary label="Нещодавно переглянуті">
          <RecentlyViewedBlock products={allProducts} currentId={product.id} />
        </ErrorBoundary>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-black text-stone-900 mb-6">Схожі товари</h2>
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
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      {...blurProps()}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-stone-500 mb-0.5">{rp.category}</p>
                    <p className="text-sm font-bold text-stone-900 leading-tight line-clamp-2 mb-1.5">{rp.name}</p>
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < Math.round(rp.rating) ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}
                        />
                      ))}
                      <span className="text-xs text-stone-500 ml-0.5">({rp.reviews})</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-orange-500 font-semibold">{rp.price.toLocaleString("uk-UA")} грн</span>
                      {rp.oldPrice && (
                        <span className="text-stone-400 text-xs line-through">
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

      {/* ── Mobile Sticky Bar — client component with shared state ── */}
      <MobileStickyBar product={product} />
    </div>
  );
}
