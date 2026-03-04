"use client";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { faqData } from "@/lib/faq-data";

/* ─── FAQ Schema.org JSON-LD ──────────────────────────────────── */
function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ShopFaq() {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <section id="faq" className="bg-white py-16 px-4">
      <FaqJsonLd />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-500 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
            <HelpCircle size={14} />
            Запитання та відповіді
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Часті запитання
          </h2>
          <p className="text-gray-500">Не знайшли відповідь? Напишіть нам в Instagram!</p>
        </div>

        <div className="space-y-3">
          {faqData.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                open === i
                  ? "border-orange-200 shadow-md shadow-orange-100"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className={`font-semibold text-sm md:text-base transition-colors ${open === i ? "text-orange-600" : "text-gray-900"}`}>
                  {faq.q}
                </span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open === i ? "rotate-180 text-orange-500" : ""}`}
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
        <div className="mt-10 text-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 border border-orange-100">
          <p className="text-gray-700 font-semibold mb-4">
            Залишились питання? Ми завжди на зв'язку!
          </p>
          <a
            href="https://www.instagram.com/direct/new/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-orange-200"
          >
            Написати в Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
