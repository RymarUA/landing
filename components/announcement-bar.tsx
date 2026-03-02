"use client";
import { useState } from "react";
import { X, Copy, Check } from "lucide-react";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const PROMO = "FAMILY15";

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMO).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white text-sm font-semibold py-2.5 px-4 text-center">
      {/* Marquee text on mobile, static on desktop */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span className="text-amber-100">🔥</span>
        <span>
          Акція до <strong>31 березня</strong>: -15% на весь одяг!
        </span>
        <span className="hidden sm:inline text-amber-100">Промокод:</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-black px-3 py-0.5 rounded-lg text-xs tracking-widest transition-colors"
        >
          {PROMO}
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
        {copied && <span className="text-amber-100 text-xs">Скопійовано!</span>}
      </div>

      {/* Close */}
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-md transition-colors"
        aria-label="Закрити"
      >
        <X size={14} />
      </button>
    </div>
  );
}
