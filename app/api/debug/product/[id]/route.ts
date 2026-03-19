/**
 * Quick debug endpoint to check specific product
 * GET /api/debug/product/19469412
 */

import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/instagram-catalog";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  // const { id } = await params; // Unused - using hardcoded targetId instead
  try {
    const products = await getCatalogProducts();
    const targetId = 19469412;
    
    // Search for this ID in all products
    const foundByProductId = products.find(p => p.id === targetId);
    const foundByVariationId = products.find(p => p.variationId === targetId);
    
    // Show first few products for context
    const sampleProducts = products.slice(0, 5).map(p => ({
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
        variationId: foundByProductId.variationId,
        price: foundByProductId.price
      } : null,
      foundByVariationId: foundByVariationId ? {
        id: foundByVariationId.id,
        name: foundByVariationId.name,
        variationId: foundByVariationId.variationId,
        price: foundByVariationId.price
      } : null,
      sampleProducts,
      recommendation: "Clear your cart and try adding fresh items from the catalog"
    });
    
  } catch (error) {
    console.error("[Debug Product] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
