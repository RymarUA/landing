// @ts-nocheck
const trustItems = [
  { title: "14+ років досвіду", desc: "Команда лікарів східних практик" },
  { title: "Доставка 1–3 дні", desc: "По всій Україні без затримок" },
  { title: "Супровід 24/7", desc: "Персональний контакт з куратором" },
  { title: "Сертифіковані продукти", desc: "Офіційні імпортери та клініки" },
];

export function HealthTrust() {
  return (
    <section className="bg-gradient-to-br from-amber-50 to-emerald-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-emerald-100 bg-white/80 backdrop-blur-sm p-5 shadow-[0_10px_25px_rgba(6,95,70,0.08)] hover:shadow-[0_20px_40px_rgba(6,95,70,0.12)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                {`0${i + 1}`}
              </div>
              <h3 className="mt-3 text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-xs text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

