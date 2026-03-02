"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  ChevronLeft,
  Trash2,
  Loader2,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { checkoutSchema, type CheckoutFormData } from "@/lib/checkout-schema";
import type { CheckoutResponseSuccess, CheckoutResponseError } from "@/lib/types";

/* ─────────────────────────────────────────────────────────────────────────
   Reusable field wrapper
   ───────────────────────────────────────────────────────────────────────── */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-500 font-medium mt-0.5">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Empty cart state
   ───────────────────────────────────────────────────────────────────────── */
function EmptyCartScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} className="text-gray-300" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Кошик порожній</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Додайте товари до кошика, щоб перейти до оплати.
        </p>
        <Link
          href="/#catalog"
          className="inline-flex items-center justify-center gap-2 bg-rose-500 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-rose-600 transition-colors"
        >
          <ShoppingCart size={18} />
          До каталогу
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Redirecting to WayForPay screen
   ───────────────────────────────────────────────────────────────────────── */
function RedirectingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 size={40} className="text-rose-500 animate-spin" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Замовлення створено!</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Перенаправляємо вас на сторінку оплати WayForPay…
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ExternalLink size={13} />
          secure.wayforpay.com
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main checkout page
   ───────────────────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const { items, totalCount, totalPrice, removeItem } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          totalPrice,
        }),
      });

      const json: CheckoutResponseSuccess | CheckoutResponseError = await res.json();

      if (!res.ok || "error" in json) {
        throw new Error((json as CheckoutResponseError).error ?? "Помилка оформлення замовлення");
      }

      const { paymentUrl } = json as CheckoutResponseSuccess;

      // Show redirecting screen, then send user to WayForPay
      setRedirecting(true);
      // Small delay lets the UI flash the "redirecting" state before navigation
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 800);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Сталася помилка. Спробуйте ще раз.";
      setServerError(msg);
      setSubmitting(false);
    }
  };

  // Show redirecting screen while navigating to WayForPay
  if (redirecting) return <RedirectingScreen />;

  // Show empty cart state (only after hydration to avoid SSR mismatch)
  if (mounted && totalCount === 0) return <EmptyCartScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ── Back link ── */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
        >
          <ChevronLeft size={16} />
          Повернутись до магазину
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-8">Оформлення замовлення</h1>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ─────────────────────────────────────────
              Left column: contact + delivery form
              ───────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

              {/* Contact info */}
              <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-5">
                <h2 className="text-lg font-black text-gray-900">Контактні дані</h2>

                <Field label="Ваше ім'я *" error={errors.name?.message}>
                  <input
                    {...register("name")}
                    placeholder="Наприклад: Олена Коваль"
                    autoComplete="name"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition ${
                      errors.name ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  />
                </Field>

                <Field label="Телефон *" error={errors.phone?.message}>
                  <input
                    {...register("phone")}
                    placeholder="+380671234567"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition ${
                      errors.phone ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  />
                </Field>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-5">
                <h2 className="text-lg font-black text-gray-900">Доставка Новою Поштою</h2>

                <Field label="Місто *" error={errors.city?.message}>
                  <input
                    {...register("city")}
                    placeholder="Наприклад: Одеса"
                    autoComplete="address-level2"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition ${
                      errors.city ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  />
                </Field>

                <Field label="Відділення / поштомат *" error={errors.warehouse?.message}>
                  <input
                    {...register("warehouse")}
                    placeholder="Наприклад: Відділення №5 або Поштомат №2345"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition ${
                      errors.warehouse ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  />
                </Field>

                <Field label="Коментар до замовлення" error={errors.comment?.message}>
                  <textarea
                    {...register("comment")}
                    rows={3}
                    placeholder="Додаткові побажання або уточнення (необов'язково)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition hover:border-gray-300 resize-none"
                  />
                </Field>
              </div>

              {/* Payment info banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <CreditCard size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-800 mb-0.5">Безпечна оплата через WayForPay</p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Після підтвердження замовлення ви будете перенаправлені на захищену сторінку
                    оплати WayForPay. Підтримуються Visa, Mastercard, Apple Pay, Google Pay.
                  </p>
                </div>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
                  ⚠️ {serverError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg shadow-rose-200"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Оформлюємо…
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Перейти до оплати
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Натискаючи кнопку, ви погоджуєтесь з умовами доставки та оплати.
                <br />
                Оплата здійснюється через захищений шлюз WayForPay.
              </p>
            </form>
          </div>

          {/* ─────────────────────────────────────────
              Right column: order summary
              ───────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-black text-gray-900 mb-5">
                Ваше замовлення{" "}
                <span className="text-rose-500">
                  ({totalCount} {totalCount === 1 ? "товар" : totalCount < 5 ? "товари" : "товарів"})
                </span>
              </h2>

              {/* Items list */}
              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">× {item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-black text-gray-900 whitespace-nowrap">
                        {(item.price * item.quantity).toLocaleString("uk-UA")} грн
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-rose-500 transition-colors"
                        title="Видалити товар"
                        aria-label="Видалити товар"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Доставка</span>
                  <span className="text-green-600 font-semibold">За тарифами НП</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-gray-900">Разом:</span>
                  <span className="text-2xl font-black text-rose-500">
                    {totalPrice.toLocaleString("uk-UA")} грн
                  </span>
                </div>
              </div>

              {/* WayForPay badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 4.12-2.79 7.96-6 9.12C8.79 18.96 6 15.12 6 11V7.67L12 5zm-1 4v4h2V9h-2zm0 5v2h2v-2h-2z" />
                </svg>
                Захищено WayForPay SSL
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
