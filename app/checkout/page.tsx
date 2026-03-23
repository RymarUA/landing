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
  Check, Banknote, Package
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { checkoutSchema } from "@/lib/checkout-schema";
import { useSavedAddresses } from "@/lib/use-saved-addresses";
import { isValidUkrainianPhone, normalizePhone } from "@/lib/phone-utils";
import { trackInitiateCheckout } from "@/components/analytics";
import { cachedFetchNPCities, cachedFetchNPWarehouses } from "@/lib/novaposhta-cache";
import { Field } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input";
import { ShopFooter } from "@/components/shop-footer";
import { Minus, Plus, Trash2 } from "lucide-react";

/* ─── Screens (Empty/Redirect) ─── */
function EmptyCartScreen() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white hover:bg-gray-100 transition-colors"
              aria-label="Повернутися на головну"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-2xl font-black text-gray-900">Кошик</h1>
          </div>

          <div className="text-center py-10 bg-white rounded-3xl shadow-sm">
            <ShoppingCart size={64} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-500 mb-2">Кошик порожній</h2>
            <p className="text-gray-400 mb-6">Додайте товари з каталогу</p>
            <Link
              href="/#catalog"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
            >
              Перейти до каталогу
            </Link>
          </div>
        </div>
      </div>
      <ShopFooter />
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
  const { items, totalCount, totalPrice, updateQuantity, removeItem, totalSavings } = useCart();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { saved: savedAddress, save: saveAddress, hydrated: addressHydrated } = useSavedAddresses();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showAccountSuggestion, setShowAccountSuggestion] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod" | "card">("online");

  // Промокод состояние
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState<{ discountPct: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState("");

  const applyPromoCode = (code: string): { discountPct: number; label: string } | null => {
    const upperCode = code.toUpperCase().trim();
    
    switch (upperCode) {
      case "EAST12":
        return { discountPct: 12, label: "Easter Sale" };
      case "FIRST10":
        return { discountPct: 10, label: "First Order" };
      case "WELCOME15":
        return { discountPct: 15, label: "Welcome" };
      case "SPECIAL20":
        return { discountPct: 20, label: "Special" };
      default:
        return null;
    }
  };

  // Состояние Новой Почты
  const [cities, setCities] = useState<NPCity[]>([]);
  const [warehouses, setWarehouses] = useState<NPWarehouse[]>([]);
  const [selectedCityRef, setSelectedCityRef] = useState<string>("");
  const [selectedWarehouseRef, setSelectedWarehouseRef] = useState<string>("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [showCityResults, setShowCityResults] = useState(false);
  const [citySearchError, setCitySearchError] = useState<string>("");
  const [warehouseError, setWarehouseError] = useState<string>("");
  const [warehouseValue, setWarehouseValue] = useState("");
  const [showWarehouseResults, setShowWarehouseResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const currentSearchId = useRef<number>(0);

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

  // Register paymentMethod field
  useEffect(() => {
    setValue("paymentMethod", paymentMethod);
  }, [paymentMethod, setValue]);

  const nameValue = watch("name") ?? "";
  const surnameValue = watch("surname") ?? "";
  const phoneValue = watch("phone") ?? "";
  const cityValue = watch("city") ?? "";

  const promoDiscountAmount = promoResult ? Math.round(totalPrice * promoResult.discountPct / 100) : 0;
  const onlinePaymentDiscount = paymentMethod === "online" ? Math.round((totalPrice - promoDiscountAmount) * 0.05) : 0;
  const totalDiscountAmount = promoDiscountAmount + onlinePaymentDiscount;
  const finalPrice = totalPrice - totalDiscountAmount;

  useEffect(() => {
    setMounted(true);
    sessionId.current = crypto.randomUUID();
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Закрытие выпадающих списков при клике вне поля
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Закрыть список городов если клик вне поля поиска
      if (!target.closest('[data-city-search]')) {
        setShowCityResults(false);
      }
      
      // Закрыть список отделений если клик вне поля поиска
      if (!target.closest('[data-warehouse-search]')) {
        setShowWarehouseResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Поиск города
  const onCitySearch = useCallback((val: string) => {
    if (val.length < 2) {
      setCities([]);
      setShowCityResults(false);
      setCitySearchError("");
      
      // Если поле города очищено, сбрасываем отделение
      if (val.length === 0) {
        setSelectedCityRef("");
        setWarehouseValue("");
        setShowWarehouseResults(false);
        setWarehouseError("");
        setValue("warehouse", "", { shouldValidate: true });
        setSelectedWarehouseRef("");
        setWarehouses([]);
      }
      
      return;
    }

    // Cancel previous search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }

    const searchId = ++currentSearchId.current;
    
    const timeoutId = setTimeout(async () => {
      setLoadingCities(true);
      setCitySearchError("");
      
      // Create new abort controller for this request
      const controller = new AbortController();
      abortController.current = controller;
      
      try {
        const data = await cachedFetchNPCities(val);
        
        // Check if this is still the current search
        if (searchId === currentSearchId.current && !controller.signal.aborted) {
          setCities(data);
          setShowCityResults(true);
          if (data.length === 0) {
            setCitySearchError("Міста не знайдено");
          }
        }
      } catch (error) {
        // Check if this is still the current search and not aborted
        if (searchId === currentSearchId.current && !controller.signal.aborted) {
          console.error("[checkout] City search error:", error);
          setCitySearchError("Помилка пошуку міста");
          setCities([]);
          setShowCityResults(false);
        }
      } finally {
        // Only update loading state if this is still the current search
        if (searchId === currentSearchId.current) {
          setLoadingCities(false);
        }
      }
    }, 400);

    searchTimeout.current = timeoutId;
  }, [setValue]);

  // Выбор города
  const onCitySelect = useCallback(async (city: NPCity) => {
    setSelectedCityRef(city.Ref);
    setValue("city", city.Description, { shouldValidate: true });
    setShowCityResults(false);
    setCitySearchError("");
    
    // Сбрасываем поле поиска отделений
    setWarehouseValue("");
    setShowWarehouseResults(false);
    setWarehouseError("");
    setValue("warehouse", "", { shouldValidate: true });
    setSelectedWarehouseRef("");
    
    setLoadingWarehouses(true);
    
    try {
      const data = await cachedFetchNPWarehouses(city.Ref, "");
      setWarehouses(data);
      if (data.length === 0) {
        setWarehouseError("Відділень не знайдено");
      }
    } catch (error) {
      console.error("[checkout] Warehouse fetch error:", error);
      setWarehouseError("Помилка завантаження відділень");
      setWarehouses([]);
    } finally {
      setLoadingWarehouses(false);
    }
  }, [setValue]); // Remove cachedFetchNPWarehouses from dependencies

  // Поиск отделения
  const onWarehouseSearch = useCallback((val: string) => {
    setWarehouseValue(val);
    
    if (!selectedCityRef) {
      setWarehouses([]);
      setShowWarehouseResults(false);
      setWarehouseError("Спочатку оберіть місто");
      return;
    }
    
    if (val.length < 2) {
      setWarehouses([]);
      setShowWarehouseResults(false);
      setWarehouseError("");
      return;
    }
    
    setWarehouseError("");
    setLoadingWarehouses(true);
    
    // Отменяем предыдущий таймаут
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Устанавливаем новый таймаут для debounce
    searchTimeout.current = setTimeout(async () => {
      const searchId = ++currentSearchId.current;
      try {
        const data = await cachedFetchNPWarehouses(selectedCityRef, val);
        if (searchId === currentSearchId.current) {
          setWarehouses(data);
          setShowWarehouseResults(true);
          if (data.length === 0) {
            setWarehouseError("Відділень не знайдено");
          }
        }
      } catch (error) {
        if (searchId === currentSearchId.current) {
          console.error("[checkout] Warehouse search error:", error);
          setWarehouseError("Помилка пошуку відділень");
          setWarehouses([]);
          setShowWarehouseResults(false);
        }
      } finally {
        if (searchId === currentSearchId.current) {
          setLoadingWarehouses(false);
        }
      }
    }, 300);
  }, [selectedCityRef]);

  // Выбор отделения
  const onWarehouseSelect = useCallback((warehouse: NPWarehouse) => {
    setSelectedWarehouseRef(warehouse.Ref);
    setWarehouseValue(warehouse.Description);
    setShowWarehouseResults(false);
    setWarehouseError("");
    setValue("warehouse", warehouse.Description, { shouldValidate: true });
  }, [setValue]);

  // Auto-fill user data from auth when available
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      // Auto-fill name if field is empty and user has name
      if (!nameValue && user.name) {
        setValue("name", user.name, { shouldValidate: false });
      }
      // Auto-fill surname if field is empty and user has surname
      if (!surnameValue && user.surname) {
        setValue("surname", user.surname, { shouldValidate: false });
      }
      // Auto-fill phone if field is empty and user has phone
      if (!phoneValue && user.phone) {
        setValue("phone", user.phone, { shouldValidate: false });
      }
    }
  }, [isAuthenticated, user, authLoading, nameValue, surnameValue, phoneValue, setValue]);

  const registerAbandonedCart = useCallback(
    async (name: string, phone: string) => {
      if (!phone || items.length === 0) return;
      
      // If phone changed, cancel previous abandoned cart
      if (lastRegisteredPhone.current && lastRegisteredPhone.current !== phone) {
        try {
          await fetch("/api/abandoned-cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sessionId.current }),
          });
        } catch (error) {
          console.error("[abandoned-cart] Failed to cancel previous:", error);
        }
      }
      
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

  // Register abandoned cart when name and phone are entered
  useEffect(() => {
    const fullName = `${nameValue} ${surnameValue}`.trim();
    if (fullName && phoneValue && isValidUkrainianPhone(phoneValue)) {
      registerAbandonedCart(fullName, phoneValue);
    }
  }, [nameValue, surnameValue, phoneValue, registerAbandonedCart]);

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
    console.log("[checkout] Form submitted:", data);
    console.log("[checkout] Payment method:", paymentMethod);
    console.log("[checkout] Items:", items);
    
    // Prevent multiple submissions
    if (submitting) {
      console.log("[checkout] Already submitting, ignoring duplicate request");
      return;
    }
    
    // Ensure phone is properly normalized before validation
    if (data.phone) {
      try {
        data.phone = normalizePhone(data.phone);
        setValue("phone", data.phone, { shouldValidate: true });
      } catch (error) {
        console.log("[checkout] Phone normalization failed:", error);
      }
    }
    
    setSubmitting(true);
    setServerError(null);
    trackInitiateCheckout({ value: totalPrice, numItems: totalCount });

    try {
      await cancelAbandonedCart();
      
      // Extract UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utm_source = urlParams.get('utm_source') || undefined;
      const utm_medium = urlParams.get('utm_medium') || undefined;
      const utm_campaign = urlParams.get('utm_campaign') || undefined;
      const referrer = document.referrer || undefined;
      
      console.log("[checkout] Sending to API...");
      console.log("[checkout] Request body:", {
        ...data,
        paymentMethod,
        promoCode: promoResult ? promoInput.trim().toUpperCase() : undefined,
        discountAmount: totalDiscountAmount > 0 ? totalDiscountAmount : undefined,
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          variationId: i.variationId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        totalPrice: finalPrice,
      });
      
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          cityRef: selectedCityRef,
          departmentRef: selectedWarehouseRef,
          paymentMethod,
          promoCode: promoResult ? promoInput.trim().toUpperCase() : undefined,
          discountAmount: totalDiscountAmount > 0 ? totalDiscountAmount : undefined,
          items: items.map((i) => ({
            id: i.id,
            productId: i.productId,
            variationId: i.variationId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          totalPrice: finalPrice,
          utm_source,
          utm_medium,
          utm_campaign,
          referrer,
        }),
      });

      console.log("[checkout] API response status:", res.status);
      const json = await res.json();
      console.log("[checkout] API response:", json);
      
      if (!res.ok) throw new Error(json.error || "Помилка");

      saveAddress({ city: data.city, warehouse: data.warehouse, cityRef: selectedCityRef });

      // Store order data for potential account creation
      setOrderData({
        name: data.name,
        surname: data.surname,
        phone: data.phone,
        email: data.email,
        city: data.city,
        warehouse: data.warehouse,
        orderNumber: json.orderNumber
      });

      if (paymentMethod === "cod") {
        // Clear cart immediately for COD (order is confirmed, success page also clears but items needed for analytics)
        items.forEach(item => removeItem(item.id));
        // Show account creation suggestion for non-authenticated users
        if (!isAuthenticated && data.email) {
          setShowAccountSuggestion(true);
          return;
        }
        window.location.href = `/checkout/success?ref=${json.orderNumber}&method=cod`;
        return;
      }

      // For online payment, submit POST form to WayForPay
      if (json.paymentFormParams) {
        setRedirecting(true);
        
        // Create and submit POST form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://secure.wayforpay.com/pay';
        
        // Add all form parameters as hidden inputs
        Object.entries(json.paymentFormParams).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        setTimeout(() => form.submit(), 800);
      }
    } catch (err: any) {
      console.error("[checkout] Error:", err);
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error("[checkout] Validation errors:", errors);
    setServerError("Будь ласка, заповніть всі обов'язкові поля");
  };

  const handleCreateAccount = async () => {
    if (!orderData) return;
    
    setCreatingAccount(true);
    try {
      const response = await fetch("/api/auth/register-from-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orderData.name,
          surname: orderData.surname,
          phone: orderData.phone,
          email: orderData.email,
        }),
      });
      
      if (response.ok) {
        setAccountCreated(true);
        setTimeout(() => {
          window.location.href = `/checkout/success?ref=${orderData?.orderNumber}&method=cod`;
        }, 2000);
      } else {
        const error = await response.json();
        console.error("[checkout] Account creation error:", error);
        setServerError("Помилка створення аккаунту");
      }
    } catch (error) {
      console.error("[checkout] Account creation error:", error);
      setServerError("Помилка створення аккаунту");
    } finally {
      setCreatingAccount(false);
    }
  };

  const skipAccountCreation = () => {
    window.location.href = `/checkout/success?ref=${orderData?.orderNumber}&method=cod`;
  };

  if (!mounted) return null;
  if (totalCount === 0) return <EmptyCartScreen />;
  if (redirecting) return <RedirectingScreen />;
  if (showAccountSuggestion) {
    return (
      <div className="min-h-screen bg-[#F6F4EF] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          {accountCreated ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-black text-[#0F2D2A] mb-2">Аккаунт створено!</h1>
              <p className="text-[#7A8A84] text-sm leading-relaxed mb-6">
                Ваш особистий кабінет успішно створено. Тепер ви можете відстежувати замовлення та отримувати знижки.
              </p>
              <p className="text-[#7A8A84] text-xs">Перенаправлення на сторінку успіху...</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-[#E7EFEA] rounded-full flex items-center justify-center mx-auto mb-6">
                <Package size={40} className="text-[#1F6B5E]" />
              </div>
              <h1 className="text-2xl font-black text-[#0F2D2A] mb-2">Створити особистий кабінет?</h1>
              <p className="text-[#7A8A84] text-sm leading-relaxed mb-6">
                Збережіть ваші дані для швидкого оформлення в майбутньому та отримайте доступ до історії замовлень
              </p>
              
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-[#7A8A84] mb-2">Ваші дані:</p>
                <p className="text-sm text-[#0F2D2A]">{orderData?.name} {orderData?.surname}</p>
                <p className="text-sm text-[#0F2D2A]">{orderData?.phone}</p>
                {orderData?.email && <p className="text-sm text-[#0F2D2A]">{orderData.email}</p>}
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCreateAccount}
                  disabled={creatingAccount}
                  className="flex items-center justify-center gap-2 bg-[#1F6B5E] hover:bg-[#0F2D2A] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98] text-sm"
                >
                  {creatingAccount ? (
                    <><Loader2 size={20} className="animate-spin" /> Створення...</>
                  ) : (
                    <><Check size={20} /> Створити кабінет</>
                  )}
                </button>
                
                <button
                  onClick={skipAccountCreation}
                  disabled={creatingAccount}
                  className="text-[#7A8A84] hover:text-[#0F2D2A] disabled:opacity-60 font-medium py-2 px-4 text-sm transition-colors"
                >
                  Пропустити
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4EF] flex flex-col">
      <div className="flex-1 py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#7A8A84] hover:text-[#24312E] mb-4 sm:mb-6 transition-colors">
          <ChevronLeft size={16} /> Назад до магазину
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-[#0F2D2A] mb-6 sm:mb-8 flex items-center gap-3">
          Оформлення замовлення
          <span className="text-sm font-semibold bg-[#E7EFEA] text-[#1F6B5E] px-3 py-1 rounded-full">{totalCount}</span>
        </h1>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* LEFT: FORM */}
          <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-5">
            <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col gap-5">
              
              {/* 1. Contacts */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#E7EFEA] p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-[#E7EFEA] rounded-full flex items-center justify-center text-xs font-black text-[#1F6B5E]">1</div>
                  <h2 className="text-lg font-black text-[#0F2D2A]">Контактні дані</h2>
                </div>
                <Field label="Ваше ім'я *" error={errors.name?.message}>
                  <input {...register("name")} placeholder="Наприклад: Олена" className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition" />
                </Field>
                <Field label="Прізвище *" error={errors.surname?.message}>
                  <input {...register("surname")} placeholder="Наприклад: Коваль" className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition" />
                </Field>
                <Field label="Телефон *" error={errors.phone?.message}>
                  <PhoneInput 
                    {...register("phone")} 
                    className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition" 
                  />
                </Field>
              </div>

              {/* 2. Delivery */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#E7EFEA] p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-visible">
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
                      setWarehouseValue(savedAddress.warehouse);
                      if (savedAddress.cityRef) {
                        setSelectedCityRef(savedAddress.cityRef);
                        setLoadingWarehouses(true);
                        const list = await cachedFetchNPWarehouses(savedAddress.cityRef, "");
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
                <Field label="Місто *" error={errors.city?.message || citySearchError}>
                  <div className="relative" data-city-search>
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
                        {cities.map((city: NPCity) => (
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
                        setCitySearchError("");
                        setLoadingCities(true);
                        const searchId = ++currentSearchId.current;
                        try {
                          const data = await cachedFetchNPCities(cityName);
                          if (searchId === currentSearchId.current) {
                            setCities(data);
                            const exact = data.find((c: NPCity) => c.Description === cityName || c.Description?.startsWith(cityName));
                            if (exact) {
                              setSelectedCityRef(exact.Ref);
                              
                              // Сбрасываем поле поиска отделений
                              setWarehouseValue("");
                              setShowWarehouseResults(false);
                              setWarehouseError("");
                              setValue("warehouse", "", { shouldValidate: true });
                              setSelectedWarehouseRef("");
                              
                              setLoadingWarehouses(true);
                              setWarehouseError("");
                              try {
                                const list = await cachedFetchNPWarehouses(exact.Ref, "");
                                if (searchId === currentSearchId.current) {
                                  setWarehouses(list);
                                  if (list.length === 0) {
                                    setWarehouseError("Відділень не знайдено");
                                  }
                                }
                              } catch (error) {
                                if (searchId === currentSearchId.current) {
                                  console.error("[checkout] Quick city warehouse error:", error);
                                  setWarehouseError("Помилка завантаження відділень");
                                  setWarehouses([]);
                                }
                              } finally {
                                if (searchId === currentSearchId.current) {
                                  setLoadingWarehouses(false);
                                }
                              }
                            } else {
                              setCitySearchError("Місто не знайдено");
                            }
                          }
                        } catch (error) {
                          if (searchId === currentSearchId.current) {
                            console.error("[checkout] Quick city search error:", error);
                            setCitySearchError("Помилка пошуку міста");
                            setCities([]);
                          }
                        } finally {
                          if (searchId === currentSearchId.current) {
                            setLoadingCities(false);
                          }
                        }
                      }}
                      className="px-2 sm:px-3 py-1.5 rounded-lg border border-[#E7EFEA] text-xs sm:text-sm font-medium text-[#24312E] hover:border-[#C9B27C]/50 hover:text-[#1F6B5E] transition-colors"
                    >
                      {cityName}
                    </button>
                  ))}
                </div>

                {/* Warehouse Search */}
                <Field label="Відділення або поштомат *" error={errors.warehouse?.message || warehouseError}>
                  <div className="relative" data-warehouse-search>
                    <input
                      value={warehouseValue}
                      placeholder="Почніть вводити назву відділення..."
                      autoComplete="off"
                      disabled={!selectedCityRef}
                      onChange={(e) => {
                        const v = e.target.value;
                        setValue("warehouse", v, { shouldValidate: true });
                        onWarehouseSearch(v);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none disabled:bg-[#F6F4EF] transition"
                    />
                    {loadingWarehouses && <Loader2 className="absolute right-3 top-3 animate-spin text-[#1F6B5E]" size={18} />}
                    
                    {showWarehouseResults && warehouses.length > 0 && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-[#E7EFEA] rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                        {warehouses.map((wh) => (
                          <div 
                            key={wh.Ref} 
                            onClick={() => onWarehouseSelect(wh)} 
                            className="px-4 py-3 hover:bg-[#F6F4EF] cursor-pointer text-sm border-b border-[#E7EFEA] last:border-none transition-colors flex items-center gap-2"
                          >
                            <Package size={14} className="text-[#7A8A84]" />
                            <div className="flex-1">
                              <div className="font-medium">{wh.Description}</div>
                              {wh.Number && (
                                <div className="text-xs text-[#7A8A84]">№{wh.Number}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
              </div>

              {/* 3. Payment method */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#E7EFEA] p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-[#E7EFEA] rounded-full flex items-center justify-center text-xs font-black text-[#1F6B5E]">3</div>
                  <h2 className="text-lg font-black text-[#0F2D2A]">Спосіб оплати</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { value: "online" as const, label: "Онлайн-оплата", sublabel: "WayForPay — Visa/Mastercard", icon: <CreditCard size={20} />, discount: "-5%" },
                    { value: "cod"    as const, label: "Накладений платіж", sublabel: "Оплата при отриманні", icon: <Banknote size={20} />, discount: null },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all relative ${
                        paymentMethod === opt.value
                          ? "border-[#1F6B5E] bg-[#F6F4EF]"
                          : "border-[#E7EFEA] hover:border-[#C9B27C]/50"
                      }`}
                    >
                      {opt.discount && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {opt.discount}
                        </div>
                      )}
                      <div className={`flex items-center gap-2 font-bold text-sm ${paymentMethod === opt.value ? "text-[#1F6B5E]" : "text-[#24312E]"}`}>
                        {opt.icon}
                        {opt.label}
                        {paymentMethod === opt.value && <Check size={14} className="ml-auto text-[#1F6B5E]" />}
                      </div>
                      <span className="text-xs text-[#7A8A84] ml-7">{opt.sublabel}</span>
                    </button>
                  ))}
                </div>
                
                {/* Email field for COD */}
                {paymentMethod === "cod" && (
                  <div className="mt-4">
                    <Field label="Email *" error={errors.email?.message}>
                      <input {...register("email")} type="email" placeholder="example@mail.com" className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition" />
                    </Field>
                  </div>
                )}
              </div>

              {/* 4. Comment */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#E7EFEA] p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-[#E7EFEA] rounded-full flex items-center justify-center text-xs font-black text-[#1F6B5E]">4</div>
                  <h2 className="text-lg font-black text-[#0F2D2A]">Коментар до замовлення</h2>
                </div>
                <Field label="Ваш коментар (опціонально)" error={errors.comment?.message}>
                  <textarea
                    {...register("comment")}
                    placeholder="Наприклад: Передзвоніть перед відправкою, зручний час доставки тощо..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[#E7EFEA] text-sm focus:ring-2 focus:ring-[#C9B27C]/70 outline-none transition resize-none"
                  />
                </Field>
              </div>

              {/* 5. Promo code - temporarily hidden */}
              {/*
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#E7EFEA] p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-[#E7EFEA] rounded-full flex items-center justify-center text-xs font-black text-[#1F6B5E]">5</div>
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
                  <div className="flex flex-col sm:flex-row gap-2">
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
              */}

              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">⚠️ {serverError}</div>
              )}

              <button type="submit" disabled={submitting} className="flex items-center justify-center gap-3 bg-[#1F6B5E] hover:bg-[#0F2D2A] disabled:opacity-60 text-white font-black py-3 sm:py-4 px-4 rounded-xl sm:rounded-2xl shadow-lg transition-all active:scale-[0.98] text-sm sm:text-base">
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
          <div className="lg:col-span-2 order-first lg:order-last mb-6 lg:mb-0">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#E7EFEA] p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-base font-black text-[#0F2D2A] mb-4">Ваше замовлення</h2>
              <div className="flex flex-col gap-3 max-h-80 sm:max-h-72 overflow-y-auto mb-4 sm:mb-5 scrollbar-thin">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size ?? ""}`} className="flex items-center gap-3 group py-3 border-b border-[#E7EFEA] last:border-b-0">
                    <div className="relative w-14 h-14 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl overflow-hidden bg-[#E7EFEA]">
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-sm font-bold text-[#0F2D2A] line-clamp-2">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center bg-[#F6F4EF] rounded-lg h-10 sm:h-8">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-2.5 sm:p-1 hover:bg-[#E7EFEA] rounded-l-lg transition-colors h-full flex items-center justify-center"
                          >
                            <Minus size={14} className="sm:size-6 text-[#1F6B5E]" />
                          </button>
                          <span className="px-3 sm:px-2 text-sm sm:text-xs font-semibold text-[#0F2D2A] min-w-[32px] sm:min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2.5 sm:p-1 hover:bg-[#E7EFEA] rounded-r-lg transition-colors h-full flex items-center justify-center"
                          >
                            <Plus size={14} className="sm:size-6 text-[#1F6B5E]" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2.5 sm:p-1 hover:bg-red-50 rounded-lg transition-colors group h-10 w-10 sm:h-8 sm:w-8 flex items-center justify-center"
                        >
                          <Trash2 size={14} className="sm:size-12 text-[#7A8A84] group-hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm sm:text-sm font-semibold text-[#0F2D2A] min-w-0 text-right">
                      <div className="flex flex-col items-end">
                        {item.oldPrice && item.oldPrice > item.price && (
                          <span className="text-xs text-[#7A8A84] line-through">
                            {(item.oldPrice * item.quantity).toLocaleString()} грн
                          </span>
                        )}
                        <span>{(item.price * item.quantity).toLocaleString()} грн</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E7EFEA] pt-4 sm:pt-4 space-y-3">
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold group relative">
                    <div className="flex flex-col items-start cursor-help">
                      <div className="relative">
                        <span>Економія:</span>
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 border border-green-600 rounded-full"></div>
                      </div>
                    </div>
                    <span>{totalSavings.toLocaleString()} грн</span>
                    
                    {/* Tooltip */}
                    <div className="absolute left-0 bottom-full mb-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                      Економія від зниженої ціни на {totalCount === 1 ? 'товар' : 'товари'}
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm text-[#7A8A84] py-1"><span>Доставка</span><span className="text-[#1F6B5E] font-semibold">За тарифами НП</span></div>
                {(promoDiscountAmount > 0 || onlinePaymentDiscount > 0) && (
                  <>
                    <div className="flex justify-between text-sm text-[#7A8A84]">
                      <span>Товари</span><span>{totalPrice.toLocaleString()} грн</span>
                    </div>
                    {promoDiscountAmount > 0 && (
                      <div className="flex justify-between text-sm text-[#1F6B5E] font-semibold">
                        <span>Знижка ({promoResult?.discountPct}%)</span>
                        <span>−{promoDiscountAmount.toLocaleString()} грн</span>
                      </div>
                    )}
                    {onlinePaymentDiscount > 0 && (
                      <div className="flex justify-between text-sm text-[#1F6B5E] font-semibold">
                        <span>Знижка за онлайн-оплату (5%)</span>
                        <span>−{onlinePaymentDiscount.toLocaleString()} грн</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[#E7EFEA]"><span className="font-semibold text-[#0F2D2A] text-base">До оплати:</span><span className="text-xl sm:text-xl font-semibold text-[#1F6B5E]">{finalPrice.toLocaleString()} грн</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <ShopFooter />
    </div>
  );
}


