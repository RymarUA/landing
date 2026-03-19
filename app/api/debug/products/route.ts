/**
 * Debug endpoint to check product IDs and variations
 * GET /api/debug/products
 */

import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/instagram-catalog";

export async function GET(_req: NextRequest) {
  try {
    const products = await getCatalogProducts();
    
    // Find products with variationId 19469412 or productId 19469412
    const targetId = 19469412;
    const foundByProductId = products.find(p => p.id === targetId);
    const foundByVariationId = products.find(p => p.variationId === targetId);
    
    // Show first 10 products for debugging
    const sampleProducts = products.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      variationId: p.variationId,
      price: p.price
    }));
    
    return NextResponse.json({
      totalProducts: products.length,
      targetId,
      foundByProductId: foundByProductId ? {
        id: foundByProductId.id,
        name: foundByProductId.name,
        variationId: foundByProductId.variationId
      } : null,
      foundByVariationId: foundByVariationId ? {
        id: foundByVariationId.id,
        name: foundByVariationId.name,
        variationId: foundByVariationId.variationId
      } : null,
      sampleProducts
    });
    
  } catch (error) {
    console.error("[Debug Products] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
