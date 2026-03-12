// @ts-nocheck
const steps = [
  {
    title: "Оберіть напрям",
    desc: "Знайдіть у каталозі товари для себе, родини чи дому, щоб сформувати власний ритуал турботи.",
  },
  {
    title: "Отримайте рекомендації",
    desc: "Читати гіди, відгуки та поради експертів, щоб впевнено оновлювати полички.",
  },
  {
    title: "Замовляйте без очікування",
    desc: "Додавайте у кошик, оформлюйте доставку та насолоджуйтеся сервісом 24/7.",
  },
];

export function HealthGuide() {
  return (
    <section id="guide" className="bg-white py-14">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Гід</p>
            <h2 className="mt-2 font-heading text-2xl md:text-3xl text-gray-900">
              Як ми працюємо для вас
            </h2>
          </div>
          <p className="max-w-xl text-sm text-gray-600">
            Ми надихаємо родини вибудовувати сталі звички турботи та підбираємо товари, які справді приємно використовувати.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative rounded-2xl border border-emerald-100 bg-gradient-to-br from-white/90 to-emerald-50/90 backdrop-blur-sm p-6 shadow-[0_8px_20px_rgba(6,95,70,0.06)] hover:shadow-[0_16px_32px_rgba(6,95,70,0.12)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-700 to-[#D4AF37] flex items-center justify-center text-white font-bold text-sm shadow-lg">
                0{index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-700 to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

