// @ts-nocheck
/**
 * lib/email-otp.ts
 *
 * Email OTP service using Resend for customer authentication.
 * Sends 6-digit codes via email for login verification.
 *
 * ENV VARS:
 *   RESEND_API_KEY - API key from https://resend.com/api-keys
 *   EMAIL_FROM - Verified sender address (must match domain in Resend)
 *   NEXT_PUBLIC_SITE_URL - Site URL for email templates
 */

import { Resend } from 'resend';

const SEND_TIMEOUT_MS = 10000;

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export async function sendEmailOtp(email: string, otp: string): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  console.log("[email-otp] Sending OTP:", { email, fromEmail, siteUrl });

  if (!apiKey || !fromEmail) {
    console.warn("[email-otp] RESEND_API_KEY or EMAIL_FROM not set");
    return { success: false, error: "Email service not configured" };
  }

  // Only use test email in development
  const isDevelopment = process.env.NODE_ENV === "development";
  const testEmail = "kateandrosov@gmail.com";
  const isTestMode = isDevelopment && email !== testEmail;

  const resend = new Resend(apiKey);
  
  // In development, send to test email for testing
  // In production, send to actual customer email
  const targetEmailForDelivery = isDevelopment && email !== testEmail ? testEmail : email;
  const originalEmailForStorage = email;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Код підтвердження - FamilyHub Market</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 12px 12px; }
        .code-box { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 4px; margin: 10px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Код підтвердження</h1>
          <p>FamilyHub Market</p>
        </div>
        
        <div class="content">
          <p>Вітаємо! Ви ввели цю пошту для входу в особистий кабінет FamilyHub Market.</p>
          
          <div class="code-box">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Ваш код підтвердження:</p>
            <div class="code">${otp}</div>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Дійсний 5 хвилин</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Якщо це не ви, проігноруйте цей лист. Код згенеровано автоматично.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/profile" class="button">Перейти до особистого кабінету</a>
          </div>
        </div>
        
        <div class="footer">
          <p>© 2024 FamilyHub Market. Всі права захищено.</p>
          <p style="font-size: 12px; margin-top: 10px;">
            Цей лист надіслано автоматично. Будь ласка, не відповідайте на нього.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
FamilyHub Market - Код підтвердження

Вітаємо! Ви ввели цю пошту для входу в особистий кабінет.

Ваш код підтвердження: ${otp}
Дійсний 5 хвилин

Якщо це не ви, проігноруйте цей лист.

Перейти до особистого кабінету: ${siteUrl}/profile

© 2024 FamilyHub Market
  `.trim();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Use verified Resend domain
      to: targetEmailForDelivery, // Send to verified email
      subject: `Код підтвердження - FamilyHub Market`,
      html: htmlTemplate,
      text: textTemplate,
    });

    clearTimeout(timeout);

    if (error) {
      console.error('[email-otp] Resend error:', error);
      
      // Fallback to Telegram
      try {
        const { sendTelegramNotification } = await import("@/lib/telegram");
        const telegramMessage = `🔐 OTP для ${email}: ${otp}\nДійсний 5 хвилин.`;
        await sendTelegramNotification(telegramMessage);
        console.log('[email-otp] Fallback: OTP sent to Telegram');
        return { success: true, messageId: 'telegram-fallback' };
      } catch (telegramError) {
        console.error('[email-otp] Telegram fallback failed:', telegramError);
      }
      
      return { success: false, error: error.message };
    }

    const targetEmail = targetEmailForDelivery;
    console.log(`[email-otp] OTP sent to ${targetEmail}, message ID: ${data?.id}`);
    
    if (isTestMode) {
      console.log(`[email-otp] DEV MODE: Original email was ${originalEmailForStorage}, but sent to ${testEmail}`);
    }
    
    return { 
      success: true, 
      messageId: data?.id || 'unknown'
    };
  } catch (err: any) {
    console.error('[email-otp] Send failed:', err);
    return { success: false, error: 'Email service unavailable' };
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize email for storage
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
