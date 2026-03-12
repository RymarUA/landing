// @ts-nocheck
const testimonials = [
  {
    name: "Олена, 47 років",
    text: "Пластирі для спини з програми «Здоровʼя Сходу» зняли напругу за кілька днів. Корисні рекомендації та турбота кураторів відчуваються в кожній деталі.",
  },
  {
    name: "Ігор, 53 роки",
    text: "Після консультації підібрали набір чаїв та ортез для коліна. Відчуваю себе впевнено й знаю, що можу звернутися по пораду будь-якої миті.",
  },
  {
    name: "Марія, 39 років",
    text: "Ароматерапія та масла з каталогу допомогли налагодити сон і ритуали вдома. Дуже ціную увагу до деталей і швидку доставку.",
  },
];

export function HealthTestimonials() {
  return (
    <section className="bg-gradient-to-br from-emerald-50 to-amber-50 py-14">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Відгуки</p>
          <h2 className="mt-2 font-heading text-2xl md:text-3xl text-gray-900">
            Нам довіряють родини по всій Україні
          </h2>
          <p className="mt-3 text-sm text-gray-600 max-w-2xl mx-auto">
            Реальні історії клієнтів, які знайшли баланс завдяки східній медицині
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="group relative rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur-sm p-6 shadow-[0_10px_30px_rgba(6,95,70,0.08)] hover:shadow-[0_20px_40px_rgba(6,95,70,0.15)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-700 to-[#D4AF37] flex items-center justify-center text-white font-bold shadow-lg">
                {i + 1}
              </div>
              <div className="text-4xl text-[#D4AF37] mb-3 opacity-30">&ldquo;</div>
              <p className="text-sm text-gray-700 leading-relaxed italic">{t.text}</p>
              <div className="mt-5 pt-4 border-t border-emerald-100">
                <div className="text-sm font-semibold text-emerald-700">{t.name}</div>
                <div className="mt-1 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[#D4AF37]">★</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

