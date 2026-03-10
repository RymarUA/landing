"use client";
/**
 * DiscountPopup — спливає через 15 секунд після заходу на сайт.
 * Показує промокод EAST12 для знижки -12%.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, Tag, Sparkles } from "lucide-react";

const STORAGE_KEY = "fhm_popup_seen";
const PROMO_CODE = "EAST12";
const DELAY_MS = 15_000;

type State = "idle" | "visible";

export function DiscountPopup() {
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");

  const isCheckout = pathname.startsWith("/checkout");

  useEffect(() => {
    if (isCheckout) return;
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

  if (state === "idle") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="h-1.5 bg-gradient-to-r from-[#1F6B5E] via-[#C9B27C] to-[#E7EFEA]" />

        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
          aria-label="Закрити вікно промокоду"
        >
          <X size={15} className="text-gray-500" />
        </button>

        <div className="p-7 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#1F6B5E] to-[#C9B27C] mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-heading text-[#0F2D2A] mb-2">
            Подарунок від «Здоровʼя Сходу»
          </h3>
          <p className="text-[#7A8A84] text-sm mb-5">
            Використайте промокод на перше замовлення та отримайте знижку -12%.
          </p>

          <div className="flex items-center justify-center gap-2 bg-[#F6F4EF] border-2 border-dashed border-[#C9B27C] rounded-2xl px-6 py-4 mb-6">
            <Tag size={18} className="text-[#8B6B3E]" />
            <span className="text-2xl font-black tracking-widest text-[#1F6B5E]">{PROMO_CODE}</span>
          </div>

          <Link
            href="/#catalog"
            onClick={dismiss}
            className="w-full inline-flex items-center justify-center bg-[#1F6B5E] hover:bg-[#0F2D2A] text-white font-bold py-3 rounded-2xl transition-colors"
            aria-label="Перейти до каталогу та використати промокод"
          >
            Перейти до каталогу
          </Link>
        </div>
      </div>
    </div>
  );
}

