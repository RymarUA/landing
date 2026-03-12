// @ts-nocheck
"use client";
/**
 * components/support-button.tsx
 *
 * Floating support button (bottom-left).
 * Shows a speed-dial with Telegram, Viber, and Instagram links.
 *
 * Contacts are read from lib/site-config.ts — edit there.
 * Hides on /checkout pages to avoid UX clutter.
 */

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Instagram } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { ViberIcon } from "@/components/icons/viber-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";

export function SupportButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Return null while mounting to prevent visual flash
  if (!mounted) return null;

  // Hide on checkout pages
  if (pathname.startsWith("/checkout")) return null;

  const tgLink = siteConfig.telegramUsername
    ? `https://t.me/${siteConfig.telegramUsername}`
    : null;

  const viberLink = siteConfig.viberPhone
    ? `viber://chat?number=${encodeURIComponent(siteConfig.viberPhone)}`
    : null;

  const igLink = siteConfig.instagramUsername
    ? `https://instagram.com/${siteConfig.instagramUsername}`
    : null;

  const items = [
    tgLink && {
      href: tgLink,
      label: "Telegram",
      icon: <TelegramIcon size={20} />,
      bg: "bg-[#29a9eb]",
      shadow: "shadow-[#29a9eb]/40",
    },
    viberLink && {
      href: viberLink,
      label: "Viber",
      icon: <ViberIcon size={20} />,
      bg: "bg-[#7360f2]",
      shadow: "shadow-[#7360f2]/40",
    },
    igLink && {
      href: igLink,
      label: "Instagram",
      icon: <Instagram size={20} />,
      bg: "bg-gradient-to-br from-[#f43f5e] to-[#ec4899]",
      shadow: "shadow-rose-500/40",
    },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
    bg: string;
    shadow: string;
  }>;

  if (items.length === 0) return null;

  return (
    <div className={`fixed bottom-6 left-6 z-50 flex flex-col-reverse items-start gap-3`}>
      {/* Speed-dial items */}
      {open &&
        items.map((item, i) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            title={item.label}
            className={`flex items-center gap-2.5 ${item.bg} text-white rounded-2xl px-4 py-2.5 shadow-lg ${item.shadow}
              hover:scale-105 transition-all duration-200
              animate-in slide-in-from-bottom-2 fade-in`}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
          >
            {item.icon}
            <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>
          </a>
        ))}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрити підтримку" : "Написати нам"}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300
          ${open
            ? "bg-gray-800 rotate-90 shadow-gray-800/40"
            : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/50 hover:scale-110"
          }`}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={24} className="text-white" />
        )}
      </button>
    </div>
  );
}

