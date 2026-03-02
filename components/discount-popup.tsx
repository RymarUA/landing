"use client";
/**
 * DiscountPopup — появляется через 15 секунд после захода на сайт.
 * Предлагает -10% на первый заказ за подписку на email.
 *
 * Логика:
 *   - Показывается только один раз (localStorage "fhm_popup_seen")
 *   - Не показывается на /checkout и /checkout/success
 *   - После подписки — зеленый экран успеха с промокодом FIRST10
 *   - Можно закрыть крестиком (тоже ставит флаг "seen")
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Mail, Tag, Loader2, CheckCircle } from "lucide-react";

const STORAGE_KEY = "fhm_popup_seen";
const PROMO_CODE  = "FIRST10";
const DELAY_MS    = 15_000;

type State = "idle" | "visible" | "loading" | "success";

export function DiscountPopup() {
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");
  const [email, setEmail]  = useState("");
  const [error, setError]  = useState("");

  /* Don't show on checkout pages */
  const isCheckout = pathname.startsWith("/checkout");

  useEffect(() => {
    if (isCheckout) return;

    /* Already shown once — never show again */
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setState("visible"), DELAY_MS);
    return () => clearTimeout(timer);
  }, [isCheckout]);

  const dismiss = () => {
    setState("idle");
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setState("success");
        /* Mark as seen so popup doesn't reappear */
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, "1");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Помилка. Спробуйте ще раз.");
        setState("visible");
      }
    } catch {
      setError("Помилка мережі. Спробуйте ще раз.");
      setState("visible");
    }
  };

  if (state === "idle") return null;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Popup card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-400" />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
          aria-label="Закрити"
        >
          <X size={15} className="text-gray-500" />
        </button>

        {state === "success" ? (
          /* ── Success state ── */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Дякуємо! 🎉</h3>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Ваш промокод на <strong>−10%</strong> від першого замовлення:
            </p>
            <div className="flex items-center justify-center gap-2 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl px-6 py-4 mb-5">
              <Tag size={18} className="text-amber-500" />
              <span className="text-2xl font-black tracking-widest text-amber-600">{PROMO_CODE}</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Введіть код при оформленні замовлення або напишіть нам в Instagram.
            </p>
            <button
              onClick={dismiss}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition-colors"
            >
              Перейти до каталогу
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="p-7">
            {/* Emoji accent */}
            <div className="text-4xl mb-4">🎁</div>

            <h3 className="text-xl font-black text-gray-900 mb-1.5 leading-tight">
              Отримай <span className="text-orange-500">–10%</span><br />
              на перше замовлення!
            </h3>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Підпишіться на розсилку та отримайте промокод одразу на email. Без спаму — лише знижки та новинки.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="your@email.com"
                  required
                  disabled={state === "loading"}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-60"
                />
              </div>

              {error && (
                <p className="text-xs text-orange-500 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-orange-200"
              >
                {state === "loading" ? (
                  <><Loader2 size={16} className="animate-spin" /> Завантаження…</>
                ) : (
                  <>Отримати знижку −10% 🎁</>
                )}
              </button>

              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
              >
                Ні дякую, хочу платити повну ціну
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
