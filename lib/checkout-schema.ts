import { z } from "zod";

const PHONE_UA = /^(\+?38)?0\d{9}$/;

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Вкажіть ім'я (мінімум 2 символи)")
    .max(60, "Ім'я занадто довге"),

  phone: z
    .string()
    .trim()
    .regex(PHONE_UA, "Невірний формат. Приклад: 0671234567 або +380671234567"),

  city: z
    .string()
    .trim()
    .min(2, "Вкажіть місто"),

  warehouse: z
    .string()
    .trim()
    .min(2, "Вкажіть відділення або адресу"),

  comment: z.string().trim().max(500, "Коментар занадто довгий").optional(),

  paymentMethod: z.enum(["cod", "prepay"], {
    error: "Оберіть спосіб оплати",
  }),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
