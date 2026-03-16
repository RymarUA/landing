// @ts-nocheck
import { NextResponse } from "next/server";
import { getSitniksCategories, getAllSitniksProducts } from "@/lib/sitniks-consolidated";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Кешувати на 5 хвилин

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
    
    // Виключаємо товар з налаштуваннями сайту та неактивні товари
    const catalogProducts = allProducts.filter(p => {
      const sku = p.sku?.toUpperCase();
      const title = p.title?.toLowerCase();
      const name = p.name?.toLowerCase();
      
      // Перевіряємо чи є активні варіації з stock > 0
      const hasActiveVariations = p.variations?.some(v => 
        v.isActive && (v.availableQuantity ?? 0) > 0
      );
      
      return (
        sku !== "SITE_SETTINGS" && 
        title !== "налаштування сайту" &&
        name !== "налаштування сайту" &&
        p.isActive !== false && // Тільки активні товари
        hasActiveVariations // Тільки товари з активними варіаціями
      );
    });
    
    // Фільтруємо категорії - залишаємо тільки ті, в яких є активні товари
    const categoryNames = categories
      .filter((cat) => cat?.title && cat.title.trim() && cat.title !== "SITE_SETTINGS")
      .filter((cat) => {
        // Перевіряємо чи є хоча б один активний товар в цій категорії
        return catalogProducts.some(product => product.category?.title === cat.title);
      })
      .map((cat) => cat.title);

    // Додаємо "Всі", "Хіти продажів" та "Безкоштовна доставка" на початку
    const uniqueCategories = ["Всі", "Хіти продажів", "Безкоштовна доставка", ...categoryNames.filter(cat => cat !== "Безкоштовна доставка" && cat !== "Хіти продажів")];

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
