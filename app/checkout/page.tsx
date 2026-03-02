"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, ChevronLeft, Trash2, Loader2,
  CreditCard, ExternalLink, Shield, Truck, Video, Search, MapPin
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { checkoutSchema, type CheckoutFormData } from "@/lib/checkout-schema";
import { useSavedAddresses } from "@/lib/use-saved-addresses";
import { trackInitiateCheckout } from "@/components/analytics";
import type { CheckoutResponseSuccess, CheckoutResponseError } from "@/lib/types";

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
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-orange-500 font-medium mt-0.5">{error}</p>}
    </div>
  );
}

/* ─── Screens (Empty/Redirect) ─── */
function EmptyCartScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={40} className="text-gray-300" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Кошик порожній</h1>
        <p className="text-gray-500 mb-8 text-sm">Додайте товари до кошика, щоб перейти до оплати.</p>
        <Link href="/#catalog" className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-orange-600 transition-colors shadow-lg">
          <ShoppingCart size={18} /> До каталогу
        </Link>
      </div>
    </div>
  );
}

function RedirectingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 size={40} className="text-orange-500 animate-spin" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Замовлення створено!</h1>
        <p className="text-gray-500 text-sm leading-relaxed">Перенаправляємо вас на сторінку оплати WayForPay…</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ExternalLink size={13} /> secure.wayforpay.com
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function CheckoutPage() {
  const { items, totalCount, totalPrice, removeItem } = useCart();
  const { saved: savedAddress, save: saveAddress, hydrated: addressHydrated } = useSavedAddresses();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Состояние Новой Почты
  const [cities, setCities] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedCityRef, setSelectedCityRef] = useState<string>("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [showCityResults, setShowCityResults] = useState(false);

  const sessionId = useRef<string>("");
  const abandonedRegistered = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue, // ИЗВЛЕКАЕМ setValue
    formState: { errors },
  } = useForm<CheckoutFormData>({ resolver: zodResolver(checkoutSchema) });

  const nameValue = watch("name") ?? "";
  const phoneValue = watch("phone") ?? "";
  const cityValue = watch("city") ?? "";

  useEffect(() => {
    setMounted(true);
    sessionId.current = crypto.randomUUID();
  }, []);

  // Поиск города
  const onCitySearch = async (val: string) => {
    if (val.length < 2) {
      setCities([]);
      setShowCityResults(false);
      return;
    }
    setLoadingCities(true);
    const data = await fetchNPCities(val);
    setCities(data);
    setShowCityResults(true);
    setLoadingCities(false);
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
      if (abandonedRegistered.current || !phone || items.length === 0) return;
      abandonedRegistered.current = true;
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
      } catch {}
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
    } catch {}
  }, []);

  const onSubmit = async (data: CheckoutFormData) => {
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
          items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          totalPrice,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Помилка");

      saveAddress({ city: data.city, warehouse: data.warehouse, cityRef: selectedCityRef });

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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
          <ChevronLeft size={16} /> Назад до магазину
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
          Оформлення замовлення
          <span className="text-sm font-semibold bg-orange-100 text-orange-600 px-3 py-1 rounded-full">{totalCount}</span>
        </h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT: FORM */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              
              {/* 1. Contacts */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-xs font-black text-orange-600">1</div>
                  <h2 className="text-lg font-black text-gray-900">Контактні дані</h2>
                </div>
                <Field label="Ваше ім'я *" error={errors.name?.message}>
                  <input {...register("name")} placeholder="Наприклад: Олена Коваль" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 outline-none transition" />
                </Field>
                <Field label="Телефон *" error={errors.phone?.message}>
                  <input {...register("phone")} onBlur={() => registerAbandonedCart(nameValue, phoneValue)} placeholder="+380..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 outline-none transition" />
                </Field>
              </div>

              {/* 2. Delivery */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5 overflow-visible">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-xs font-black text-orange-600">2</div>
                  <h2 className="text-lg font-black text-gray-900">Доставка Новою Поштою</h2>
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
                    className="flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 outline-none transition"
                    />
                    {loadingCities && <Loader2 className="absolute right-3 top-3 animate-spin text-orange-500" size={18} />}
                    
                    {showCityResults && cities.length > 0 && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                        {cities.map((city) => (
                          <div 
                            key={city.Ref} 
                            onClick={() => onCitySelect(city)} 
                            className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-50 last:border-none transition-colors flex items-center gap-2"
                          >
                            <MapPin size={14} className="text-gray-400" />
                            {city.Description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                {/* Warehouse Select */}
                <Field label="Відділення або поштомат *" error={errors.warehouse?.message}>
                  <div className="relative">
                    <select
                      {...register("warehouse")}
                      disabled={!selectedCityRef || loadingWarehouses}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-gray-50 transition appearance-none cursor-pointer"
                    >
                      <option value="">{loadingWarehouses ? "Завантаження..." : "Оберіть відділення"}</option>
                      {warehouses.map((wh) => (
                        <option key={wh.Ref} value={wh.Description}>{wh.Description}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                  </div>
                </Field>
              </div>

              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">⚠️ {serverError}</div>
              )}

              <button type="submit" disabled={submitting} className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <><CreditCard size={20} /> Оплатити {totalPrice.toLocaleString()} грн</>}
              </button>
            </form>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-base font-black text-gray-900 mb-4">Ваше замовлення</h2>
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto mb-5 scrollbar-thin">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size ?? ""}`} className="flex items-center gap-3 group">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">× {item.quantity}</p>
                    </div>
                    <div className="text-sm font-black text-gray-900">{(item.price * item.quantity).toLocaleString()} грн</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500"><span>Доставка</span><span className="text-green-600 font-semibold">За тарифами НП</span></div>
                <div className="flex justify-between items-center"><span className="font-black text-gray-900">Разом:</span><span className="text-xl font-black text-orange-500">{totalPrice.toLocaleString()} грн</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}