"use client";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Як відбувається оплата?",
    a: "Оплата при отриманні в будь-якому відділенні Нової Пошти — ви платите лише після того, як переконаєтесь у якості товару. Також можлива передплата на картку.",
  },
  {
    q: "Скільки часу займає доставка?",
    a: "Доставка по Україні займає 1–3 робочі дні після відправки. Ми відправляємо замовлення протягом 24 годин після підтвердження.",
  },
  {
    q: "Чи можна повернути товар?",
    a: "Так, протягом 14 днів з моменту отримання. Умова — товар не був у використанні та збережено оригінальне пакування. Зв'яжіться з нами в Instagram або Facebook для оформлення повернення.",
  },
  {
    q: "Що таке відео розпакування?",
    a: "Ми знімаємо відео кожної посилки при пакуванні та відправці. Так ви можете переконатися, що отримали саме той товар у зазначеній кількості та якості — ніяких сюрпризів!",
  },
  {
    q: "Чи є гарантія на товари?",
    a: "На всі товари надаємо 30-денну гарантію якості. Якщо товар виявився неякісним — ми безкоштовно замінимо його або повернемо гроші.",
  },
  {
    q: "Як дізнатися де знаходиться моя посилка?",
    a: "Після відправки ми надішлемо вам ТТН-номер в Instagram Direct або Facebook Messenger. Також ви можете скористатися нашим трекером на сайті в розділі «Відстеження посилки».",
  },
  {
    q: "Чи можна замовити товар, якого немає в каталозі?",
    a: "Так! Напишіть нам в Instagram або Facebook з описом або фото бажаного товару. Ми знайдемо його у перевірених постачальників і повідомимо про вартість та терміни.",
  },
  {
    q: "Як зв'язатися з вами?",
    a: "Найшвидший спосіб — Instagram Direct (@familyhub_market) або Facebook Messenger. Відповідаємо протягом 15 хвилин щодня з 9:00 до 21:00. Також телефон: +38 (093) 617-41-40.",
  },
];

export function ShopFaq() {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <section id="faq" className="bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-500 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
            <HelpCircle size={14} />
            Запитання та відповіді
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Часті запитання
          </h2>
          <p className="text-gray-500">Не знайшли відповідь? Напишіть нам в Instagram!</p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                open === i
                  ? "border-rose-200 shadow-md shadow-rose-100"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className={`font-semibold text-sm md:text-base transition-colors ${open === i ? "text-rose-600" : "text-gray-900"}`}>
                  {faq.q}
                </span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open === i ? "rotate-180 text-rose-500" : ""}`}
                />
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  open === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-6 pb-5 text-gray-600 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center bg-gradient-to-br from-rose-50 to-amber-50 rounded-3xl p-8 border border-rose-100">
          <p className="text-gray-700 font-semibold mb-4">
            Залишились питання? Ми завжди на зв'язку!
          </p>
          <a
            href="https://www.instagram.com/direct/new/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-rose-200"
          >
            Написати в Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
