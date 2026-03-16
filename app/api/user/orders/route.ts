// @ts-nocheck
/**
 * app/api/user/orders/route.ts
 * 
 * Get orders for authenticated user from Sitniks CRM
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { sitniksSafe } from "@/lib/sitniks-consolidated";

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

    // Get orders from Sitniks CRM
    // Search by phone number since that's what we have in the order
    const orders = await sitniksSafe<{ data: any[] }>(
      "GET",
      `/open-api/orders?limit=50&sort=-createdAt`
    );

    if (!orders || !orders.data) {
      return NextResponse.json({ orders: [] });
    }

    // Filter orders by userId in managerComment or externalId
    const userOrders = orders.data.filter((order: any) => {
      const hasUserId = 
        order.managerComment?.includes(`UserID: ${currentUser.userId}`) ||
        order.externalId?.includes(`-user-${currentUser.userId}`);
      
      // Also match by phone if available
      const hasPhone = currentUser.phone && 
        order.client?.phone === currentUser.phone;
      
      return hasUserId || hasPhone;
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
