import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Получаем JWT токен из cookies
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    // Временно для разработки - проверка по email из dev-login
    // В продакшене здесь должна быть проверка JWT токена и роли в базе данных
    const adminEmails = ["dev@test.com"]; // Временно для разработки
    
    // Простая проверка для dev
    if (adminEmails.length > 0) {
      return NextResponse.json({ 
        role: "admin",
        email: "dev@test.com",
        userId: "4769814"
      });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  } catch (error) {
    console.error("[api/auth/check-admin] Error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
