"use client";
import { Instagram, Facebook, MapPin, Phone } from "lucide-react";

// TikTok SVG icon
function TikTokIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/>
    </svg>
  );
}

export function ShopFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-2xl font-black mb-2">
              FamilyHub<span className="text-rose-400">Market</span>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="font-bold text-sm mb-3 text-gray-300 uppercase tracking-wider">Контакти</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin size={14} className="text-rose-400" />
                Одеса, Україна
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone size={14} className="text-rose-400" />
                +380936174140
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <div className="font-bold text-sm mb-3 text-gray-300 uppercase tracking-wider">Ми в соцмережах</div>
            <div className="flex gap-3">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/familyhub_market/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md hover:shadow-rose-500/50"
                title="Instagram"
              >
                <Instagram size={22} />
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/familyhubmarketod"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md hover:shadow-blue-500/50"
                title="Facebook"
              >
                <Facebook size={22} />
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@familyhub_market"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md hover:shadow-gray-500/50"
                title="TikTok"
              >
                <TikTokIcon size={22} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="text-gray-600 text-xs">© 2026 FamilyHub Market. Всі права захищені.</div>
          <div className="text-gray-600 text-xs">Доставка по всій Україні</div>
        </div>
      </div>
    </footer>
  );
}
