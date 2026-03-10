const steps = [
  {
    title: "������ �������",
    desc: "���� � ��������, ������� � ��, ���������� ���� ������ � �� ����� ������� � ������.",
  },
  {
    title: "ϳ������ ������",
    desc: "�������, ������, ����� �� �������� � �������� ������� ������.",
  },
  {
    title: "��������� ������������",
    desc: "ϳ������� �����, ����� ������������ �� ��������.",
  },
];

export function HealthGuide() {
  return (
    <section id="guide" className="bg-white py-14">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B3E]">ϳ���</p>
            <h2 className="mt-2 font-heading text-2xl md:text-3xl text-[#0F2D2A]">
              �� ������� ����
            </h2>
          </div>
          <p className="max-w-xl text-sm text-[#7A8A84]">
            �� ���������� ������ ���������� ������� � ����������� ��������,
            ������� ����� �� �������� ������.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-[#E7EFEA] bg-[#F6F4EF] p-6"
            >
              <div className="text-xs font-semibold text-[#C9B27C]">0{index + 1}</div>
              <h3 className="mt-3 text-lg font-semibold text-[#24312E]">{step.title}</h3>
              <p className="mt-2 text-sm text-[#7A8A84]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

