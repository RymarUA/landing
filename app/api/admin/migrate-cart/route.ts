/**
 * Migration script to update cart items from productId to variationId
 * POST /api/admin/migrate-cart
 */

import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import type { CatalogProduct } from "@/lib/instagram-catalog";

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const authHeader = req.headers.get("Authorization");
    
    if (!adminPassword || !authHeader || !authHeader.includes(`Bearer ${adminPassword}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { cart } = body;
    
    if (!cart || !Array.isArray(cart.items)) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }
    
    console.log("[Cart Migration] Starting migration...");
    
    const allProducts = await getCatalogProducts();
    const migratedItems = [];
    const unchangedItems = [];
    const failedItems = [];
    
    for (const item of cart.items) {
      try {
        // Find the product in catalog by productId (old ID)
        const product = allProducts.find((p: CatalogProduct) => p.id === item.id);
        
        if (product && product.variationId) {
          // Migrate to variationId
          migratedItems.push({
            ...item,
            id: product.variationId,
            _migrated: true
          });
          console.log(`[Cart Migration] Migrated item ${item.id} -> ${product.variationId} (${item.name})`);
        } else if (product) {
          // Product exists but no variationId, keep as is
          unchangedItems.push(item);
          console.log(`[Cart Migration] No variationId for product ${item.id}, keeping as is`);
        } else {
          // Product not found
          failedItems.push(item);
          console.log(`[Cart Migration] Product ${item.id} not found in catalog`);
        }
      } catch (error) {
        console.error(`[Cart Migration] Error migrating item ${item.id}:`, error);
        failedItems.push(item);
      }
    }
    
    return NextResponse.json({
      success: true,
      migratedItems,
      unchangedItems,
      failedItems,
      message: `Migrated ${migratedItems.length} items, ${unchangedItems.length} unchanged, ${failedItems.length} failed`
    });
    
  } catch (error) {
    console.error("[Cart Migration] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
