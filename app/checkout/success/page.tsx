"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Instagram, Home, Package, ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { trackPurchase } from "@/components/analytics";

/* ─────────────────────────────────────────────────────────────────────────
   /checkout/success
   WayForPay redirects here after successful payment (returnUrl).
   Query params: ?orderId=<sitniks_order_id>&amount=<total>
   ───────────────────────────────────────────────────────────────────────── */
function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId") ?? "—";
  const amount  = Number(params.get("amount") ?? 0);
  const { items, totalPrice, clearCart } = useCart();

  /* Clear cart + fire analytics Purchase event once per order */
  useEffect(() => {
    const trackKey = `tracked-${orderId}`;
    const hasTracked = typeof window !== "undefined" ? sessionStorage.getItem(trackKey) : null;
    if (hasTracked) return;

    const contents = items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      item_price: i.price,
    }));

    const value = amount > 0 ? amount : totalPrice;

    trackPurchase({
      value,
      currency: "UAH",
      orderId,
      contents,
    });

    clearCart();
    sessionStorage.setItem(trackKey, "true");
  }, [amount, clearCart, items, orderId, totalPrice]);

  const steps = [
    { icon: "✅", label: "Замовлення прийнято" },
    { icon: "💳", label: "Оплата підтверджена" },
    { icon: "📦", label: "Передаємо до відправки" },
    { icon: "🚚", label: "Нова Пошта доставить за 1–3 дні" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">

        {/* ── Success card ── */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Green top bar */}
          <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />

          <div className="p-8 md:p-10 text-center">
            {/* Animated check */}
            <div className="relative inline-flex mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={52} className="text-green-500" strokeWidth={1.5} />
              </div>
              <span className="absolute -top-1 -right-1 text-2xl animate-bounce">🎉</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
              Оплата успішна!
            </h1>
            <p className="text-gray-500 text-sm mb-1">Номер вашого замовлення:</p>
            <div className="inline-block bg-orange-50 border border-orange-100 rounded-2xl px-6 py-2 mb-6">
              <span className="text-2xl font-black text-orange-500 tracking-widest">#{orderId}</span>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Дякуємо за покупку в <strong>FamilyHub Market</strong>! 🎉<br />
              Ми вже обробляємо ваше замовлення. Трек-номер Нової Пошти надійде в найближчий час.
            </p>

            {/* Progress steps */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold ${
                    i <= 1
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-gray-50 text-gray-400 border border-gray-100"
                  }`}
                >
                  <span className="text-base">{step.icon}</span>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <a
                href="https://www.instagram.com/familyhub_market/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5"
              >
                <Instagram size={18} />
                Слідкуйте за оновленнями
                <ArrowRight size={15} />
              </a>

              <Link
                href="/#catalog"
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl transition-colors"
              >
                <Package size={18} />
                Продовжити покупки
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
              >
                <Home size={15} />
                На головну
              </Link>
            </div>
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "📹", label: "Відео\nрозпакування" },
            { icon: "🛡️", label: "30 днів\nгарантія" },
            { icon: "🚚", label: "Нова Пошта\n1–3 дні" },
          ].map((b) => (
            <div key={b.label} className="bg-white rounded-2xl px-3 py-4 shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{b.icon}</div>
              <p className="text-xs font-semibold text-gray-500 whitespace-pre-line leading-snug">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Завантаження…</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
