import { siteConfig } from "@/lib/site-config";

interface JsonLdProps {
  data: Record<string, unknown>;
  /** Unique id to avoid collisions when multiple JSON-LD blocks exist on one page */
  id?: string;
}

export function JsonLd({ data, id = "json-ld" }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Common schema generators — automatically read from site-config.ts
   ───────────────────────────────────────────────────────────────────────── */

const socialLinks = [
  siteConfig.instagramUsername
    ? `https://www.instagram.com/${siteConfig.instagramUsername}`
    : null,
  siteConfig.telegramUsername ? `https://t.me/${siteConfig.telegramUsername}` : null,
].filter(Boolean) as string[];

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.company,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  sameAs: socialLinks,
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteConfig.url}/?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   Product Schema (Product + Offer + AggregateRating)
   Used on /product/[id] pages.
   ───────────────────────────────────────────────────────────────────────── */
export function generateProductSchema(product: {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  stock: number;
  badge?: string | null;
}) {
  const availability =
    product.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteConfig.url}/product/${product.id}`,
    name: product.name,
    description: product.description,
    image: [product.image],
    sku: String(product.id),
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${siteConfig.url}/product/${product.id}`,
      priceCurrency: "UAH",
      price: product.price,
      ...(product.oldPrice ? { priceValidUntil: "2026-12-31" } : {}),
      availability,
      seller: {
        "@type": "Organization",
        name: siteConfig.name,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "UAH",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "UA",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
        },
      },
    },
    ...(product.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviews,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   FAQ Schema
   ───────────────────────────────────────────────────────────────────────── */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   BreadcrumbList Schema
   ───────────────────────────────────────────────────────────────────────── */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

