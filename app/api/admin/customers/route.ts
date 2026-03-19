/**
 * GET /api/admin/customers
 * 
 * Fetch customers data from Sitniks CRM
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sitniksSafe } from "@/lib/sitniks-consolidated";

interface Customer {
  id: number;
  fullname: string;
  email?: string;
  phone?: string;
  createdAt: string;
  ordersCount?: number;
  totalSpent?: number;
  lastOrderAt?: string;
}

export async function GET(_req: NextRequest) {
  try {
    console.log("[api/admin/customers] Fetching customers data");

    // Fetch all customers
    const customersResponse = await sitniksSafe<{ data?: Customer[] }>(
      "GET", "/open-api/clients?limit=100"
    );

    const customers = customersResponse?.data || [];

    // Enrich customers with order statistics
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        try {
          // Fetch customer orders
          const ordersResponse = await sitniksSafe<{ data?: any[] }>(
            "GET", `/open-api/orders?clientId=${customer.id}`
          );
          
          const orders = ordersResponse?.data || [];
          const completedOrders = orders.filter((order: any) => 
            order.status?.name === "Відправлено" || 
            order.status?.name === "Доставлено" ||
            order.status?.name === "Оплачено"
          );

          return {
            ...customer,
            ordersCount: orders.length,
            totalSpent: completedOrders.reduce((sum: number, order: any) => 
              sum + (order.totalAmount || 0), 0
            ),
            lastOrderAt: orders.length > 0 ? 
              orders.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0].createdAt : undefined,
          };
        } catch (error) {
          console.warn(`[api/admin/customers] Failed to enrich customer ${customer.id}:`, error);
          return {
            ...customer,
            ordersCount: 0,
            totalSpent: 0,
          };
        }
      })
    );

    // Sort by creation date (newest first)
    enrichedCustomers.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log(`[api/admin/customers] Returning ${enrichedCustomers.length} customers`);

    return NextResponse.json({ customers: enrichedCustomers });
  } catch (error) {
    console.error("[api/admin/customers] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
