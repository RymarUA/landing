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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Категорії</p>
            <h2 className="mt-2 font-heading text-2xl md:text-3xl text-gray-900">
              Оберіть напрям турботи
            </h2>
          </div>
          <a href="#catalog" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Перейти до каталогу →
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="group rounded-2xl border border-emerald-100 bg-emerald-50 p-5 transition hover:shadow-[0_14px_30px_rgba(6,95,70,0.12)] hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white text-2xl flex items-center justify-center border border-emerald-100">
                  {cat.tag}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{cat.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{cat.desc}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-emerald-700">Переглянути всі →</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

