import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Получаем данные всех клиентов
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/customer-activity`);
    const customers = await response.json();

    // Фильтруем по дате если указаны
    const filteredCustomers = customers.filter((customer: any) => {
      if (!startDate && !endDate) return true;
      
      const activityDate = new Date(customer.lastActivity);
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      
      return activityDate >= start && activityDate <= end;
    });

    // Агрегируем данные
    const totalCustomers = filteredCustomers.length;
    const activeCustomers = filteredCustomers.filter((c: any) => c.viewCount > 0 || c.wishlist.length > 0).length;
    
    const totalWishlistItems = filteredCustomers.reduce((sum: number, c: any) => sum + c.wishlist.length, 0);
    const totalViews = filteredCustomers.reduce((sum: number, c: any) => sum + c.viewCount, 0);

    // Считаем популярные категории
    const categoryCount: { [key: string]: number } = {};
    filteredCustomers.forEach((customer: any) => {
      customer.categories.forEach((category: string) => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });

    const topCategories = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Считаем средний ценовой диапазон
    const priceRanges = filteredCustomers.map((c: any) => c.priceRange).filter(Boolean);
    const avgPriceRange = priceRanges.length > 0 ? "0-10000" : "Не определен";

    // Последняя активность
    const recentActivity = filteredCustomers
      .sort((a: any, b: any) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 10)
      .map((customer: any) => ({
        customer: customer.fullname,
        action: `Просмотрел ${customer.viewCount} товаров, wishlist: ${customer.wishlist.length}`,
        timestamp: new Date(customer.lastActivity).toLocaleString()
      }));

    const analytics = {
      totalCustomers,
      activeCustomers,
      totalWishlistItems,
      totalViews,
      topCategories,
      averagePriceRange: avgPriceRange,
      recentActivity,
      period: {
        start: startDate || "All time",
        end: endDate || "Now"
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[api/admin/analytics] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
