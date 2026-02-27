"use client";
import { Instagram, Send, Facebook, MapPin, Phone } from "lucide-react";  // ← добавь Facebook в импорт

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
            <p className="text-gray-400 text-sm leading-relaxed">
              Якісні та ексклюзивні товари з Китаю з доставкою по всій Україні
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
                +380936174140
              </div>
            </div>
          </div>

          {/* Social — добавляем Facebook */}
          <div>
            <div className="font-bold text-sm mb-3 text-gray-300 uppercase tracking-wider">Ми в соцмережах</div>
            <div className="flex gap-4">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/familyhub_market/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md hover:shadow-rose-500/50"
              >
                <Instagram size={22} />
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/familyhubmarket"  // ← твоя страница Facebook
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-md hover:shadow-blue-500/50"
              >
                <Facebook size={22} />
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