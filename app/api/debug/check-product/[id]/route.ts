/**
 * Check if product exists by ID
 * GET /api/debug/check-product/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { getCatalogProductById } from "@/lib/instagram-catalog";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    
    const product = await getCatalogProductById(productId);
    
    if (product) {
      return NextResponse.json({
        exists: true,
        product: {
          id: product.id,
          name: product.name,
          variationId: product.variationId,
          price: product.price
        }
      });
    } else {
      return NextResponse.json({ exists: false }, { status: 404 });
    }
    
  } catch (error) {
    console.error("[Check Product] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      exists: false
    }, { status: 500 });
  }
}
