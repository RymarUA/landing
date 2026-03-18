// @ts-nocheck
import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { getCachedCatalogProducts } from "@/lib/cached-data";

export const revalidate = 180;

export async function GET() {
  try {
    const products = await getCachedCatalogProducts();
    const categorySet = new Set<string>();

    products.forEach((product) => {
      if (product.category) {
        categorySet.add(product.category.trim());
      }
    });

    const sortedFromProducts = Array.from(categorySet)
      .filter((cat) => Boolean(cat) && cat !== "SITE_SETTINGS")
      .sort((a, b) => a.localeCompare(b, "uk"));

    const baseCategories = ["Всі", "Хіти продажів", "Безкоштовна доставка"];
    const uniqueCategories = [
      ...baseCategories,
      ...sortedFromProducts.filter(
        (cat) => !baseCategories.includes(cat)
      ),
    ];

    return NextResponse.json({
      success: true,
      categories: uniqueCategories,
      total: uniqueCategories.length,
      source: "cached-products",
    });
  } catch (error) {
    console.error("[API] Failed to build categories from cached products, using fallback:", error);

    const fallback = [
      "Всі",
      "Хіти продажів",
      "Безкоштовна доставка",
      ...siteConfig.catalogCategories.filter(
        (cat) => cat !== "Хіти продажів" && cat !== "Безкоштовна доставка"
      ),
    ];

    return NextResponse.json({
      success: true,
      categories: fallback,
      total: fallback.length,
      source: "fallback",
    });
  }
}
