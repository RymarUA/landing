const testimonials = [
  {
    name: "�����, 47",
    text: "ϳ��� ���� ����� ������������ �������� � ����� � ����������� ��� � ������ ������ ���������. ������� ����� �� �������.",
  },
  {
    name: "�����, 53",
    text: "������� ��� �� ������ �������� ���� �������� ���. �������, �� ����� ������ ����, ����� ���������� ������.",
  },
  {
    name: "������, 39",
    text: "����������� ������� �������� ���, � ������ �� ������� ���� ������� � �����. ����� �� ������������!",
  },
];

export function HealthTestimonials() {
  return (
    <section className="bg-[#F6F4EF] py-14">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B3E]">³�����</p>
          <h2 className="mt-2 font-heading text-2xl md:text-3xl text-[#0F2D2A]">
            ��� �������� ����������
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-[#E7EFEA] bg-white p-6 shadow-[0_10px_30px_rgba(15,45,42,0.08)]"
            >
              <p className="text-sm text-[#24312E]/80 leading-relaxed">�{t.text}�</p>
              <div className="mt-4 text-xs font-semibold text-[#1F6B5E]">{t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

