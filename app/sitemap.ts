import { MetadataRoute } from "next";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { siteConfig } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  /* ── Static pages ── */
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  /* ── Dynamic product pages ── */
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getCatalogProducts();
    productRoutes = products.map((p) => ({
      url: `${baseUrl}/product/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error("[sitemap] Failed to fetch products:", err);
  }

  return [...staticRoutes, ...productRoutes];
}
