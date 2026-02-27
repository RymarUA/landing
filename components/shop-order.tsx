"use client";
import { KleapForm } from "@/components/kleap-form";
import { Instagram, Send } from "lucide-react";

export function ShopOrder() {
  return (
    <section id="order" className="bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
            Зв'яжіться з нами
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Оформити замовлення</h2>
          <p className="text-gray-500">Заповніть форму або напишіть нам напряму — відповімо протягом 15 хвилин</p>
        </div>

        {/* Quick contact buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <a
            href="https://www.instagram.com/direct/new/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold px-6 py-3 rounded-2xl shadow hover:scale-105 transition-all duration-200"
          >
            <Instagram size={18} />
            Написати в Direct
          </a>
          <a
            href="https://t.me/your_shop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#229ED9] text-white font-bold px-6 py-3 rounded-2xl shadow hover:scale-105 transition-all duration-200"
          >
            <Send size={18} />
            Відкрити Telegram
          </a>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-400">або заповніть форму</span>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-3xl p-6 md:p-8">
          <KleapForm
            formId="order"
            title="Замовлення товару"
            description="Вкажіть товар та контакти — ми зв'яжемося з вами"
            fields={[
              { name: "name", label: "Ваше ім'я", type: "text", required: true },
              { name: "phone", label: "Номер телефону", type: "tel", required: true },
              { name: "instagram", label: "Instagram нікнейм", type: "text", required: false },
              {
                name: "product",
                label: "Що вас цікавить?",
                type: "select",
                required: true,
                options: ["Жіночі кросівки", "Дитячі іграшки", "Аксесуари для дому", "Аксесуари для авто", "Інше"],
              },
              { name: "size", label: "Розмір (для кросівок)", type: "text", required: false },
              { name: "comment", label: "Коментар або побажання", type: "textarea", required: false },
            ]}
            submitText="Надіслати замовлення"
            successMessage="Дякуємо! Ми зв'яжемося з вами протягом 15 хвилин 🎉"
          />
        </div>
      </div>
    </section>
  );
}
