import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") as "csv" | "pdf";

    if (!format || !["csv", "pdf"].includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    // Получаем данные всех клиентов
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/customer-activity`);
    const customers = await response.json();

    if (format === "csv") {
      // Генерируем CSV
      const csvHeaders = [
        "Customer ID",
        "Name",
        "Email",
        "Phone",
        "Wishlist Items",
        "View Count",
        "Categories",
        "Price Range",
        "Last Activity"
      ];

      const csvRows = customers.map((customer: any) => [
        customer.customerId,
        customer.fullname,
        customer.email,
        customer.phone,
        customer.wishlist.length,
        customer.viewCount,
        customer.categories.join("; "),
        customer.priceRange,
        new Date(customer.lastActivity).toLocaleString()
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="customer-analytics-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (format === "pdf") {
      // Для PDF нужна библиотека типа puppeteer или jsPDF
      // Возвращаем простую HTML версию для демонстрации
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Customer Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Customer Analytics Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Wishlist</th>
                <th>Views</th>
                <th>Categories</th>
                <th>Price Range</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map((customer: any) => `
                <tr>
                  <td>${customer.customerId}</td>
                  <td>${customer.fullname}</td>
                  <td>${customer.email}</td>
                  <td>${customer.wishlist.length}</td>
                  <td>${customer.viewCount}</td>
                  <td>${customer.categories.join(", ")}</td>
                  <td>${customer.priceRange}</td>
                  <td>${new Date(customer.lastActivity).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="customer-analytics-${new Date().toISOString().split('T')[0]}.html"`
        }
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("[api/admin/export] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
