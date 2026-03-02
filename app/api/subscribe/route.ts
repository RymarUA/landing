/**
 * POST /api/subscribe
 *
 * Newsletter subscription endpoint.
 * Validates email, sends a welcome email via Resend, and stores the subscriber.
 *
 * Body: { email: string }
 *
 * ENV VARS:
 *   RESEND_API_KEY   — Resend API key
 *   EMAIL_FROM       — verified sender address
 *
 * For production, replace the in-memory store with a database or
 * Resend Audiences (https://resend.com/docs/api-reference/audiences).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

const subscribeSchema = z.object({
  email: z.string().email("Невірний формат email"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невірний email" },
      { status: 422 }
    );
  }

  const { email } = parsed.data;

  /* Send welcome email (non-blocking — don't fail request if email fails) */
  sendNewsletterWelcomeEmail(email).catch((err) =>
    console.error("[subscribe] Welcome email failed:", err)
  );

  /* TODO: persist email to Resend Audience or your DB
   *
   * Example with Resend Audiences:
   *   const resend = new Resend(process.env.RESEND_API_KEY);
   *   await resend.contacts.create({
   *     email,
   *     audienceId: process.env.RESEND_AUDIENCE_ID!,
   *   });
   */

  console.info(`[subscribe] New subscriber: ${email}`);

  return NextResponse.json({ success: true, message: "Дякуємо! Ви підписалися на розсилку." });
}
