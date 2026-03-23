/**
 * API endpoint to clean cart from non-existent products
 * POST /api/admin/clean-cart
 */

import { NextRequest, NextResponse } from "next/server";
import { getCatalogProductById } from "@/lib/instagram-catalog";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  return requireAdminAuth(req, async (_req, admin) => {
    try {
      console.log(`[Clean Cart] Request from admin: ${admin.email}`);
      const body = await _req.json();
    const { cart } = body;
    
    if (!cart || !Array.isArray(cart.items)) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }
    
    console.log("[Clean Cart] Checking cart for invalid products...");
    
    const validItems = [];
    const removedItems = [];
    
    for (const item of cart.items) {
      try {
        const product = await getCatalogProductById(item.id);
        if (product) {
          validItems.push(item);
        } else {
          removedItems.push(item);
          console.log(`[Clean Cart] Removed invalid product: ${item.id} - ${item.name}`);
        }
      } catch (error) {
        console.error(`[Clean Cart] Error checking product ${item.id}:`, error);
        removedItems.push(item);
      }
    }
    
    return NextResponse.json({
      success: true,
      validItems,
      removedItems,
      message: `Removed ${removedItems.length} invalid items from cart`
    });
    
  } catch (error) {
    console.error("[Clean Cart] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
  });
}
