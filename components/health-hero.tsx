// @ts-nocheck
import Link from "next/link";

export function HealthHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(6,95,70,0.15)_0%,_rgba(6,95,70,0)_70%)] blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.15)_0%,_rgba(212,175,55,0)_70%)] blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-50/40 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-16 lg:pt-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-white/70 px-4 py-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-[0.18em]">
            Ритуали східної медицини
          </div>
          <h1 className="mt-4 font-heading text-3xl md:text-5xl text-gray-900 leading-tight">
            Центр «Здоровʼя Сходу»: догляд, що повертає баланс тіла й духу
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-700">
            Підбираємо лікувальні чаї, зігріваючі пластирі, масла та ортези за рекомендацією лікарів східної практики. Все для домашніх ритуалів і клінічних протоколів із доставкою 1–3 дні.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#catalog"
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(6,95,70,0.25)] transition hover:bg-emerald-800"
              aria-label="Перейти до каталогу лікувальних товарів"
            >
              Перейти до каталогу
            </Link>
            <Link
              href="#guide"
              className="rounded-xl border border-[#D4AF37] px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-white transition"
              aria-label="Дізнатися більше про гід «Здоровʼя Сходу»"
            >
              Дізнатись більше
            </Link>
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
            Промокод EAST12 · -12% на перший ритуал турботи
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-gray-900">
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Авторські добірки
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
              Знижки щотижня
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Доставка 1–3 дні
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
              Поради експертів
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-6 right-8 h-20 w-20 rounded-full border border-[#D4AF37]/40 bg-white/70" />
          <div className="relative rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_rgba(6,95,70,0.15)]">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-6 h-56 flex flex-col justify-between">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-[0.18em]">Фокус дня</div>
              <div className="text-2xl font-heading text-gray-900">Баланс для всієї родини</div>
              <div className="text-sm text-gray-600">Вітамінний догляд і ритуали</div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-gray-900">
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 px-4 py-3">
                <span>Комплекси для імунітету</span>
                <span className="text-emerald-700 font-semibold">до -20%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 px-4 py-3">
                <span>Ароматні набори</span>
                <span className="text-[#D4AF37] font-semibold">Лімітовано</span>
              </div>
            </div>

            <p className="mt-5 text-xs text-gray-500">
              Ми тестуємо кожен продукт. Ви отримуєте чесні рекомендації та
              зрозумілий сервіс без компромісів.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

