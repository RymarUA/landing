// @ts-nocheck
/**
 * app/api/user/orders/route.ts
 * 
 * Get orders for authenticated user from Sitniks CRM
 * 
 * FIXED: Now uses direct phone-based query instead of fetching all orders
 * and filtering client-side. This prevents orders from disappearing when
 * store has >50 total orders.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getSitniksOrdersByPhone } from "@/lib/sitniks-consolidated";

export async function GET(_req: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Require phone number for order lookup
    if (!currentUser.phone) {
      return NextResponse.json({ 
        orders: [],
        total: 0,
        message: "Phone number required to fetch orders"
      });
    }

    // FIXED: Use direct phone-based query instead of global fetch + filter
    // This ensures ALL user orders are returned, not just those in the last 50 global orders
    const orders = await getSitniksOrdersByPhone(currentUser.phone);

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ orders: [], total: 0 });
    }

    // Optional: Additional filtering by userId if needed for extra security
    const userOrders = orders.filter((order: any) => {
      // If order has userId in metadata, verify it matches
      const hasUserId = 
        order.managerComment?.includes(`UserID: ${currentUser.userId}`) ||
        order.externalId?.includes(`-user-${currentUser.userId}`);
      
      // If no userId metadata, trust phone match (orders created before userId tracking)
      const noUserId = !order.managerComment?.includes("UserID:") && 
                       !order.externalId?.includes("-user-");
      
      return hasUserId || noUserId;
    });

    // Transform orders to simplified format
    const simplifiedOrders = userOrders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status?.title || "Новий",
      statusColor: order.status?.color || "#f75757",
      totalPrice: order.totalPrice || 0,
      createdAt: order.createdAt,
      products: order.products?.map((p: any) => ({
        title: p.title,
        quantity: p.quantity,
        price: p.price,
      })) || [],
      delivery: order.delivery,
    }));

    return NextResponse.json({ 
      orders: simplifiedOrders,
      total: simplifiedOrders.length 
    });

  } catch (error) {
    console.error("[/api/user/orders] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
