import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const infoLinks = [
  { label: "��� ���", href: "/about" },
  { label: "�������� �� ������", href: "#delivery" },
  { label: "����������", href: "#faq" },
  { label: "FAQ", href: "#faq" },
];

export function HealthFooter() {
  const categoryLinks = siteConfig.catalogCategories
    .filter((c) => c !== "��")
    .map((label) => ({ label, href: `/?category=${encodeURIComponent(label)}#catalog` }));

  return (
    <footer className="bg-[#0F2D2A] text-white">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-heading text-xl">������� �����</div>
            <p className="mt-3 text-sm text-white/70">
              ������ �� ���������� ������ ��� ������ ����������. ��������� ������, ���� ���� �� ������� ��� �������.
            </p>
            {siteConfig.phone && (
              <a
                href={`tel:${siteConfig.phone}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C9B27C]"
              >
                {siteConfig.phone}
              </a>
            )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">�������</div>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {categoryLinks.map((c) => (
                <li key={c.label}>
                  <a href={c.href} className="hover:text-white">
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">����������</div>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {infoLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">ϳ�������</div>
            <p className="mt-4 text-sm text-white/70">
              ������������ � ������ ������ �� ������������ ���� ������������.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="#guide" className="text-[#C9B27C] hover:text-white">
                ϳ������ ����
              </Link>
              <Link href="#catalog" className="text-[#C9B27C] hover:text-white">
                ������� �� ��������
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <span>� 2026 ������� �����. �� ����� �������.</span>
          <span>�������� �� ����� � ϳ������� ����� 9:00�21:00</span>
        </div>
      </div>
    </footer>
  );
}

