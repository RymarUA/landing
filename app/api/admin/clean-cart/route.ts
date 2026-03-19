/**
 * API endpoint to clean cart from non-existent products
 * POST /api/admin/clean-cart
 */

import { NextRequest, NextResponse } from "next/server";
import { getCatalogProductById } from "@/lib/instagram-catalog";

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
}
