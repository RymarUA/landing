"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Instagram, Home } from "lucide-react";
import { useCart } from "@/components/cart-context";

/* ─────────────────────────────────────────────────────────────────────────
   /checkout/success
   WayForPay redirects here after a successful payment (returnUrl).
   Query param: ?orderId=<sitniks_order_id>
   ───────────────────────────────────────────────────────────────────────── */
function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId") ?? "—";
  const { clearCart } = useCart();

  // Clear cart once — user has successfully paid
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">

        {/* Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={52} className="text-green-500" />
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-black text-gray-900 mb-2">Оплата успішна!</h1>
        <p className="text-gray-500 text-sm mb-1">Номер вашого замовлення:</p>
        <p className="text-3xl font-black text-rose-500 tracking-widest mb-6">#{orderId}</p>

        {/* Info */}
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          Дякуємо за покупку в FamilyHub Market! 🎉
          <br />
          Ми вже обробляємо ваше замовлення та незабаром зв'яжемося з вами для підтвердження доставки.
          <br className="hidden sm:block" />
          Слідкуйте за оновленнями в нашому Instagram.
        </p>

        {/* Actions */}
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
            <Home size={18} />
            Повернутись до магазину
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
