// @ts-nocheck
"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Instagram, Home, Package, ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { trackPurchase } from "@/components/analytics";
import { siteConfig } from "@/lib/site-config";
import { ShopFooter } from "@/components/shop-footer";

/* ─────────────────────────────────────────────────────────────────────────
   /checkout/success
   WayForPay redirects here after successful payment (returnUrl).
   Query params: ?orderId=<sitniks_order_id>&amount=<total>
   ───────────────────────────────────────────────────────────────────────── */
function SuccessContent() {
  const params = useSearchParams();
  
  // Try multiple parameter names that WayForPay might send
  const orderNumber = params.get("ref") || params.get("orderReference") || params.get("orderNo") || "—";
  const paymentMethod = params.get("method") ?? "online";
  const amount = Number(params.get("amount") ?? 0);
  
  // Debug: log all received parameters
  if (typeof window !== "undefined") {
    console.log("[Checkout Success] All URL params:", Object.fromEntries(params.entries()));
  }
  
  const { items, totalPrice, clearCart } = useCart();
  
  const isCOD = paymentMethod === "cod";

  /* Clear cart + fire analytics Purchase event once per order */
  useEffect(() => {
    const trackKey = `tracked-${orderNumber}`;
    const hasTracked = typeof window !== "undefined" ? sessionStorage.getItem(trackKey) : null;
    if (hasTracked) return;

    // Only track if we have a valid order number (not the default "—")
    if (orderNumber === "—") {
      console.warn("[Checkout Success] No valid order number found, skipping analytics");
      return;
    }

    const contents = items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      item_price: i.price,
    }));

    const value = amount > 0 ? amount : totalPrice;

    console.log("[Checkout Success] Tracking purchase:", { orderNumber, value, contents });

    trackPurchase({
      value,
      currency: "UAH",
      orderId: orderNumber,
      contents,
    });

    clearCart();
    sessionStorage.setItem(trackKey, "true");
    
    // Fallback: Try to update order status if webhook didn't work
    if (paymentMethod === "online" && orderNumber !== "—") {
      setTimeout(async () => {
        try {
          console.log("[Checkout Success] Checking payment status as fallback...");
          const response = await fetch("/api/admin/update-payment-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ""}`
            },
            body: JSON.stringify({ orderReference: orderNumber })
          });
          
          if (response.ok) {
            console.log("[Checkout Success] Fallback status update completed");
          } else {
            console.log("[Checkout Success] Fallback status update failed:", response.status);
          }
        } catch (error) {
          console.error("[Checkout Success] Fallback status update error:", error);
        }
      }, 5000); // Wait 5 seconds to let webhook try first
    }
  }, [amount, clearCart, items, orderNumber, totalPrice, paymentMethod]);

  const steps = isCOD ? [
    { icon: "✅", label: "Замовлення прийнято", active: true },
    { icon: "💰", label: "Оплата при отриманні", active: true },
    { icon: "�", label: "Передаємо до відправки", active: false },
    { icon: "🚚", label: "Нова Пошта доставить за 1–3 дні", active: false },
  ] : [
    { icon: "✅", label: "Замовлення прийнято", active: true },
    { icon: "�💳", label: "Оплата підтверджена", active: true },
    { icon: "📦", label: "Передаємо до відправки", active: false },
    { icon: "🚚", label: "Нова Пошта доставить за 1–3 дні", active: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F4EF] to-[#E7EFEA] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">

        {/* ── Success card ── */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Green top bar */}
          <div className="h-2 bg-gradient-to-r from-[#1F6B5E] to-[#0F2D2A]" />

          <div className="p-8 md:p-10 text-center">
            {/* Animated check */}
            <div className="relative inline-flex mb-6">
              <div className="w-24 h-24 bg-[#E7EFEA] rounded-full flex items-center justify-center">
                <CheckCircle size={52} className="text-[#1F6B5E]" strokeWidth={1.5} />
              </div>
              <span className="absolute -top-1 -right-1 text-2xl animate-bounce">🎉</span>
            </div>

            {/* Success message */}
            <h1 className="text-2xl md:text-3xl font-black text-[#0F2D2A] mb-2">
              {isCOD ? "Замовлення прийнято!" : "Оплата успішна!"}
            </h1>

            {/* Order number */}
            <p className="text-[#7A8A84] text-sm mb-1">Номер вашого замовлення:</p>
            <div className="inline-block bg-[#F6F4EF] border border-[#C9B27C]/40 rounded-2xl px-6 py-2 mb-6">
              <span className="text-2xl font-black text-[#1F6B5E] tracking-widest">#{orderNumber}</span>
            </div>

            <p className="text-[#24312E] text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Дякуємо за покупку в <strong>{siteConfig.name}</strong>! 🎉<br />
              Ми вже обробляємо ваше замовлення. Трек-номер Нової Пошти надійде в найближчий час.
            </p>

            {/* Progress steps */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold ${
                    step.active
                      ? "bg-[#E7EFEA] text-[#1F6B5E] border border-[#C9B27C]/40"
                      : "bg-[#F6F4EF] text-[#7A8A84] border border-[#E7EFEA]"
                  }`}
                >
                  <span className="text-base">{step.icon}</span>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {siteConfig.instagramUsername && (
                <a
                  href={`https://www.instagram.com/${siteConfig.instagramUsername}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#1F6B5E] hover:bg-[#0F2D2A] text-white font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-[#1F6B5E]/20 hover:shadow-[#1F6B5E]/30 hover:-translate-y-0.5"
                >
                  <Instagram size={18} />
                  Слідкуйте за оновленнями
                  <ArrowRight size={15} />
                </a>
              )}

              <Link
                href="/#catalog"
                className="flex items-center justify-center gap-2 bg-[#E7EFEA] hover:bg-[#C9B27C]/20 text-[#24312E] font-bold py-3.5 rounded-2xl transition-colors"
              >
                <Package size={18} />
                Продовжити покупки
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-[#7A8A84] hover:text-[#24312E] text-sm font-medium transition-colors"
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
            <div key={b.label} className="bg-white rounded-2xl px-3 py-4 shadow-sm border border-[#E7EFEA]">
              <div className="text-2xl mb-1">{b.icon}</div>
              <p className="text-xs font-semibold text-[#7A8A84] whitespace-pre-line leading-snug">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
      <ShopFooter />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F6F4EF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-[#C9B27C]/60 border-t-[#1F6B5E] animate-spin" />
          <p className="text-[#7A8A84] text-sm font-medium">Завантаження…</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}


