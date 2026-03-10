import Link from "next/link";

export function HealthHero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,_#fdf7ef_0%,_#f6f4ef_45%,_#f0f5f3_100%)]">
      <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(31,107,94,0.3)_0%,_rgba(31,107,94,0)_70%)] blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(201,178,124,0.3)_0%,_rgba(201,178,124,0)_70%)] blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(231,239,234,0.4)_0%,_rgba(231,239,234,0)_70%)] blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-16 lg:pt-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9B27C]/40 bg-white/70 px-4 py-1.5 text-xs font-semibold text-[#8B6B3E] uppercase tracking-[0.18em]">
            Ритуали східної медицини
          </div>
          <h1 className="mt-4 font-heading text-3xl md:text-5xl text-[#0F2D2A] leading-tight">
            Центр «Здоровʼя Сходу»: догляд, що повертає баланс тіла й духу
          </h1>
          <p className="mt-4 text-base md:text-lg text-[#24312E]/80">
            Підбираємо лікувальні чаї, зігріваючі пластирі, масла та ортези за рекомендацією лікарів східної практики. Все для домашніх ритуалів і клінічних протоколів із доставкою 1–3 дні.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#catalog"
              className="rounded-xl bg-[#1F6B5E] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,107,94,0.25)] transition hover:bg-[#0F2D2A]"
              aria-label="Перейти до каталогу лікувальних товарів"
            >
              Перейти до каталогу
            </Link>
            <Link
              href="#guide"
              className="rounded-xl border border-[#C9B27C] px-5 py-3 text-sm font-semibold text-[#8B6B3E] hover:bg-white transition"
              aria-label="Дізнатися більше про гід «Здоровʼя Сходу»"
            >
              Дізнатись більше
            </Link>
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#8B6B3E]">
            Промокод EAST12 · -12% на перший ритуал турботи
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-[#24312E]">
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F6B5E]" />
              Авторські добірки
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C9B27C]" />
              Знижки щотижня
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F6B5E]" />
              Доставка 1–3 дні
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C9B27C]" />
              Поради експертів
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-6 right-8 h-20 w-20 rounded-full border border-[#C9B27C]/40 bg-white/70" />
          <div className="relative rounded-3xl border border-[#E7EFEA] bg-white p-6 shadow-[0_20px_60px_rgba(15,45,42,0.15)]">
            <div className="rounded-2xl bg-[linear-gradient(135deg,_#E7EFEA,_#F6F4EF,_#FFFFFF)] p-6 h-56 flex flex-col justify-between">
              <div className="text-xs font-semibold text-[#8B6B3E] uppercase tracking-[0.18em]">Фокус дня</div>
              <div className="text-2xl font-heading text-[#0F2D2A]">Баланс для всієї родини</div>
              <div className="text-sm text-[#24312E]/70">Вітамінний догляд і ритуали</div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-[#24312E]">
              <div className="flex items-center justify-between rounded-xl border border-[#E7EFEA] px-4 py-3">
                <span>Комплекси для імунітету</span>
                <span className="text-[#1F6B5E] font-semibold">до -20%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#E7EFEA] px-4 py-3">
                <span>Ароматні набори</span>
                <span className="text-[#8B6B3E] font-semibold">Лімітовано</span>
              </div>
            </div>

            <p className="mt-5 text-xs text-[#7A8A84]">
              Ми тестуємо кожен продукт. Ви отримуєте чесні рекомендації та
              зрозумілий сервіс без компромісів.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

