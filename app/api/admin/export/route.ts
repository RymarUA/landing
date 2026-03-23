import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";

// Helper functions for sanitization
function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeCsvField(str: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  const sanitized = str.replace(/"/g, "\"");
  if (sanitized.includes(",") || sanitized.includes("\"") || sanitized.includes("\n")) {
    return `"${sanitized}"`;
  }
  return sanitized;
}

export async function GET(req: NextRequest) {
  return requireAdminAuth(req, async (_req, admin) => {
    try {
      console.log(`[api/admin/export] Export request from admin: ${admin.email}`);
      const { searchParams } = new URL(_req.url);
    const format = searchParams.get("format") as "csv" | "pdf";

    if (!format || !["csv", "pdf"].includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    // Получаем данные всех клиентов
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/customer-activity`);
    const customers = await response.json();

    if (format === "csv") {
      // Генерируем CSV
      const csvHeader = ["Customer ID", "Name", "Email", "Wishlist Count", "Views", "Categories", "Price Range", "Last Activity"];
      const csvRows = customers.map((customer: any) => [
        sanitizeCsvField(String(customer.customerId)),
        sanitizeCsvField(String(customer.fullname)),
        sanitizeCsvField(String(customer.email)),
        sanitizeCsvField(String(customer.wishlist.length)),
        sanitizeCsvField(String(customer.viewCount)),
        sanitizeCsvField(String(customer.categories.join(", "))),
        sanitizeCsvField(String(customer.priceRange)),
        sanitizeCsvField(new Date(customer.lastActivity).toLocaleString())
      ]);
      
      const csvContent = [csvHeader, ...csvRows].map(row => row.join(",")).join("\n");
      
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="customer-analytics-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (format === "pdf") {
      // Для PDF нужна библиотека типа puppeteer или jsPDF
      // Пока возвращаем HTML который можно сконвертировать в PDF
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
                  <td>${sanitizeHtml(String(customer.customerId))}</td>
                  <td>${sanitizeHtml(String(customer.fullname))}</td>
                  <td>${sanitizeHtml(String(customer.email))}</td>
                  <td>${sanitizeHtml(String(customer.wishlist.length))}</td>
                  <td>${sanitizeHtml(String(customer.viewCount))}</td>
                  <td>${sanitizeHtml(String(customer.categories.join(", ")))}</td>
                  <td>${sanitizeHtml(String(customer.priceRange))}</td>
                  <td>${sanitizeHtml(new Date(customer.lastActivity).toLocaleString())}</td>
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
  });
}
