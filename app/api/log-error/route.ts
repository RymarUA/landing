import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Логирование в консоль
    console.error('[Client Error]', {
      label: body.label,
      message: body.message,
      url: body.url,
      timestamp: body.timestamp,
    });
    
    // Опционально: отправка в Telegram
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const message = `
🚨 <b>Client Error</b>

📍 <b>Location:</b> ${body.label || 'Unknown'}
⚠️ <b>Message:</b> ${body.message}
🔗 <b>URL:</b> ${body.url}
⏰ <b>Time:</b> ${body.timestamp}

<pre>${body.stack?.slice(0, 500) || 'No stack trace'}</pre>
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
        console.error('Failed to send error to Telegram:', telegramError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
