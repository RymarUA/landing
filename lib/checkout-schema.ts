// @ts-nocheck
/**
 * lib/checkout-schema.ts
 *
 * Zod validation schema for the checkout form.
 * Shared between:
 *   - app/checkout/page.tsx   (client-side react-hook-form validation)
 *   - app/api/checkout/route.ts (server-side re-validation)
 */

import { z } from "zod";

/** Ukrainian mobile / landline phone regex.
 *  Accepts: 0XXXXXXXXX | +380XXXXXXXXX | 380XXXXXXXXX */
const PHONE_UA = /^(\+?38)?0\d{9}$/;

/** Payment method: online (WayForPay) or cash-on-delivery */
export const PAYMENT_METHODS = ["online", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const checkoutSchema = z.object({
  /** Customer full name — 2 to 60 chars */
  name: z
    .string()
    .trim()
    .min(2, "Вкажіть ім'я (мінімум 2 символи)")
    .max(60, "Ім'я занадто довге"),

  /** Ukrainian phone number */
  phone: z
    .string()
    .trim()
    .regex(PHONE_UA, "Невірний формат. Приклад: 0671234567 або +380671234567"),

  /** Nova Poshta city */
  city: z
    .string()
    .trim()
    .min(2, "Вкажіть місто"),

  /** Nova Poshta branch number or parcel locker address */
  warehouse: z
    .string()
    .trim()
    .min(2, "Вкажіть відділення або адресу поштомату"),

  /** Optional free-text comment to the order */
  comment: z.string().trim().max(500, "Коментар занадто довгий").optional(),

  /** Optional customer email for order confirmation */
  email: z.string().trim().email("Невірний формат email").or(z.literal("")),

  /** Payment method: online via WayForPay or COD (накладений платіж) */
  paymentMethod: z.enum(PAYMENT_METHODS),

  /** Optional promo code */
  promoCode: z.string().trim().max(32).optional().or(z.literal("")),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

/* ─── Promo codes config ─────────────────────────────────────────
   Add / edit codes here. discountPct = percent off total (0–100).
   ─────────────────────────────────────────────────────────────── */
export const PROMO_CODES: Record<string, { discountPct: number; label: string }> = {
  EAST12: { discountPct: 12, label: "−12% на хіти відновлення" },
  FIRST10: { discountPct: 10, label: "−10% на перше замовлення" },
};

/** Validate a promo code and return discount percentage (0 if invalid). */
export function applyPromoCode(code: string): { discountPct: number; label: string } | null {
  const entry = PROMO_CODES[code.trim().toUpperCase()];
  return entry ?? null;
}

