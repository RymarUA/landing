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

/* ─── Viber icon (no lucide equivalent) ─── */
function ViberIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.993 0C5.951 0 1.004 4.762 1.004 10.621c0 3.336 1.636 6.3 4.186 8.282V22.5l3.804-2.09c.921.254 1.9.392 2.91.392C18.045 20.802 23 16.04 23 10.18 23 4.762 18.044 0 11.993 0zm1.21 14.186c-.254.064-.506.096-.76.096-1.623 0-3.02-.87-3.815-2.17a4.43 4.43 0 0 1-.635-2.312c0-2.455 2-4.44 4.46-4.44s4.46 1.985 4.46 4.44a4.41 4.41 0 0 1-3.71 4.386zm.048-7.41a2.936 2.936 0 0 0-2.945 2.924 2.936 2.936 0 0 0 2.945 2.924 2.936 2.936 0 0 0 2.945-2.924 2.936 2.936 0 0 0-2.945-2.924zm0 4.49a1.573 1.573 0 0 1-1.575-1.566c0-.864.705-1.566 1.575-1.566s1.575.702 1.575 1.566a1.573 1.573 0 0 1-1.575 1.566z" />
    </svg>
  );
}

/* ─── Telegram icon ─── */
function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
    </svg>
  );
}

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

