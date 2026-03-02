"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  CheckCircle,
  ChevronLeft,
  Trash2,
  CreditCard,
  Banknote,
  Loader2,
  Instagram,
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { checkoutSchema, type CheckoutFormData } from "@/lib/checkout-schema";

/* ─────────────────────────────────────────────
   Field wrapper with label + error message
   ───────────────────────────────────────────── */
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
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Checkout Page
   ───────────────────────────────────────────── */
export default function CheckoutPage() {
  const { items, totalCount, totalPrice, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // If cart is empty after successful order or initially, show empty state
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod" },
  });

  const paymentMethod = watch("paymentMethod");

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

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Помилка оформлення замовлення");
      }

      setOrderId(json.orderId);
      clearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Сталася помилка. Спробуйте ще раз.";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={44} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Замовлення прийнято!</h1>
          <p className="text-gray-500 mb-1">Номер замовлення:</p>
          <p className="text-2xl font-black text-rose-500 tracking-widest mb-6">#{orderId}</p>
          <p className="text-gray-600 text-sm leading-relaxed mb-8">
            Наш менеджер зв'яжеться з вами найближчим часом для підтвердження замовлення.
            Слідкуйте за оновленнями в Instagram!
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://www.instagram.com/familyhub_market/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity"
            >
              <Instagram size={18} />
              Наш Instagram
            </a>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors"
            >
              Повернутись до магазину
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Empty cart screen ── */
  if (mounted && totalCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart size={40} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Кошик порожній</h1>
          <p className="text-gray-500 mb-8">Додайте товари до кошика, щоб оформити замовлення.</p>
          <Link
            href="/#catalog"
            className="flex items-center justify-center gap-2 bg-rose-500 text-white font-bold py-3.5 rounded-2xl hover:bg-rose-600 transition-colors"
          >
            <ShoppingCart size={18} />
            До каталогу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ChevronLeft size={16} />
          Повернутись до магазину
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-8">Оформлення замовлення</h1>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ─── Left: Form ──────────────────────── */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

              {/* Contact info */}
              <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-5">
                <h2 className="text-lg font-black text-gray-900">Контактні дані</h2>

                <Field label="Ваше ім'я *" error={errors.name?.message}>
                  <input
                    {...register("name")}
                    placeholder="Наприклад: Олена Коваль"
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
                    placeholder="Додаткові побажання (необов'язково)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition hover:border-gray-300 resize-none"
                  />
                </Field>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-4">
                <h2 className="text-lg font-black text-gray-900">Спосіб оплати</h2>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "cod", icon: <Banknote size={20} />, label: "Накладений платіж", desc: "Оплата при отриманні" },
                    { value: "prepay", icon: <CreditCard size={20} />, label: "Передоплата", desc: "Картою або переказом" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("paymentMethod", opt.value as "cod" | "prepay")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${
                        paymentMethod === opt.value
                          ? "border-rose-500 bg-rose-50 text-rose-600"
                          : "border-gray-200 text-gray-600 hover:border-rose-200"
                      }`}
                    >
                      {opt.icon}
                      <span className="text-sm font-bold leading-tight">{opt.label}</span>
                      <span className="text-xs text-gray-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                {errors.paymentMethod && (
                  <p className="text-xs text-rose-500 font-medium">{errors.paymentMethod.message}</p>
                )}
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
                    Оформлюємо...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Оформити замовлення
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Натискаючи кнопку, ви погоджуєтесь з умовами доставки та оплати.
              </p>
            </form>
          </div>

          {/* ─── Right: Order Summary ─────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-black text-gray-900 mb-5">
                Ваше замовлення{" "}
                <span className="text-rose-500">({totalCount} {totalCount === 1 ? "товар" : "товари"})</span>
              </h2>

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
                      <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">× {item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-black text-gray-900">
                        {(item.price * item.quantity).toLocaleString("uk-UA")} грн
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-rose-500 transition-colors"
                        title="Видалити"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Доставка</span>
                  <span className="text-green-600 font-semibold">Безкоштовно*</span>
                </div>
                <div className="flex items-center justify-between text-xl font-black text-gray-900">
                  <span>Разом:</span>
                  <span className="text-rose-500">{totalPrice.toLocaleString("uk-UA")} грн</span>
                </div>
                <p className="text-xs text-gray-400">* Доставка оплачується за тарифами Нової Пошти</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
