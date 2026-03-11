// @ts-nocheck
const categories = [
  { title: "Чаї та настої", desc: "Лікувальні чаї, матча, травʼяні суміші для балансу", tag: "🍵" },
  { title: "Зігріваючі пластирі", desc: "Пластирі для спини, колін та суглобів із травами", tag: "🌿" },
  { title: "Ароматерапія", desc: "Дифузори, ефірні масла та аромасвічки", tag: "🕯️" },
  { title: "Ортези та підтримка", desc: "Ортези, бандажі та масажні інструменти", tag: "🧘" },
  { title: "Масла і бальзами", desc: "Масажні масла, бальзами для шкіри та мʼязів", tag: "💆" },
  { title: "Подарункові сети", desc: "Готові набори для ритуалів турботи", tag: "🎁" },
];

export function HealthCategories() {
  return (
    <section className="bg-white py-14" id="categories">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B3E]">Категорії</p>
            <h2 className="mt-2 font-heading text-2xl md:text-3xl text-[#0F2D2A]">
              Оберіть напрям турботи
            </h2>
          </div>
          <a href="#catalog" className="text-sm font-semibold text-[#1F6B5E] hover:text-[#0F2D2A]">
            Перейти до каталогу →
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="group rounded-2xl border border-[#E7EFEA] bg-[#F6F4EF] p-5 transition hover:shadow-[0_14px_30px_rgba(15,45,42,0.12)] hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white text-2xl flex items-center justify-center border border-[#E7EFEA]">
                  {cat.tag}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#24312E]">{cat.title}</h3>
                  <p className="text-xs text-[#7A8A84] mt-1">{cat.desc}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-[#8B6B3E]">Переглянути всі →</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

