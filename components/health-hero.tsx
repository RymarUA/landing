import Link from "next/link";

export function HealthHero() {
  return (
    <section className="relative overflow-hidden bg-[#F6F4EF]">
      <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(31,107,94,0.25)_0%,_rgba(31,107,94,0)_70%)]" />
      <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(201,178,124,0.25)_0%,_rgba(201,178,124,0)_70%)]" />

      <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-16 lg:pt-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9B27C]/40 bg-white/70 px-4 py-1.5 text-xs font-semibold text-[#8B6B3E] uppercase tracking-[0.18em]">
            ������� �����
          </div>
          <h1 className="mt-4 font-heading text-3xl md:text-5xl text-[#0F2D2A] leading-tight">
            ̒��� ���������� �������, ����� �� ��
          </h1>
          <p className="mt-4 text-base md:text-lg text-[#24312E]/80">
            ������ �������� �� ������������ ������ � �����: �������, ������,
            ��������, ��� � �����. ��������� ������, �������� ����� �� ������
            �������� �� �����.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#catalog"
              className="rounded-xl bg-[#1F6B5E] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(31,107,94,0.25)] transition hover:bg-[#0F2D2A]"
            >
              ������� �� ��������
            </Link>
            <Link
              href="#guide"
              className="rounded-xl border border-[#C9B27C] px-5 py-3 text-sm font-semibold text-[#8B6B3E] hover:bg-white transition"
            >
              ϳ������ ����
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-[#24312E]">
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F6B5E]" />
              ����������� ������
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C9B27C]" />
              ������ ���� ������
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F6B5E]" />
              �������� 1�3 ��
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C9B27C]" />
              ϳ��� �� �������
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-6 right-8 h-20 w-20 rounded-full border border-[#C9B27C]/40 bg-white/70" />
          <div className="relative rounded-3xl border border-[#E7EFEA] bg-white p-6 shadow-[0_20px_60px_rgba(15,45,42,0.15)]">
            <div className="rounded-2xl bg-[linear-gradient(135deg,_#E7EFEA,_#F6F4EF,_#FFFFFF)] p-6 h-56 flex flex-col justify-between">
              <div className="text-xs font-semibold text-[#8B6B3E] uppercase tracking-[0.18em]">��������</div>
              <div className="text-2xl font-heading text-[#0F2D2A]">������� �� �����</div>
              <div className="text-sm text-[#24312E]/70">������� � ������ � ���</div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-[#24312E]">
              <div className="flex items-center justify-between rounded-xl border border-[#E7EFEA] px-4 py-3">
                <span>���������� ���������� ����</span>
                <span className="text-[#1F6B5E] font-semibold">�� -20%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#E7EFEA] px-4 py-3">
                <span>��������� ���������</span>
                <span className="text-[#8B6B3E] font-semibold">���������</span>
              </div>
            </div>

            <p className="mt-5 text-xs text-[#7A8A84]">
              �� � ��������� �������. �� ��������� �������� � ������ ��
              ���������.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

