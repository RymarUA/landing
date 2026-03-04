/**
 * GET /api/feed
 *
 * Facebook / Instagram Commerce product catalog feed.
 * Returns an XML file compatible with Facebook Catalog Manager
 * (RSS 2.0 / Google Shopping format).
 *
 * How to connect:
 *   1. In Meta Commerce Manager → Catalog → Data Sources → Add data feed
 *   2. Set URL: https://your-domain.com/api/feed
 *   3. Schedule: daily or hourly refresh
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/catalog/reference/
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Revalidate every 6 hours
export const revalidate = 21600;

import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { siteConfig } from "@/lib/site-config";

/** Escape XML special characters */
function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Map internal category to Google product category */
function googleCategory(category: string): string {
  const map: Record<string, string> = {
    "Для жінок":  "Apparel &amp; Accessories &gt; Clothing",
    "Для чоловіків": "Apparel &amp; Accessories &gt; Clothing",
    "Для дітей":  "Apparel &amp; Accessories &gt; Clothing &gt; Baby &amp; Toddler Clothing",
    "Іграшки":    "Toys &amp; Games",
    "Дім":        "Home &amp; Garden",
    "Авто":       "Vehicles &amp; Parts",
  };
  return map[category] ?? "Apparel &amp; Accessories";
}

export async function GET() {
  const siteUrl = siteConfig.url.replace(/\/$/, "");
  const products = await getCatalogProducts();

  const items = products
    .filter((p) => p.stock > 0)
    .map((p) => {
      const productUrl = `${siteUrl}/product/${p.id}`;
      const imageUrl   = p.image;
      const price      = p.price.toFixed(2);
      const oldPrice   = p.oldPrice ? p.oldPrice.toFixed(2) : null;
      const inStock    = p.stock > 0 ? "in stock" : "out of stock";
      const condition  = "new";

      return `    <item>
      <g:id>${esc(String(p.id))}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${esc(p.description || p.name)}</g:description>
      <g:link>${esc(productUrl)}</g:link>
      <g:image_link>${esc(imageUrl)}</g:image_link>
      <g:price>${price} UAH</g:price>${oldPrice ? `
      <g:sale_price>${price} UAH</g:sale_price>
      <g:original_price>${oldPrice} UAH</g:original_price>` : ""}
      <g:availability>${inStock}</g:availability>
      <g:condition>${condition}</g:condition>
      <g:brand>${esc(siteConfig.company)}</g:brand>
      <g:google_product_category>${googleCategory(p.category)}</g:google_product_category>
      <g:product_type>${esc(p.category)}</g:product_type>${p.sizes.length > 0 ? `
      <g:size>${esc(p.sizes[0])}</g:size>` : ""}${p.badge ? `
      <g:custom_label_0>${esc(p.badge)}</g:custom_label_0>` : ""}
      <g:shipping>
        <g:country>UA</g:country>
        <g:service>Нова Пошта</g:service>
        <g:price>0 UAH</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(siteConfig.name)}</title>
    <link>${esc(siteUrl)}</link>
    <description>${esc(siteConfig.description)}</description>
    <language>uk</language>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
    },
  });
}
