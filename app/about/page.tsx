// @ts-nocheck
"use client";
import type { ReactElement } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Sparkles,
  Heart,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { ShopFooter } from "@/components/shop-footer";

function OrganizationJsonLd() {
  const sameAs = [
    siteConfig.instagramUsername
      ? `https://www.instagram.com/${siteConfig.instagramUsername}/`
      : null,
    siteConfig.telegramUsername ? `https://t.me/${siteConfig.telegramUsername}` : null,
  ].filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.phone,
      contactType: "customer service",
      availableLanguage: "Ukrainian",
    },
    sameAs,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const stats = [
  { value: "200+", label: "������� � �������" },
  { value: "4.8 / 5", label: "�������� �������" },
  { value: "1�3 ���", label: "�������� �� ������" },
  { value: "95%", label: "��������� �������" },
];

const values: Array<{ icon: ReactElement; title: string; desc: string }> = [
  {
    icon: <ShieldCheck size={26} className="text-[#1F6B5E]" />,
    title: "�������� �����",
    desc: "���������� ����� �� ����, ������ ������������ ���� ������������.",
  },
  {
    icon: <Sparkles size={26} className="text-[#1F6B5E]" />,
    title: "���������� ����������",
    desc: "��������� �� ����� �� ��������� ����� �� ����������.",
  },
  {
    icon: <Truck size={26} className="text-[#1F6B5E]" />,
    title: "������ ��������",
    desc: "³���������� ���������� �������� 24 �����, ����������� 1�3 ���.",
  },
  {
    icon: <Heart size={26} className="text-[#1F6B5E]" />,
    title: "������� ��� �볺���",
    desc: "���������� ������� ���� �� �������� �� ����� �����.",
  },
];

export default function AboutPage() {
  return (
    <>
      <div className="min-h-screen bg-[#F6F4EF] flex flex-col">
        <div className="flex-1">
        <section className="bg-white pt-12 pb-16 px-4 border-b border-[#E7EFEA]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E7EFEA] text-[#1F6B5E] text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            ��� ���
          </div>
          <h1 className="text-4xl md:text-5xl font-heading text-[#0F2D2A] mb-5 leading-tight">
            {siteConfig.name}
          </h1>
          <p className="text-[#7A8A84] text-lg leading-relaxed max-w-2xl mx-auto">
            �� �������� ������� �� ����������� ������, �� ����������� ����������� ������� �������,
            ����� �� ��. �������� � ����������� ��������������� � ���������, �� ��������� ��������������� ����� �������.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-[#1F6B5E]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-white">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold mb-1">{s.value}</div>
              <div className="text-sm text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading text-[#0F2D2A] text-center mb-10">Наші цінності</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="flex gap-4 p-6 bg-[#F6F4EF] rounded-2xl border border-[#E7EFEA]">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[#E7EFEA]">
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#24312E] mb-1">{v.title}</h3>
                  <p className="text-[#7A8A84] text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-[#F6F4EF]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading text-[#0F2D2A] mb-6">���� ������</h2>
          <div className="space-y-4 text-[#7A8A84] leading-relaxed">
            <p>
              ������� ����� ��������, ��� ������� ����� ������� �� ����������� ������ ����������. �� ������ ���������� � ����� � �� ����������
              �������� �� ������������ ������� � � ���������� ���� �� ������� �����, �� ��������� ��� � ��������, ����� �� ��.
            </p>
            <p>
              ��� ����� � ���� ���������� �� ��������. �� ����� ��������� �����, �������� 䳿 �� ���������� ������������, ��� ����� �볺�� �� ������ ���������� � ��������� ������.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading text-[#0F2D2A] mb-8">��������</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {siteConfig.phone && (
              <a href={`tel:${siteConfig.phone}`} className="flex items-center gap-3 p-5 bg-[#F6F4EF] rounded-2xl border border-[#E7EFEA]">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-[#E7EFEA]">
                  <Phone size={18} className="text-[#1F6B5E]" />
                </div>
                <div>
                  <p className="text-xs text-[#7A8A84] font-medium">�������</p>
                  <p className="font-bold text-[#24312E] text-sm">{siteConfig.phone}</p>
                </div>
              </a>
            )}

            <div className="flex items-center gap-3 p-5 bg-[#F6F4EF] rounded-2xl border border-[#E7EFEA]">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-[#E7EFEA]">
                <Clock size={18} className="text-[#1F6B5E]" />
              </div>
              <div>
                <p className="text-xs text-[#7A8A84] font-medium">����� ������</p>
                <p className="font-bold text-[#24312E] text-sm">����, 9:00�21:00</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 bg-[#F6F4EF] rounded-2xl border border-[#E7EFEA]">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-[#E7EFEA]">
                <MapPin size={18} className="text-[#1F6B5E]" />
              </div>
              <div>
                <p className="text-xs text-[#7A8A84] font-medium">�������</p>
                <p className="font-bold text-[#24312E] text-sm">�����, ������</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/#catalog"
              className="inline-flex items-center gap-2 bg-[#1F6B5E] hover:bg-[#0F2D2A] text-white font-bold px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-[#1F6B5E]/20 text-base"
            >
              Перейти в каталог
            </Link>
          </div>
        </div>
        </section>
        </div>
      </div>
      <ShopFooter />
      <OrganizationJsonLd />
    </>
  );
}
