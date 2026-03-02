/**
 * lib/checkout-schema.ts
 *
 * Zod validation schema for the checkout form.
 * Shared between:
 *   - app/checkout/page.tsx   (client-side react-hook-form validation)
 *   - app/api/checkout/route.ts (server-side re-validation)
 *
 * Payment method is intentionally NOT included here:
 * WayForPay handles all payment method selection on their hosted page.
 * The user always pays online via WayForPay.
 */

import { z } from "zod";

/** Ukrainian mobile / landline phone regex.
 *  Accepts: 0XXXXXXXXX | +380XXXXXXXXX | 380XXXXXXXXX */
const PHONE_UA = /^(\+?38)?0\d{9}$/;

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
  email: z.string().trim().email("Невірний формат email").optional().or(z.literal("")),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
