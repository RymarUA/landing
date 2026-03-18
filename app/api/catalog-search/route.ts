import { NextResponse } from "next/server";
import { getCachedCatalogProducts, mapProductsForSearch } from "@/lib/cached-data";

export const revalidate = 120;

export async function GET() {
  try {
    const products = await getCachedCatalogProducts();
    const mapped = mapProductsForSearch(products);

    return NextResponse.json({
      success: true,
      products: mapped,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[catalog-search] Failed to build search index", error);
    return NextResponse.json(
      {
        success: false,
        products: [],
        error: "FAILED_TO_LOAD",
      },
      { status: 500 },
    );
  }
}
