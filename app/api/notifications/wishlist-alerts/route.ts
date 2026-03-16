import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { customerId, productId, productName, price, customerEmail } = await req.json();

    if (!customerId || !productId || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Отправляем email уведомление
    const { data, error } = await resend.emails.send({
      from: "noreply@yourstore.com",
      to: customerEmail,
      subject: `🔥 Скидка на товар из wishlist!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B6B;">🎉 Отличные новости!</h2>
          
          <p>Товар <strong>${productName}</strong> из вашего wishlist теперь со скидкой!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${productName}</h3>
            <p style="color: #28a745; font-size: 24px; font-weight: bold;">${price} грн</p>
            <a href="https://yourstore.com/product/${productId}" 
               style="background: #FF6B6B; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Посмотреть товар
            </a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            Это автоматическое уведомление. Вы можете отключить его в настройках профиля.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[notifications/wishlist-alerts] Email error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data });
  } catch (error) {
    console.error("[notifications/wishlist-alerts] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
