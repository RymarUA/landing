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
import { isValidUkrainianPhone, normalizePhone } from "./phone-utils";
import { validateAndFormatName, validateAndFormatSurname } from "./name-utils";

/** Payment method: online (WayForPay) or cash-on-delivery */
export const PAYMENT_METHODS = ["online", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const checkoutSchema = z.object({
  /** Customer first name — letters only, 2 to 60 chars */
  name: z
    .string()
    .trim()
    .min(2, "Вкажіть ім'я (мінімум 2 символи)")
    .max(60, "Ім'я занадто довге")
    .transform(validateAndFormatName),

  /** Customer surname — letters only, 2 to 60 chars */
  surname: z
    .string()
    .trim()
    .min(2, "Вкажіть прізвище (мінімум 2 символи)")
    .max(60, "Прізвище занадто довге")
    .transform(validateAndFormatSurname),

  /** Ukrainian phone number */
  phone: z
    .string()
    .trim()
    .refine(isValidUkrainianPhone, "Невірний формат. Приклад: 0671234567 або +380671234567")
    .transform(normalizePhone),

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

  /** Payment method: online via WayForPay or COD (накладений платіж) */
  paymentMethod: z.enum(PAYMENT_METHODS),

  /** Email - required only for COD payment */
  email: z.literal("")
    .or(z.string().email("Невірний формат email"))
    .optional()
    .transform(e => e === "" ? undefined : e),
}).refine((data) => {
  // Email is required only for COD payment
  if (data.paymentMethod === "cod") {
    return !!data.email;
  }
  return true;
}, {
  message: "Email обов'язковий для накладного платежу",
  path: ["email"],
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

