const trustItems = [
  { title: "����������� ������", desc: "�������� �����" },
  { title: "�������� 1�3 ��", desc: "���� �����" },
  { title: "������ ���� ������", desc: "�������� �������" },
  { title: "ϳ��� �� ����������", desc: "������������" },
];

export function HealthTrust() {
  return (
    <section className="bg-[#F6F4EF] py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#E7EFEA] bg-white p-5 shadow-[0_10px_25px_rgba(15,45,42,0.08)]"
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

