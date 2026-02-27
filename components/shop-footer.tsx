"use client";
import { Instagram, Send, MapPin, Phone } from "lucide-react";

export function ShopFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-2xl font-black mb-2">
              Shop<span className="text-rose-400">Odessa</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Якісні товари з Китаю з доставкою по всій Україні через Meest Express
            </p>
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
                [ВАШИЙ НОМЕР]
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <div className="font-bold text-sm mb-3 text-gray-300 uppercase tracking-wider">Ми в соцмережах</div>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://t.me/your_shop"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#229ED9] rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Send size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="text-gray-500 text-xs">© 2025 ShopOdessa. Всі права захищені.</div>
          <div className="text-gray-600 text-xs">Доставка по всій Україні · Meest Express</div>
        </div>
      </div>
    </footer>
  );
}
