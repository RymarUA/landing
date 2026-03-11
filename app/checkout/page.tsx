// @ts-nocheck
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, ChevronLeft, Loader2,
  CreditCard, ExternalLink, MapPin,
  Tag, Check, Banknote
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { checkoutSchema, applyPromoCode } from "@/lib/checkout-schema";
import { useSavedAddresses } from "@/lib/use-saved-addresses";
import { trackInitiateCheckout } from "@/components/analytics";

/* ─── API Helpers (вынесены наружу для чистоты) ─── */
const fetchNPCities = async (query: string) => {
  const res = await fetch("/api/novaposhta", {
    method: "POST",
    body: JSON.stringify({
      modelName: "Address",
      calledMethod: "getCities",
      methodProperties: { FindByString: query, Limit: "20" },
    }),
  });
  const json = await res.json();
  return json.success ? json.data : [];
};

const fetchNPWarehouses = async (cityRef: string, query: string) => {
  const res = await fetch("/api/novaposhta", {
    method: "POST",
    body: JSON.stringify({
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: { CityRef: cityRef, FindByString: query, Limit: "50" },
    }),
  });
  const json = await res.json();
  return json.success ? json.data : [];
};

/* ─── Field wrapper ─── */
function Field({ label, error, children }: { label: string; error?: any; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-sm font-semibold text-[#24312E]">{label}</label>
      {children}
      {error && <p className="text-xs text-[#1F6B5E] font-medium mt-0.5">{error}</p>}
    </div>
  );
}

/* ─── Screens (Empty/Redirect) ─── */
function EmptyCartScreen() {
  return (
    <div className="min-h-screen bg-[#F6F4EF] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-[#E7EFEA] rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} className="text-[#7A8A84]" />
        </div>
        <h1 className="text-2xl font-black text-[#0F2D2A] mb-2">Кошик порожній</h1>
        <p className="text-[#7A8A84] mb-8 text-sm">Додайте товари до кошика, щоб перейти до оплати.</p>
        <Link href="/#catalog" className="inline-flex items-center justify-center gap-2 bg-[#1F6B5E] text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-[#0F2D2A] transition-colors shadow-lg">
          <ShoppingCart size={18} /> До каталогу
        </Link>
      </div>
    </div>
  );
}

function RedirectingScreen() {
  return (
    <div className="min-h-screen bg-[#F6F4EF] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-[#F6F4EF] rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 size={40} className="text-[#1F6B5E] animate-spin" />
        </div>
        <h1 className="text-2xl font-black text-[#0F2D2A] mb-2">Замовлення створено!</h1>
        <p className="text-[#7A8A84] text-sm leading-relaxed">Перенаправляємо вас на сторінку оплати WayForPay…</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#7A8A84]">
          <ExternalLink size={13} /> secure.wayforpay.com
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function CheckoutPage() {
  const { items, totalCount, totalPrice } = useCart();
  const { saved: savedAddress, save: saveAddress, hydrated: addressHydrated } = useSavedAddresses();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<{ discountPct: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod" | "card">("online");

  // Состояние Новой Почты
  const [cities, setCities] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedCityRef, setSelectedCityRef] = useState<string>("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [showCityResults, setShowCityResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const sessionId = useRef<string>("");
  const abandonedRegistered = useRef(false);
  const lastRegisteredPhone = useRef<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({ 
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "online"
    }
  });

  const nameValue = watch("name") ?? "";
  const phoneValue = watch("phone") ?? "";
  const cityValue = watch("city") ?? "";

  const discountAmount = promoResult ? Math.round(totalPrice * promoResult.discountPct / 100) : 0;
  const finalPrice = totalPrice - discountAmount;

  useEffect(() => {
    setMounted(true);
    sessionId.current = crypto.randomUUID();
  }, []);

  // Поиск города
  const onCitySearch = (val: string) => {
    if (val.length < 2) {
      setCities([]);
      setShowCityResults(false);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    const timeoutId = setTimeout(async () => {
      setLoadingCities(true);
      const data = await fetchNPCities(val);
      setCities(data);
      setShowCityResults(true);
      setLoadingCities(false);
    }, 400);

    searchTimeout.current = timeoutId;
  };

  // Выбор города
  const onCitySelect = async (city: any) => {
    setSelectedCityRef(city.Ref);
    setValue("city", city.Description, { shouldValidate: true });
    setShowCityResults(false);
    
    setLoadingWarehouses(true);
    const data = await fetchNPWarehouses(city.Ref, "");
    setWarehouses(data);
    setLoadingWarehouses(false);
  };

  const registerAbandonedCart = useCallback(
    async (name: string, phone: string) => {
      if (!phone || items.length === 0 || lastRegisteredPhone.current === phone) return;
      lastRegisteredPhone.current = phone;
      try {
        await fetch("/api/abandoned-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId.current,
            name: name || "—",
            phone,
            items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
            totalPrice,
          }),
        });
      } catch (error) {
        console.error("[abandoned-cart] Failed to register:", error);
      }
    },
    [items, totalPrice]
  );

  const cancelAbandonedCart = useCallback(async () => {
    if (!abandonedRegistered.current) return;
    try {
      await fetch("/api/abandoned-cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current }),
      });
    } catch (error) {
      console.error("[abandoned-cart] Failed to cancel:", error);
    }
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    setServerError(null);
    trackInitiateCheckout({ value: totalPrice, numItems: totalCount });

    try {
      await cancelAbandonedCart();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          paymentMethod,
          promoCode: promoResult ? promoInput.trim().toUpperCase() : undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          totalPrice: finalPrice,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Помилка");

      saveAddress({ city: data.city, warehouse: data.warehouse, cityRef: selectedCityRef });

      if (paymentMethod === "cod") {
        window.location.href = `/checkout/success?ref=${json.orderReference}&method=cod`;
        return;
      }

      setRedirecting(true);
      setTimeout(() => { window.location.href = json.paymentUrl; }, 800);
    } catch (err: any) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  if (!mounted) return null;
  if (totalCount === 0) return <EmptyCartScreen />;
  if (redirecting) return <RedirectingScreen />;

  return (
    <div className="min-h-screen bg-[#F6F4EF] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#7A8A84] hover:text-[#24312E] mb-6 transition-colors">
          <ChevronLeft size={16} /> Назад до магазину
        </Link>

        <h1 className="text-3xl font-black text-[#0F2D2A] mb-8 flex items-center gap-3">
          Оформлення замовлення
          <span className="text-sm font-semibold bg-[#E7EFEA] text-[#1F6B5E] px-3 py-1 rounded-full">{totalCount}</span>
        </h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT: FORM */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              
              {/* 1. Contacts */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#E7EFEA] p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-[#E7EFEA] rounded-full flex items-center justify-center text-xs font-black text-[#1F6B5E]">1</div>
                  <h2 className="text-lg font-black text-[#0F2D2A]">Контактні дані</h2>
                </div>
                <Field label="Ваше ім'я *" error={errors.name?.message}>
                  <input {...register("name")} placeholder="Наприклад: Олена Коваль" className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition" />
                </Field>
                <Field label="Телефон *" error={errors.phone?.message}>
                  <input {...register("phone")} onBlur={() => registerAbandonedCart(nameValue, phoneValue)} placeholder="+380..." className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition" />
                </Field>
              </div>

              {/* 2. Delivery */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#E7EFEA] p-6 flex flex-col gap-5 overflow-visible">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-[#E7EFEA] rounded-full flex items-center justify-center text-xs font-black text-[#1F6B5E]">2</div>
                  <h2 className="text-lg font-black text-[#0F2D2A]">Доставка Новою Поштою</h2>
                </div>

                {addressHydrated && savedAddress && (
                  <button
                    type="button"
                    onClick={async () => {
                      setValue("city", savedAddress.city, { shouldValidate: true });
                      setValue("warehouse", savedAddress.warehouse, { shouldValidate: true });
                      if (savedAddress.cityRef) {
                        setSelectedCityRef(savedAddress.cityRef);
                        setLoadingWarehouses(true);
                        const list = await fetchNPWarehouses(savedAddress.cityRef, "");
                        setWarehouses(list);
                        setLoadingWarehouses(false);
                      }
                    }}
                    className="flex items-center gap-2 text-sm font-semibold text-[#1F6B5E] hover:text-[#0F2D2A]"
                  >
                    <MapPin size={16} />
                    Використати збережену адресу
                  </button>
                )}

                {/* City Search */}
                <Field label="Місто *" error={errors.city?.message}>
                  <div className="relative">
                    <input
                      value={cityValue}
                      placeholder="Почніть вводити назву міста..."
                      autoComplete="off"
                      onChange={(e) => {
                        const v = e.target.value;
                        setValue("city", v, { shouldValidate: true });
                        onCitySearch(v);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition"
                    />
                    {loadingCities && <Loader2 className="absolute right-3 top-3 animate-spin text-[#1F6B5E]" size={18} />}
                    
                    {showCityResults && cities.length > 0 && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-[#E7EFEA] rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                        {cities.map((city) => (
                          <div 
                            key={city.Ref} 
                            onClick={() => onCitySelect(city)} 
                            className="px-4 py-3 hover:bg-[#F6F4EF] cursor-pointer text-sm border-b border-[#E7EFEA] last:border-none transition-colors flex items-center gap-2"
                          >
                            <MapPin size={14} className="text-[#7A8A84]" />
                            {city.Description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                {/* Quick cities */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-[#7A8A84] w-full">Швидкі міста:</span>
                  {(["Київ", "Одеса", "Харків", "Дніпро", "Львів"] as const).map((cityName) => (
                    <button
                      key={cityName}
                      type="button"
                      onClick={async () => {
                        setValue("city", cityName, { shouldValidate: true });
                        setShowCityResults(false);
                        setLoadingCities(true);
                        const data = await fetchNPCities(cityName);
                        setCities(data);
                        const exact = data.find((c: any) => c.Description === cityName || c.Description?.startsWith(cityName));
                        if (exact) {
                          setSelectedCityRef(exact.Ref);
                          setLoadingWarehouses(true);
                          const list = await fetchNPWarehouses(exact.Ref, "");
                          setWarehouses(list);
                          setLoadingWarehouses(false);
                        }
                        setLoadingCities(false);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[#E7EFEA] text-sm font-medium text-[#24312E] hover:border-[#C9B27C]/50 hover:text-[#1F6B5E] transition-colors"
                    >
                      {cityName}
                    </button>
                  ))}
                </div>

                {/* Warehouse Select */}
                <Field label="Відділення або поштомат *" error={errors.warehouse?.message}>
                  <div className="relative">
                    <select
                      {...register("warehouse")}
                      disabled={!selectedCityRef || loadingWarehouses}
                      className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] bg-white text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none disabled:bg-[#F6F4EF] transition appearance-none cursor-pointer"
                    >
                      <option value="">{loadingWarehouses ? "Завантаження..." : "Оберіть відділення"}</option>
                      {warehouses.map((wh) => (
                        <option key={wh.Ref} value={wh.Description}>{wh.Description}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#7A8A84]">▼</div>
                  </div>
                </Field>
              </div>

              {/* 3. Payment method */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#E7EFEA] p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-[#E7EFEA] rounded-full flex items-center justify-center text-xs font-black text-[#1F6B5E]">3</div>
                  <h2 className="text-lg font-black text-[#0F2D2A]">Спосіб оплати</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "online" as const, label: "Онлайн-оплата", sublabel: "WayForPay — Visa/MC", icon: <CreditCard size={20} /> },
                    { value: "cod"    as const, label: "Накладений платіж", sublabel: "Оплата при отриманні", icon: <Banknote size={20} /> },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all ${
                        paymentMethod === opt.value
                          ? "border-[#1F6B5E] bg-[#F6F4EF]"
                          : "border-[#E7EFEA] hover:border-[#C9B27C]/50"
                      }`}
                    >
                      <div className={`flex items-center gap-2 font-bold text-sm ${paymentMethod === opt.value ? "text-[#1F6B5E]" : "text-[#24312E]"}`}>
                        {opt.icon}
                        {opt.label}
                        {paymentMethod === opt.value && <Check size={14} className="ml-auto text-[#1F6B5E]" />}
                      </div>
                      <span className="text-xs text-[#7A8A84] ml-7">{opt.sublabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Promo code */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#E7EFEA] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-[#E7EFEA] rounded-full flex items-center justify-center text-xs font-black text-[#1F6B5E]">4</div>
                  <h2 className="text-lg font-black text-[#0F2D2A]">Промокод</h2>
                </div>
                {promoResult ? (
                  <div className="flex items-center justify-between bg-[#E7EFEA] border border-[#C9B27C]/40 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 text-[#1F6B5E] font-bold text-sm">
                      <Check size={16} />
                      <span>{promoInput.toUpperCase()}</span>
                      <span className="text-[#1F6B5E] text-xs font-medium">— {promoResult.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPromoResult(null); setPromoInput(""); setPromoError(""); }}
                      className="text-xs text-[#7A8A84] hover:text-red-500 transition-colors"
                    >
                      Скасувати
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8A84]" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        placeholder="EAST12 або FIRST10"
                        maxLength={32}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const result = applyPromoCode(promoInput);
                        if (result) { setPromoResult(result); setPromoError(""); }
                        else setPromoError("Промокод не знайдено або вже використано");
                      }}
                      className="px-4 py-3 bg-[#1F6B5E] hover:bg-[#0F2D2A] text-white font-bold rounded-xl text-sm transition-colors whitespace-nowrap"
                    >
                      Застосувати
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-500 font-medium mt-2">{promoError}</p>}
              </div>

              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">⚠️ {serverError}</div>
              )}

              <button type="submit" disabled={submitting} className="flex items-center justify-center gap-3 bg-[#1F6B5E] hover:bg-[#0F2D2A] disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                {submitting ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    {paymentMethod === "online" ? <CreditCard size={20} /> : <Banknote size={20} />}
                    {paymentMethod === "online" ? "Оплатити" : "Замовити"} {finalPrice.toLocaleString()} грн
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-[#E7EFEA] p-6 sticky top-24">
              <h2 className="text-base font-black text-[#0F2D2A] mb-4">Ваше замовлення</h2>
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto mb-5 scrollbar-thin">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size ?? ""}`} className="flex items-center gap-3 group">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-[#E7EFEA]">
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0F2D2A] truncate">{item.name}</p>
                      <p className="text-xs text-[#7A8A84]">× {item.quantity}</p>
                    </div>
                    <div className="text-sm font-semibold text-[#0F2D2A]">{(item.price * item.quantity).toLocaleString()} грн</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E7EFEA] pt-4 space-y-2">
                <div className="flex justify-between text-sm text-[#7A8A84]"><span>Доставка</span><span className="text-[#1F6B5E] font-semibold">За тарифами НП</span></div>
                {discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-[#7A8A84]">
                      <span>Товари</span><span>{totalPrice.toLocaleString()} грн</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#1F6B5E] font-semibold">
                      <span>Знижка ({promoResult?.discountPct}%)</span>
                      <span>−{discountAmount.toLocaleString()} грн</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center"><span className="font-semibold text-[#0F2D2A]">До оплати:</span><span className="text-xl font-semibold text-[#1F6B5E]">{finalPrice.toLocaleString()} грн</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


