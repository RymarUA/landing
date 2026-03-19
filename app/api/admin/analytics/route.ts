import { NextRequest, NextResponse } from "next/server";
import { sitniksSafe } from "@/lib/sitniks-consolidated";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    console.log("[api/admin/analytics] Fetching analytics data");

    // Fetch all customers from Sitniks
    const customersResponse = await sitniksSafe<{ data?: any[] }>(
      "GET", "/open-api/clients?limit=200"
    );

    if (!customersResponse?.data) {
      console.log("[api/admin/analytics] No customer data available");
      return NextResponse.json({
        totalCustomers: 0,
        activeCustomers: 0,
        totalWishlistItems: 0,
        totalViews: 0,
        topCategories: [],
        averagePriceRange: "Не визначено",
        recentActivity: [],
        period: {
          start: startDate || "All time",
          end: endDate || "Now"
        }
      });
    }

    const customers = customersResponse.data;

    // Enrich customers with order data
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer: any) => {
        try {
          const ordersResponse = await sitniksSafe<{ data?: any[] }>(
            "GET", `/open-api/orders?clientId=${customer.id}`
          );
          
          const orders = ordersResponse?.data || [];
          
          return {
            ...customer,
            ordersCount: orders.length,
            totalSpent: orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
            lastActivity: orders.length > 0 ? orders[0].createdAt : customer.createdAt,
            viewCount: Math.floor(Math.random() * 50), // Mock data for now
            wishlist: [], // Mock data for now
            categories: [], // Mock data for now
            priceRange: "0-5000" // Mock data for now
          };
        } catch (error) {
          console.warn(`[api/admin/analytics] Failed to fetch orders for customer ${customer.id}:`, error);
          return {
            ...customer,
            ordersCount: 0,
            totalSpent: 0,
            lastActivity: customer.createdAt,
            viewCount: 0,
            wishlist: [],
            categories: [],
            priceRange: "0-5000"
          };
        }
      })
    );

    // Filter by date if specified
    const filteredCustomers = enrichedCustomers.filter((customer: any) => {
      if (!startDate && !endDate) return true;
      
      const activityDate = new Date(customer.lastActivity);
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      
      return activityDate >= start && activityDate <= end;
    });

    // Aggregate data
    const totalCustomers = filteredCustomers.length;
    const activeCustomers = filteredCustomers.filter((c: any) => c.ordersCount > 0).length;
    
    const totalOrders = filteredCustomers.reduce((sum: number, c: any) => sum + (c.ordersCount || 0), 0);
    const totalRevenue = filteredCustomers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0);

    // Mock category data for now
    const topCategories = [
      { name: "Електроніка", count: 45 },
      { name: "Одяг", count: 38 },
      { name: "Для дому", count: 32 },
      { name: "Краса та здоров'я", count: 28 },
      { name: "Іграшки", count: 22 }
    ];

    // Recent activity
    const recentActivity = filteredCustomers
      .sort((a: any, b: any) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 10)
      .map((customer: any) => ({
        customer: customer.fullname,
        action: `${customer.ordersCount} замовлень на суму ${new Intl.NumberFormat('uk-UA', {
          style: 'currency',
          currency: 'UAH',
          minimumFractionDigits: 0,
        }).format(customer.totalSpent)}`,
        timestamp: new Date(customer.lastActivity).toLocaleString('uk-UA')
      }));

    const analytics = {
      totalCustomers,
      activeCustomers,
      totalOrders,
      totalRevenue,
      topCategories,
      recentActivity,
      period: {
        start: startDate || "All time",
        end: endDate || "Now"
      }
    };

    console.log("[api/admin/analytics] Returning analytics:", {
      totalCustomers: analytics.totalCustomers,
      activeCustomers: analytics.activeCustomers,
      totalOrders: analytics.totalOrders,
      totalRevenue: analytics.totalRevenue
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[api/admin/analytics] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
