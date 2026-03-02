"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, ChevronLeft, Trash2, Loader2,
  CreditCard, ExternalLink, Shield, Truck, Video,
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { checkoutSchema, type CheckoutFormData } from "@/lib/checkout-schema";
import { trackInitiateCheckout } from "@/components/analytics";
import type { CheckoutResponseSuccess, CheckoutResponseError } from "@/lib/types";

/* ─── Field wrapper ────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-500 font-medium mt-0.5">{error}</p>}
    </div>
  );
}

/* ─── Empty cart ───────────────────────────────────── */
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
          className="inline-flex items-center justify-center gap-2 bg-rose-500 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
        >
          <ShoppingCart size={18} />
          До каталогу
        </Link>
      </div>
    </div>
  );
}

/* ─── Redirecting to WayForPay ─────────────────────── */
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

/* ─── Main CheckoutPage ────────────────────────────── */
export default function CheckoutPage() {
  const { items, totalCount, totalPrice, removeItem } = useCart();
  const [submitting, setSubmitting]   = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted]         = useState(false);

  /* Abandoned-cart session */
  const sessionId = useRef<string>("");
  const abandonedRegistered = useRef(false);

  useEffect(() => {
    setMounted(true);
    sessionId.current = crypto.randomUUID();
  }, []);

  /* Register abandoned cart when phone field blurs (user has shown intent) */
  const registerAbandonedCart = useCallback(
    async (name: string, phone: string) => {
      if (abandonedRegistered.current || !phone || items.length === 0) return;
      abandonedRegistered.current = true;
      try {
        await fetch("/api/abandoned-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId.current,
            name: name || "—",
            phone,
            items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
            totalPrice,
          }),
        });
      } catch {
        // non-critical
      }
    },
    [items, totalPrice]
  );

  /* Cancel timer on successful checkout */
  const cancelAbandonedCart = useCallback(async () => {
    if (!abandonedRegistered.current) return;
    try {
      await fetch("/api/abandoned-cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current }),
      });
    } catch {
      // non-critical
    }
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({ resolver: zodResolver(checkoutSchema) });

  const nameValue  = watch("name")  ?? "";
  const phoneValue = watch("phone") ?? "";

  const onSubmit = async (data: CheckoutFormData) => {
    setSubmitting(true);
    setServerError(null);

    /* 📋 InitiateCheckout pixel event */
    trackInitiateCheckout({ value: totalPrice, numItems: totalCount });

    try {
      /* Cancel abandoned-cart timer — user is completing checkout */
      await cancelAbandonedCart();

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          totalPrice,
        }),
      });

      const json: CheckoutResponseSuccess | CheckoutResponseError = await res.json();

      if (!res.ok || "error" in json) {
        throw new Error((json as CheckoutResponseError).error ?? "Помилка оформлення замовлення");
      }

      const { paymentUrl } = json as CheckoutResponseSuccess;
      setRedirecting(true);
      setTimeout(() => { window.location.href = paymentUrl; }, 800);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Сталася помилка. Спробуйте ще раз.");
      setSubmitting(false);
    }
  };

  if (redirecting) return <RedirectingScreen />;
  if (!mounted) return null;
  if (totalCount === 0) return <EmptyCartScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6">
          <ChevronLeft size={16} />
          Назад до магазину
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
          <span>Оформлення замовлення</span>
          <span className="text-sm font-semibold bg-rose-100 text-rose-600 px-3 py-1 rounded-full">
            {totalCount} {totalCount === 1 ? "товар" : totalCount < 5 ? "товари" : "товарів"}
          </span>
        </h1>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── LEFT: form ── */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

              {/* Contact */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center text-xs font-black text-rose-600">1</div>
                  <h2 className="text-lg font-black text-gray-900">Контактні дані</h2>
                </div>

                <Field label="Ваше ім'я *" error={errors.name?.message}>
                  <input
                    {...register("name")}
                    placeholder="Наприклад: Олена Коваль"
                    autoComplete="name"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition ${
                      errors.name ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-gray-300"
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
                    onBlur={() => registerAbandonedCart(nameValue, phoneValue)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition ${
                      errors.phone ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  />
                </Field>

                <Field label="Email для підтвердження (необов'язково)" error={(errors as Record<string, {message?: string}>).email?.message}>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition hover:border-gray-300"
                  />
                </Field>
              </div>

              {/* Delivery */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center text-xs font-black text-rose-600">2</div>
                  <h2 className="text-lg font-black text-gray-900">Доставка Новою Поштою</h2>
                </div>

                <Field label="Місто *" error={errors.city?.message}>
                  <input
                    {...register("city")}
                    placeholder="Наприклад: Одеса"
                    autoComplete="address-level2"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition ${
                      errors.city ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  />
                </Field>

                <Field label="Відділення або поштомат *" error={errors.warehouse?.message}>
                  <input
                    {...register("warehouse")}
                    placeholder="Відділення №5 або Поштомат №2345"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition ${
                      errors.warehouse ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  />
                </Field>

                <Field label="Коментар (необов'язково)" error={errors.comment?.message}>
                  <textarea
                    {...register("comment")}
                    rows={2}
                    placeholder="Особливі побажання або уточнення"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition hover:border-gray-300 resize-none"
                  />
                </Field>
              </div>

              {/* Payment banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <Shield size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-800 mb-0.5">Безпечна оплата через WayForPay</p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Visa, Mastercard, Apple Pay, Google Pay · SSL-шифрування · PCI DSS
                  </p>
                </div>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{serverError}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-base py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-rose-200 hover:-translate-y-0.5 hover:shadow-rose-300"
              >
                {submitting ? (
                  <><Loader2 size={20} className="animate-spin" /> Оформлюємо…</>
                ) : (
                  <><CreditCard size={20} /> Перейти до оплати · {totalPrice.toLocaleString("uk-UA")} грн</>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Оформлюючи замовлення, ви приймаєте умови доставки та оплати.
              </p>
            </form>
          </div>

          {/* ── RIGHT: order summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-base font-black text-gray-900 mb-4">Ваше замовлення</h2>

              {/* Items */}
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1 mb-5 scrollbar-thin">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 group">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">× {item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-black text-gray-900 whitespace-nowrap">
                        {(item.price * item.quantity).toLocaleString("uk-UA")} грн
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-200 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Видалити"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Доставка</span>
                  <span className="text-green-600 font-semibold text-xs">За тарифами НП</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-gray-900">Разом:</span>
                  <span className="text-xl font-black text-rose-500">{totalPrice.toLocaleString("uk-UA")} грн</span>
                </div>
              </div>

              {/* Trust micro-badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                {[
                  { Icon: Video,  label: "Відео розпак." },
                  { Icon: Shield, label: "30 дн. гарантія" },
                  { Icon: Truck,  label: "НП 1–3 дні" },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 text-center">
                    <Icon size={15} className="text-rose-400" />
                    <span className="text-[10px] font-semibold text-gray-400 leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
