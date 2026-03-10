const categories = [
  { title: "Спортивное питание", desc: "Продукты для спортсменов и активного образа жизни", tag: "С" },
  { title: "Товары для дома", desc: "Косметика и бытовая техника для дома", tag: "Д" },
  { title: "Косметика", desc: "Качественная косметика, парфюмерия, уход", tag: "К" },
  { title: "Для детей", desc: "Товары для детей и младенцев", tag: "Д" },
  { title: "Электроника", desc: "Гаджеты и электроника для дома", tag: "Э" },
  { title: "Одежда", desc: "Модная одежда и аксессуары", tag: "О" },
];

export function HealthCategories() {
  return (
    <section className="bg-white py-14" id="categories">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B3E]">Категории</p>
            <h2 className="mt-2 font-heading text-2xl md:text-3xl text-[#0F2D2A]">
              Выберите категорию товаров
            </h2>
          </div>
          <a href="#catalog" className="text-sm font-semibold text-[#1F6B5E] hover:text-[#0F2D2A]">
            Перейти в каталог {'>'}
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="group rounded-2xl border border-[#E7EFEA] bg-[#F6F4EF] p-5 transition hover:shadow-[0_14px_30px_rgba(15,45,42,0.12)] hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white text-[#1F6B5E] font-semibold flex items-center justify-center border border-[#E7EFEA]">
                  {cat.tag}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#24312E]">{cat.title}</h3>
                  <p className="text-xs text-[#7A8A84] mt-1">{cat.desc}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-[#8B6B3E]">Смотреть все {'>'}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

