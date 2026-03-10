/**
 * lib/email.ts
 *
 * Email helpers built on top of Resend (https://resend.com).
 *
 * ENV VARS:
 *   RESEND_API_KEY     — API key from Resend dashboard
 *   EMAIL_FROM         — verified sender address, e.g. "FamilyHub Market <noreply@familyhubmarket.com>"
 *   EMAIL_ADMIN        — admin email to receive order copies
 *
 * Installation:  npm install resend
 * Documentation: https://resend.com/docs/send-with-nodejs
 *
 * ⚠️  If RESEND_API_KEY is missing, all functions skip silently (console.warn)
 *     so the checkout never breaks in development.
 */

export interface OrderEmailPayload {
  orderId: string | number;
  orderReference?: string;
  customerName: string;
  customerEmail?: string;      // optional — customer may not have provided email
  phone: string;
  city: string;
  warehouse: string;
  items: Array<{ name: string; price: number; quantity: number; size?: string | null }>;
  totalPrice: number;
}

/** Params for sendOrderConfirmation (orderReference-based). */
export interface SendOrderConfirmationParams {
  to: string;
  customerName: string;
  orderReference: string;
  items: Array<{ name: string; price: number; quantity: number; size?: string | null }>;
  total: number;
  delivery: { city: string; warehouse: string };
}

/** Params for sendAdminOrderCopy. */
export interface SendAdminOrderCopyParams {
  customerName: string;
  phone: string;
  email?: string;
  orderReference: string;
  items: Array<{ name: string; price: number; quantity: number; size?: string | null }>;
  total: number;
  delivery: { city: string; warehouse: string };
}

/* ─────────────────────────────────────────────────────────────────────────
   Core sender
   ───────────────────────────────────────────────────────────────────────── */

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "FamilyHub Market <noreply@familyhubmarket.com>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend API error", res.status, body);
    }
  } catch (err) {
    console.error("[email]", err);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   📧 Order confirmation email → customer
   ───────────────────────────────────────────────────────────────────────── */

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<void> {
  if (!payload.customerEmail) return; // skip if no email provided

  const itemRows = payload.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold;">
          ${(i.price * i.quantity).toLocaleString("uk-UA")} грн
        </td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f43f5e,#e11d48);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">FamilyHub Market</h1>
            <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px;">Дякуємо за замовлення!</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="font-size:18px;color:#111;margin:0 0 8px;">Замовлення #${payload.orderId} прийнято ✅</h2>
          <p style="color:#555;font-size:14px;margin:0 0 24px;line-height:1.6;">
            Вітаємо, <strong>${escapeHtml(payload.customerName)}</strong>!<br>
            Ваше замовлення успішно оформлено та чекає підтвердження оплати.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr style="background:#f9f9f9;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Товар</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Кількість</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Сума</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr style="background:#fef2f2;">
                <td colspan="2" style="padding:12px;font-weight:bold;color:#111;">Разом</td>
                <td style="padding:12px;text-align:right;font-size:18px;font-weight:900;color:#f43f5e;">${payload.totalPrice.toLocaleString("uk-UA")} грн</td>
              </tr>
            </tbody>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:10px;padding:16px;margin-bottom:24px;">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#555;">📦 <strong>Доставка:</strong> ${escapeHtml(payload.city)}, ${escapeHtml(payload.warehouse)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#555;">📞 <strong>Телефон:</strong> ${escapeHtml(payload.phone)}</td>
            </tr>
          </table>

          <p style="color:#555;font-size:13px;line-height:1.6;margin:0 0 24px;">
            Ми зв'яжемося з вами після підтвердження оплати та відправимо ТТН Нової Пошти для відстеження.
          </p>

          <div style="text-align:center;">
            <a href="https://familyhubmarket.com" style="display:inline-block;background:#f43f5e;color:#fff;font-weight:bold;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
              Продовжити покупки
            </a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#aaa;">FamilyHub Market · Доставка Новою Поштою по всій Україні</p>
            <p style="margin:4px 0 0;font-size:11px;color:#ccc;">Цей лист згенеровано автоматично, будь ласка, не відповідайте на нього.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: payload.customerEmail,
    subject: `✅ Замовлення #${payload.orderReference ?? payload.orderId} прийнято — FamilyHub Market`,
    html,
  });
}

/**
 * Order confirmation to customer (orderReference-based, orange header + logo block).
 */
export async function sendOrderConfirmation(params: SendOrderConfirmationParams): Promise<void> {
  const itemRows = params.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${escapeHtml(i.size ? `${i.name} (розм. ${i.size})` : i.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold;">
          ${(i.price * i.quantity).toLocaleString("uk-UA")} грн
        </td>
      </tr>`
    )
    .join("");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://familyhubmarket.com";
  const html = `
<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">FamilyHub Market</h1>
            <p style="color:rgba(255,255,255,.9);margin:8px 0 0;font-size:14px;">Дякуємо за замовлення!</p>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <h2 style="font-size:18px;color:#111;margin:0 0 8px;">Вітаємо, ${escapeHtml(params.customerName)}!</h2>
          <p style="color:#555;font-size:14px;margin:0 0 24px;">Ваше замовлення <strong>${escapeHtml(params.orderReference)}</strong> прийнято.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr style="background:#f9f9f9;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;">Товар</th>
                <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;">К-сть</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;">Сума</th>
              </tr>
            </thead>
            <tbody>${itemRows}
              <tr style="background:#fff7ed;"><td colspan="2" style="padding:12px;font-weight:bold;">Разом</td>
                <td style="padding:12px;text-align:right;font-weight:900;color:#ea580c;">${params.total.toLocaleString("uk-UA")} грн</td></tr>
            </tbody>
          </table>
          <p style="color:#555;font-size:13px;">📦 Доставка: ${escapeHtml(params.delivery.city)}, ${escapeHtml(params.delivery.warehouse)}</p>
          <p style="color:#888;font-size:12px;margin-top:24px;">FamilyHub Market · familyhubmarket.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: params.to,
    subject: `✅ Замовлення ${params.orderReference} — FamilyHub Market`,
    html,
  });
}

/**
 * Copy of order to admin.
 */
export async function sendAdminOrderCopy(params: SendAdminOrderCopyParams): Promise<void> {
  const adminEmail = process.env.EMAIL_ADMIN;
  if (!adminEmail) return;

  const itemList = params.items
    .map((i) => `• ${i.name}${i.size ? ` (розм. ${i.size})` : ""} × ${i.quantity} — ${(i.price * i.quantity).toLocaleString("uk-UA")} грн`)
    .join("<br>");

  const html = `
<h2>Нове замовлення ${escapeHtml(params.orderReference)}</h2>
<p><strong>Покупець:</strong> ${escapeHtml(params.customerName)}</p>
<p><strong>Телефон:</strong> ${escapeHtml(params.phone)}</p>
<p><strong>Email:</strong> ${params.email ? escapeHtml(params.email) : "—"}</p>
<p><strong>Доставка:</strong> ${escapeHtml(params.delivery.city)}, ${escapeHtml(params.delivery.warehouse)}</p>
<hr>
<p>${itemList}</p>
<p><strong>Сума: ${params.total.toLocaleString("uk-UA")} грн</strong></p>`;

  await sendEmail({
    to: adminEmail,
    subject: `[FHM] Замовлення ${params.orderReference} — ${escapeHtml(params.customerName)}`,
    html,
  });
}

/**
 * Subscription confirmation with promo code (subject: Ваш промокод −10%: FIRST10).
 */
export async function sendSubscriptionConfirmation(params: {
  to: string;
  promoCode: string;
}): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://familyhubmarket.com";
  const html = `
<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px;background:#f8f8f8;font-family:-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;">FamilyHub Market</h1>
    </div>
    <div style="padding:28px;">
      <h2 style="font-size:18px;color:#111;margin:0 0 12px;">Ваш промокод на знижку −10%</h2>
      <p style="color:#555;font-size:14px;margin:0 0 20px;">Дякуємо за підписку! Скористайтесь промокодом при оформленні замовлення.</p>
      <div style="text-align:center;padding:20px;background:#fff7ed;border:2px dashed #ea580c;border-radius:12px;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:900;letter-spacing:.1em;color:#c2410c;">${escapeHtml(params.promoCode)}</span>
      </div>
      <div style="text-align:center;">
        <a href="${siteUrl}/#catalog" style="display:inline-block;background:#ea580c;color:#fff;font-weight:bold;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">Перейти до каталогу</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: params.to,
    subject: `Ваш промокод −10%: ${params.promoCode}`,
    html,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   📧 Order confirmation email → admin
   ───────────────────────────────────────────────────────────────────────── */

export async function sendOrderAdminEmail(payload: OrderEmailPayload): Promise<void> {
  const adminEmail = process.env.EMAIL_ADMIN;
  if (!adminEmail) return;

  const itemList = payload.items
    .map((i) => `• ${i.name} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString("uk-UA")} грн`)
    .join("<br>");

  const html = `
<h2>Нове замовлення #${payload.orderId}</h2>
<p><strong>Покупець:</strong> ${escapeHtml(payload.customerName)}</p>
<p><strong>Телефон:</strong> ${escapeHtml(payload.phone)}</p>
<p><strong>Email:</strong> ${payload.customerEmail ? escapeHtml(payload.customerEmail) : "—"}</p>
<p><strong>Доставка:</strong> ${escapeHtml(payload.city)}, ${escapeHtml(payload.warehouse)}</p>
<hr>
<p>${itemList}</p>
<p><strong>Сума: ${payload.totalPrice.toLocaleString("uk-UA")} грн</strong></p>`;

  await sendEmail({
    to: adminEmail,
    subject: `[FHM] Нове замовлення #${payload.orderId} — ${payload.customerName}`,
    html,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   📧 Newsletter welcome email
   ───────────────────────────────────────────────────────────────────────── */

export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:32px;background:#f8f8f8;font-family:-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#f43f5e,#e11d48);padding:28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;">FamilyHub Market</h1>
    </div>
    <div style="padding:28px;">
      <h2 style="font-size:18px;color:#111;margin:0 0 12px;">Ласкаво просимо! 🎉</h2>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Ви підписалися на розсилку FamilyHub Market. Ми надсилатимемо вам:
      </p>
      <ul style="color:#555;font-size:14px;line-height:2;padding-left:20px;margin:0 0 20px;">
        <li>🆕 Сповіщення про нові надходження</li>
        <li>💰 Ексклюзивні знижки для підписників</li>
        <li>🔥 Хіти продажів та акції</li>
      </ul>
      <div style="text-align:center;">
        <a href="https://familyhubmarket.com/#catalog" style="display:inline-block;background:#f43f5e;color:#fff;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">
          Переглянути каталог
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: "Ласкаво просимо до FamilyHub Market! 🎉",
    html,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   📧 OTP / відновлення доступу (код підтвердження по email)
   ───────────────────────────────────────────────────────────────────────── */

export async function sendOtpOrRecoveryEmail(params: {
  to: string;
  code: string;
  type?: "otp" | "recovery";
}): Promise<void> {
  const isRecovery = params.type === "recovery";
  const subject = isRecovery
    ? "Код для відновлення доступу — FamilyHub Market"
    : "Код підтвердження — FamilyHub Market";
  const title = isRecovery ? "Відновлення доступу" : "Код підтвердження";
  const intro = isRecovery
    ? "Ви запросили відновлення доступу до особистого кабінету. Введіть код нижче:"
    : "Ваш код для підтвердження входу. Введіть його в форму на сайті:";

  const html = `
<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px;background:#f8f8f8;font-family:-apple-system,sans-serif;">
  <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;">FamilyHub Market</h1>
      <p style="color:rgba(255,255,255,.9);margin:6px 0 0;font-size:13px;">${title}</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 20px;">${intro}</p>
      <div style="text-align:center;padding:20px;background:#fff7ed;border:2px dashed #ea580c;border-radius:12px;margin-bottom:20px;">
        <span style="font-size:32px;font-weight:900;letter-spacing:.25em;color:#c2410c;">${escapeHtml(params.code)}</span>
      </div>
      <p style="color:#888;font-size:12px;margin:0;">Код дійсний 5 хвилин. Не передавайте нікому.</p>
    </div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: params.to,
    subject,
    html,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Utility
   ───────────────────────────────────────────────────────────────────────── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

