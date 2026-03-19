/**
 * GET /api/admin/dashboard
 * 
 * Admin dashboard data from Sitniks CRM
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sitniksSafe } from "@/lib/sitniks-consolidated";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  newCustomers: number;
  newReferrals: number;
}

interface RecentOrder {
  id: number;
  orderNumber: number;
  client: {
    fullname: string;
    phone?: string;
    email?: string;
  };
  totalAmount: number;
  status: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface DashboardData {
  recentOrders: RecentOrder[];
  stats: DashboardStats;
}

export async function GET(_req: NextRequest) {
  try {
    console.log("[api/admin/dashboard] Fetching dashboard data");

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Fetch recent orders (last 10)
    const recentOrdersResponse = await sitniksSafe<{ data?: RecentOrder[] }>(
      "GET", "/open-api/orders?limit=10&sort=createdAt:desc"
    );

    const recentOrders = recentOrdersResponse?.data || [];

    // Fetch today's orders
    const todayOrdersResponse = await sitniksSafe<{ data?: RecentOrder[] }>(
      "GET", `/open-api/orders?createdAt>=${startOfDay.toISOString()}&createdAt<${endOfDay.toISOString()}`
    );

    const todayOrders = todayOrdersResponse?.data || [];

    // Calculate statistics
    const stats: DashboardStats = {
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
      newCustomers: 0, // TODO: Implement customer creation tracking
      newReferrals: 0, // TODO: Implement referral tracking
    };

    // Try to get new customers count
    try {
      const todayCustomersResponse = await sitniksSafe<{ data?: any[] }>(
        "GET", `/open-api/clients?createdAt>=${startOfDay.toISOString()}&createdAt<${endOfDay.toISOString()}`
      );
      stats.newCustomers = todayCustomersResponse?.data?.length || 0;
    } catch (error) {
      console.warn("[api/admin/dashboard] Could not fetch new customers:", error);
    }

    const dashboardData: DashboardData = {
      recentOrders: recentOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        client: {
          fullname: order.client.fullname,
          phone: order.client.phone,
          email: order.client.email,
        },
        totalAmount: order.totalAmount || 0,
        status: order.status || { id: 0, name: "Невідомо" },
        createdAt: order.createdAt,
      })),
      stats,
    };

    console.log("[api/admin/dashboard] Returning dashboard data:", {
      recentOrders: dashboardData.recentOrders.length,
      stats: dashboardData.stats,
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("[api/admin/dashboard] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
