const trustItems = [
  { title: "14+ років досвіду", desc: "Команда лікарів східних практик" },
  { title: "Доставка 1–3 дні", desc: "По всій Україні без затримок" },
  { title: "Супровід 24/7", desc: "Персональний контакт з куратором" },
  { title: "Сертифіковані продукти", desc: "Офіційні імпортери та клініки" },
];

export function HealthTrust() {
  return (
    <section className="bg-[radial-gradient(circle_at_80%_20%,_#f6f4ef_0%,_#fdf7ef_100%)] py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#E7EFEA] bg-white/80 backdrop-blur-sm p-5 shadow-[0_10px_25px_rgba(15,45,42,0.08)] hover:shadow-[0_20px_40px_rgba(15,45,42,0.12)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#8B6B3E]">
                <span className="h-2 w-2 rounded-full bg-[#C9B27C]" />
                {`0${i + 1}`}
              </div>
              <h3 className="mt-3 text-base font-semibold text-[#24312E]">{item.title}</h3>
              <p className="mt-1 text-xs text-[#7A8A84]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

