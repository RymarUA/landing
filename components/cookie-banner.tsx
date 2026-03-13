// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { Cookie, X, Check, Settings } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-isomorphic";

const STORAGE_KEY = "fhm_cookie_consent";

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  ts: number;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [consent, setConsent] = useLocalStorage<CookieConsent | null>(STORAGE_KEY, null);

  useEffect(() => {
    if (!consent) {
      // Small delay so it doesn't pop up immediately
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, [consent]);

  const accept = (all: boolean) => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: all || analytics,
      marketing: all || marketing,
      ts: Date.now()
    };
    setConsent(newConsent);
    setVisible(false);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[70] p-4 pointer-events-none ${!visible ? 'invisible' : ''}`}>
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Main row */}
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie size={20} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm mb-1">Ми використовуємо файли cookie</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Ми використовуємо cookie для покращення роботи сайту та аналізу трафіку.{" "}
                  <a href="#" className="text-orange-400 hover:text-orange-300 underline">
                    Детальніше
                  </a>
                </p>
              </div>
              <button
                onClick={() => accept(false)}
                className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Закрити"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Expandable details */}
            {showDetails && (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                {/* Necessary — always on */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-semibold">Необхідні</p>
                    <p className="text-gray-500 text-xs">Потрібні для роботи сайту</p>
                  </div>
                  <div className="w-10 h-5 bg-orange-500 rounded-full flex items-center justify-end px-0.5 opacity-60 cursor-not-allowed">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-semibold">Аналітика</p>
                    <p className="text-gray-500 text-xs">Google Analytics, статистика відвідувань</p>
                  </div>
                  <button
                    onClick={() => setAnalytics((v) => !v)}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${analytics ? "bg-orange-500 justify-end" : "bg-gray-700 justify-start"}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-semibold">Маркетинг</p>
                    <p className="text-gray-500 text-xs">Facebook Pixel, персоналізована реклама</p>
                  </div>
                  <button
                    onClick={() => setMarketing((v) => !v)}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${marketing ? "bg-orange-500 justify-end" : "bg-gray-700 justify-start"}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={() => accept(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <Check size={14} />
                Прийняти всі
              </button>
              <button
                onClick={() => accept(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                Тільки необхідні
              </button>
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="sm:w-auto flex items-center justify-center gap-1.5 text-gray-400 hover:text-white text-xs py-2.5 px-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Settings size={13} />
                {showDetails ? "Сховати" : "Налаштування"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

