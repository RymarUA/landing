import { NextRequest, NextResponse } from 'next/server';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();
    
    // Логирование метрик
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
    
    // В продакшене можно отправлять в систему мониторинга
    // Например, в Google Analytics, Vercel Analytics, или другой сервис
    
    // Опционально: сохранение в БД для аналитики
    // await db.webVitals.create({ data: metric });
    
    // Опционально: алерт в Telegram при плохих метриках
    if (
      metric.rating === 'poor' &&
      process.env.TELEGRAM_BOT_TOKEN &&
      process.env.TELEGRAM_CHAT_ID
    ) {
      const message = `
⚠️ <b>Poor Web Vital Detected</b>

📊 <b>Metric:</b> ${metric.name}
📈 <b>Value:</b> ${metric.value.toFixed(2)}
⭐ <b>Rating:</b> ${metric.rating}
🔗 <b>ID:</b> ${metric.id}
      `.trim();
      
      try {
        await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: 'HTML',
            }),
          }
        );
      } catch (telegramError) {
        console.error('Failed to send vitals alert to Telegram:', telegramError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging web vitals:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
