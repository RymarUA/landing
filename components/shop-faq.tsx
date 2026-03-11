// @ts-nocheck
"use client";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { faqData } from "@/lib/faq-data";

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
          <div className="inline-flex items-center gap-2 bg-[#E7EFEA] text-[#1F6B5E] text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
            <HelpCircle size={14} />
            Питання та відповіді
          </div>
          <h2 className="text-3xl md:text-4xl font-heading text-[#0F2D2A] mb-2">
            Часті запитання
          </h2>
          <p className="text-[#7A8A84]">
            Не знайшли відповідь? Напишіть нам у месенджер або зателефонуйте.
          </p>
        </div>

        <div className="space-y-3">
          {faqData.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                open === i
                  ? "border-[#C9B27C]/60 shadow-[0_10px_24px_rgba(15,45,42,0.12)]"
                  : "border-[#E7EFEA] hover:border-[#C9B27C]/50"
              }`}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className={`font-semibold text-sm md:text-base transition-colors ${open === i ? "text-[#1F6B5E]" : "text-[#24312E]"}`}>
                  {faq.q}
                </span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-[#7A8A84] transition-transform duration-200 ${open === i ? "rotate-180 text-[#1F6B5E]" : ""}`}
                />
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  open === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-6 pb-5 text-[#7A8A84] text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center bg-[#F6F4EF] rounded-3xl p-8 border border-[#E7EFEA]">
          <p className="text-[#24312E] font-semibold mb-4">
            Потрібна допомога з вибором? Ми завжди на звʼязку.
          </p>
          <a
            href="#guide"
            className="inline-flex items-center gap-2 bg-[#1F6B5E] hover:bg-[#0F2D2A] text-white font-bold px-8 py-3.5 rounded-2xl transition-colors"
            aria-label="Дізнатися більше про гід"
          >
            Підібрати засіб
          </a>
        </div>
      </div>
    </section>
  );
}

