import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Video,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Star,
  Package,
  Users,
  Heart,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Про нас — FamilyHub Market",
  description:
    "FamilyHub Market — інтернет-магазин якісних товарів для всієї родини. Одяг, іграшки, аксесуари з доставкою Новою Поштою по всій Україні. Відео розпакування кожного замовлення.",
  openGraph: {
    title: "Про нас — FamilyHub Market",
    description:
      "Якісні товари для всієї родини. Доставка по Україні. Відео розпакування.",
    type: "website",
  },
  alternates: { canonical: "/about" },
};

/* ─── Organization JSON-LD ───────────────────────────────── */
function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FamilyHub Market",
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.phone,
      contactType: "customer service",
      availableLanguage: "Ukrainian",
    },
    sameAs: [
      `https://www.instagram.com/${siteConfig.instagramUsername}/`,
      `https://www.facebook.com/familyhubmarketod`,
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const stats = [
  { icon: <Package size={24} />, value: "2 000+", label: "задоволених замовлень" },
  { icon: <Star size={24} />,    value: "4.9 / 5", label: "середній рейтинг" },
  { icon: <Users size={24} />,   value: "1 500+", label: "постійних клієнтів" },
  { icon: <Heart size={24} />,   value: "100%", label: "відео розпакування" },
];

const values = [
  {
    icon: <ShieldCheck size={28} className="text-orange-500" />,
    title: "Гарантія якості",
    desc: "Кожен товар перевіряємо перед відправкою. 30-денна гарантія на все.",
  },
  {
    icon: <Video size={28} className="text-orange-500" />,
    title: "Відео розпакування",
    desc: "Знімаємо кожну посилку при пакуванні — ви бачите, що отримаєте.",
  },
  {
    icon: <Truck size={28} className="text-orange-500" />,
    title: "Швидка доставка",
    desc: "Відправляємо протягом 24 годин. Доставка 1–3 дні по всій Україні.",
  },
  {
    icon: <RotateCcw size={28} className="text-orange-500" />,
    title: "Повернення 14 днів",
    desc: "Якщо товар не підійшов — повернемо гроші без зайвих запитань.",
  },
];

export default function AboutPage() {
  return (
    <>
      <OrganizationJsonLd />
      <main className="min-h-screen bg-[#fdf6f0]">

        {/* ── Hero ── */}
        <section className="bg-white pt-12 pb-16 px-4 border-b border-gray-100">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-500 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              Про нас
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight">
              FamilyHub<span className="text-orange-500">Market</span>
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
              Ми — команда з Одеси, яка з 2022 року допомагає українським родинам купувати якісні
              товари за доступними цінами. Одяг, іграшки, товари для дому та авто — все з перевірених
              постачальників і з доставкою прямо до вашого відділення Нової Пошти.
            </p>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-12 px-4 bg-orange-500">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center text-white">
                <div className="flex justify-center mb-2 opacity-80">{s.icon}</div>
                <div className="text-3xl font-black mb-1">{s.value}</div>
                <div className="text-sm text-orange-100">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Our values ── */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 text-center mb-10">
              Наші цінності
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="flex gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Story ── */}
        <section className="py-16 px-4 bg-[#fdf6f0]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-6">Наша історія</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                FamilyHub Market розпочав роботу як невеликий Instagram-магазин у 2022 році.
                Ми побачили, що люди витрачають багато часу на пошук якісних товарів за справедливою
                ціною, і вирішили спростити цей процес.
              </p>
              <p>
                Сьогодні ми — повноцінний онлайн-магазин з широким асортиментом: від жіночого та
                чоловічого одягу до дитячих іграшок, товарів для дому та автомобільних аксесуарів.
                Працюємо з перевіреними постачальниками, які гарантують якість кожного товару.
              </p>
              <p>
                Ми першими в нашій ніші впровадили відео розпакування кожної посилки. Це означає,
                що ви завжди знаєте, що саме відправлено у вашому замовленні, ще до того, як
                отримаєте його у відділенні Нової Пошти.
              </p>
            </div>
          </div>
        </section>

        {/* ── Contacts ── */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Контакти</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <a
                href={`tel:${siteConfig.phone}`}
                className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors group"
              >
                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Phone size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Телефон</p>
                  <p className="font-bold text-gray-900 text-sm">{siteConfig.phone}</p>
                </div>
              </a>

              <a
                href="mailto:info@familyhubmarket.ua"
                className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors group"
              >
                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Mail size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="font-bold text-gray-900 text-sm">info@familyhubmarket.ua</p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Місто</p>
                  <p className="font-bold text-gray-900 text-sm">Одеса, Україна</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Phone size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Режим роботи</p>
                  <p className="font-bold text-gray-900 text-sm">Пн–Нд, 9:00–21:00</p>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3">
              <a
                href={`https://www.instagram.com/${siteConfig.instagramUsername}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold px-5 py-3 rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-rose-200"
              >
                <Instagram size={18} /> Instagram
              </a>
              <a
                href="https://www.facebook.com/familyhubmarketod"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold px-5 py-3 rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-blue-200"
              >
                <Facebook size={18} /> Facebook
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Готові зробити замовлення?
            </h2>
            <p className="text-gray-500 mb-8">
              Перегляньте наш каталог та знайдіть товари для всієї родини.
            </p>
            <Link
              href="/#catalog"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-orange-200 text-base"
            >
              Перейти до каталогу →
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
