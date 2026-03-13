// @ts-nocheck
import { NextResponse } from "next/server";
import { getSitniksCategories, getAllSitniksProducts } from "@/lib/sitniks-consolidated";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Вимкнути кешування

export async function GET() {
  try {
    const categories = await getSitniksCategories();
    const allProducts = await getAllSitniksProducts();
    
    if (!categories || categories.length === 0) {
      console.log("[API] No categories from Sitniks, using fallback from site-config");
      return NextResponse.json({
        success: true,
        categories: siteConfig.catalogCategories,
        total: siteConfig.catalogCategories.length,
        source: "fallback",
      });
    }
    
    // Фільтруємо категорії - залишаємо тільки ті, в яких є товари
    const categoryNames = categories
      .filter((cat) => cat?.title && cat.title.trim() && cat.title !== "SITE_SETTINGS")
      .filter((cat) => {
        // Перевіряємо чи є хоча б один товар в цій категорії
        return allProducts.some(product => 
          product.category?.title === cat.title &&
          product.title?.toLowerCase() !== "налаштування сайту"
        );
      })
      .map((cat) => cat.title);

    // Додаємо "Всі" на початку
    const uniqueCategories = ["Всі", ...categoryNames];

    return NextResponse.json({
      success: true,
      categories: uniqueCategories,
      total: uniqueCategories.length,
      source: "sitniks-filtered",
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
