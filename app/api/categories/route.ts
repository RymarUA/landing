// @ts-nocheck
import { NextResponse } from "next/server";
import { getSitniksCategories } from "@/lib/sitniks-consolidated";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const categories = await getSitniksCategories();
    
    if (!categories || categories.length === 0) {
      console.log("[API] No categories from Sitniks, using fallback from site-config");
      return NextResponse.json({
        success: true,
        categories: siteConfig.catalogCategories,
        total: siteConfig.catalogCategories.length,
        source: "fallback",
      });
    }
    
    const categoryNames = categories
      .filter((cat) => cat?.name && cat.name.trim())
      .map((cat) => cat.name);

    const uniqueCategories = ["Всі", ...Array.from(new Set(categoryNames))];

    return NextResponse.json({
      success: true,
      categories: uniqueCategories,
      total: uniqueCategories.length,
      source: "sitniks",
    });
  } catch (error) {
    console.error("[API] Failed to fetch categories from Sitniks, using fallback:", error);
    
    return NextResponse.json({
      success: true,
      categories: siteConfig.catalogCategories,
      total: siteConfig.catalogCategories.length,
      source: "fallback",
    });
  }
}
