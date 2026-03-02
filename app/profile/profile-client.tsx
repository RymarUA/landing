"use client";
/**
 * app/profile/profile-client.tsx
 *
 * Personal cabinet with OTP phone login.
 *
 * Flow:
 *  1. GET /api/auth/me → if authenticated, skip to profile view
 *  2. Enter phone → POST /api/auth/send-otp
 *  3. Enter 6-digit OTP → POST /api/auth/verify-otp → sets httpOnly cookie
 *  4. Profile view: show orders fetched from Sitniks CRM (TODO when CRM is live)
 *  5. Logout → POST /api/auth/logout
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone, KeyRound, LogOut, Package, ChevronLeft,
  Loader2, CheckCircle, RefreshCw, User, ShoppingBag,
  AlertCircle, ChevronRight, Heart, Tag, Copy, Truck, RotateCcw,
} from "lucide-react";
import { useWishlist } from "@/components/wishlist-context";
import { useCart } from "@/components/cart-context";
import Image from "next/image";

/* ─── Types ──────────────────────────────────────────── */
type Step = "loading" | "phone" | "otp" | "profile";

/** Normalize phone for API: +380XXXXXXXXX */
function normalizePhoneForApi(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("0")) return "+38" + digits;
  if (digits.length === 10 && digits.startsWith("80")) return "+3" + digits;
  if (digits.length === 11 && digits.startsWith("380")) return "+" + digits;
  return phone.trim();
}

const PHONE_VALID = /^\+?3?8?0\d{9}$/;
function isValidPhone(phone: string): boolean {
  const normalized = normalizePhoneForApi(phone);
  return PHONE_VALID.test(normalized.replace(/\s/g, ""));
}

/** Format display phone: +38 (067) 123-45-67 */
function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits ? "+38 (" + digits : "";
  if (digits.length <= 6) return "+38 (" + digits.slice(0, 3) + ") " + digits.slice(3);
  return "+38 (" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6, 8) + "-" + digits.slice(8);
}

interface Order {
  id: string | number;
  createdAt: string;
  status: string;
  total: number;
  trackingNumber?: string;
  items: Array<{ id?: number; name: string; quantity: number; price: number; image?: string }>;
}

/* ─── Status label map ───────────────────────────────── */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "Очікує оплати":    { label: "Очікує оплати",    color: "text-amber-600 bg-amber-50 border-amber-100" },
  "Оплачено":         { label: "Оплачено",         color: "text-green-600 bg-green-50 border-green-100" },
  "Відправлено":      { label: "Відправлено",       color: "text-blue-600 bg-blue-50 border-blue-100" },
  "Доставлено":       { label: "Доставлено",        color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  "Скасовано":        { label: "Скасовано",         color: "text-red-600 bg-red-50 border-red-100" },
};

function statusStyle(status: string) {
  return STATUS_LABELS[status] ?? { label: status, color: "text-gray-600 bg-gray-50 border-gray-100" };
}

/* ─── Input ──────────────────────────────────────────── */
function InputField({
  label, type = "text", value, onChange, placeholder, disabled, maxLength, autoComplete,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  disabled?: boolean; maxLength?: number; autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

const PROFILE_NAME_KEY = "fhm_profile_name";
const PROMO_CODE = "FIRST10";

/* ─── Main component ─────────────────────────────────── */
export function ProfileClient({ allProducts = [] }: { allProducts?: Array<{ id: number; name: string; price: number; image: string; sizes?: string[] }> }) {
  const [step, setStep]     = useState<Step>("loading");
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState(["", "", "", "", "", ""]);
  const [loggedPhone, setLoggedPhone] = useState("");
  const [profileName, setProfileName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError]   = useState("");
  const [busy, setBusy]     = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [showPromoBlock, setShowPromoBlock] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpString = otp.join("");
  const router = useRouter();
  const { count: wishlistCount, ids: wishlistIds, hydrated: wishlistHydrated } = useWishlist();
  const { addItem, updateQuantity } = useCart();
  const PLACEHOLDER_IMG = "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProfileName(localStorage.getItem(PROFILE_NAME_KEY) || "");
  }, [step]);
  useEffect(() => {
    if (step !== "profile" || typeof window === "undefined") return;
    setShowPromoBlock(!!localStorage.getItem("fhm_popup_seen"));
  }, [step]);

  /* ── Check existing session ── */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          setLoggedPhone(data.phone);
          setStep("profile");
          loadOrders(data.phone, () => isMounted);
        } else {
          setStep("phone");
        }
      } catch {
        if (isMounted) setStep("phone");
      }
    })();
    return () => { isMounted = false; };
  }, []);

  /* ── Resend countdown ── */
  const startResendTimer = useCallback(() => {
    setResendIn(60);
    timerRef.current = setInterval(() => {
      setResendIn((v) => {
        if (v <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  /* ── Load orders from API (isMounted prevents setState on unmount) ── */
  const loadOrders = useCallback(async (_phone: string, isMounted?: () => boolean) => {
    setOrdersLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      if (isMounted?.() !== false) setOrders([]);
    } catch {
      if (isMounted?.() !== false) setOrders([]);
    } finally {
      if (isMounted?.() !== false) setOrdersLoading(false);
    }
  }, []);

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) return;
    const normalized = normalizePhoneForApi(trimmed);
    if (!/^\+?3?8?0\d{9}$/.test(normalized.replace(/\s/g, ""))) {
      setError("Введіть коректний номер у форматі +380...");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Помилка відправлення");
      setStep("otp");
      startResendTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhoneForApi(phone), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Невірний код");
      setLoggedPhone(data.phone);
      setStep("profile");
      loadOrders(data.phone, () => true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка перевірки. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  const lastAutoSubmittedOtp = useRef("");
  useEffect(() => {
    if (otpString.length < 6) lastAutoSubmittedOtp.current = "";
  }, [otpString]);
  /* ── Auto-submit OTP when 6 digits entered ── */
  useEffect(() => {
    if (otpString.length !== 6 || busy) return;
    if (lastAutoSubmittedOtp.current === otpString) return;
    lastAutoSubmittedOtp.current = otpString;
    handleVerifyOtp({ preventDefault: () => {} } as React.FormEvent);
  }, [otpString, busy]);

  /* ── Logout (with optional confirmation) ── */
  const [confirmLogout, setConfirmLogout] = useState(false);
  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
    } catch {
      window.location.href = "/profile";
      return;
    }
    setConfirmLogout(false);
    setLoggedPhone("");
    setOrders([]);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setStep("phone");
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendIn > 0) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhoneForApi(phone) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Помилка");
      setOtp(["", "", "", "", "", ""]);
      startResendTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={36} className="text-orange-400 animate-spin" />
      </div>
    );
  }

  /* ── PHONE STEP ── */
  if (step === "phone") {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8">
            <ChevronLeft size={16} />
            На головну
          </Link>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="p-8">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <User size={30} className="text-orange-500" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Особистий кабінет</h1>
              <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
                Введіть номер телефону, яким ви оформляли замовлення. Ми надішлемо код підтвердження.
              </p>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Номер телефону</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(-9);
                      setPhone(digits ? formatPhoneDisplay("0" + digits) : "");
                    }}
                    placeholder="+38 (067) 123-45-67"
                    disabled={busy}
                    autoComplete="tel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !phone.trim() || !isValidPhone(phone)}
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-orange-200"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                  {busy ? "Відправляємо…" : "Отримати код"}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
                Код буде надіслано через Telegram або SMS на вказаний номер.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── OTP STEP ── */
  if (step === "otp") {
    const setOtpDigit = (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      setError("");
      setOtp((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    };
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
        setOtp((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    };
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => { setStep("phone"); setError(""); setOtp(["", "", "", "", "", ""]); }}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8"
          >
            <ChevronLeft size={16} />
            Змінити номер
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="p-8">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <KeyRound size={30} className="text-amber-500" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Введіть код</h1>
              <p className="text-sm text-gray-500 text-center mb-1 leading-relaxed">
                Код надіслано на номер
              </p>
              <p className="text-sm font-black text-gray-900 text-center mb-7">{phone}</p>

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">6-значний код</label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[i]}
                        onChange={(e) => setOtpDigit(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        disabled={busy}
                        className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 border-gray-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition disabled:opacity-60"
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || otpString.length !== 6}
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-orange-200"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {busy ? "Перевіряємо…" : "Підтвердити"}
                </button>
              </form>

              <div className="flex items-center justify-center gap-2 mt-5">
                <button
                  onClick={handleResend}
                  disabled={resendIn > 0 || busy}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <RefreshCw size={14} />
                  {resendIn > 0 ? `Повторний код через ${resendIn}с` : "Надіслати код ще раз"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PROFILE STEP ── */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2">
              <ChevronLeft size={15} />
              На головну
            </Link>
            <h1 className="text-2xl font-black text-gray-900">Особистий кабінет</h1>
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${confirmLogout ? "text-red-600 hover:text-red-700" : "text-gray-400 hover:text-red-500"}`}
          >
            <LogOut size={15} />
            {confirmLogout ? "Так, вийти" : "Вийти"}
          </button>
          {confirmLogout && (
            <button
              type="button"
              onClick={() => setConfirmLogout(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Скасувати
            </button>
          )}
        </div>

        {/* User card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Мій профіль</p>
              <p className="font-black text-gray-900 text-lg">
                {profileName.trim() ? `Привіт, ${profileName.trim()}!` : loggedPhone}
              </p>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle size={11} />
                Підтверджений номер
              </p>
              <input
                type="text"
                value={profileName}
                onChange={(e) => {
                  const v = e.target.value;
                  setProfileName(v);
                  if (typeof window !== "undefined") localStorage.setItem(PROFILE_NAME_KEY, v);
                }}
                placeholder="Додати ім'я"
                className="mt-2 w-full max-w-[200px] px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
        </div>

        {/* Wishlist block */}
        {wishlistHydrated && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-orange-500 fill-orange-500" />
                <h2 className="text-lg font-black text-gray-900">Список бажань</h2>
              </div>
              <Link
                href="/wishlist"
                className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                {wishlistCount} {wishlistCount === 1 ? "товар" : wishlistCount >= 5 ? "товарів" : "товари"}
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Promo block (if popup was seen) */}
        {showPromoBlock && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Ваш промокод</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-black text-amber-700 tracking-widest">{PROMO_CODE}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(PROMO_CODE);
                  setCopiedPromo(true);
                  setTimeout(() => setCopiedPromo(false), 2000);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800"
              >
                <Copy size={14} />
                {copiedPromo ? "Скопійовано!" : "Копіювати"}
              </button>
            </div>
          </div>
        )}

        {/* Orders section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingBag size={18} className="text-orange-500" />
            <h2 className="text-lg font-black text-gray-900">Мої замовлення</h2>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="text-orange-400 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={36} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-500 mb-1">Замовлень поки немає</p>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                Ваші майбутні замовлення з FamilyHub Market будуть відображатися тут.
              </p>
              <Link
                href="/#catalog"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-2xl transition-colors shadow-lg shadow-orange-200 text-sm"
              >
                Перейти до каталогу
                <ChevronRight size={15} />
              </Link>
              {wishlistHydrated && wishlistIds.size > 0 && allProducts.length > 0 && (
                <div className="mt-10 text-left">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Можливо, вас зацікавить...</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {allProducts.filter((p) => wishlistIds.has(p.id)).slice(0, 4).map((product) => (
                      <Link key={product.id} href={`/product/${product.id}`} className="block rounded-xl border border-gray-100 overflow-hidden bg-white hover:shadow-md transition-shadow">
                        <div className="aspect-square relative bg-gray-100">
                          <Image src={product.image} alt={product.name} fill sizes="120px" className="object-cover" />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs font-black text-orange-500">{product.price.toLocaleString("uk-UA")} грн</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => {
                const { label, color } = statusStyle(order.status);
                return (
                  <div key={order.id} className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-gray-900 text-sm">Замовлення #{order.id}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("uk-UA", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${color}`}>
                        {label}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 truncate max-w-[200px]">{item.name} × {item.quantity}</span>
                          <span className="text-gray-800 font-semibold flex-shrink-0">{(item.price * item.quantity).toLocaleString("uk-UA")} грн</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className="text-xs text-gray-400">Разом:</span>
                      <span className="font-black text-orange-500">{order.total.toLocaleString("uk-UA")} грн</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {order.status === "Відправлено" && order.trackingNumber && (
                        <Link
                          href={`/?ttn=${encodeURIComponent(order.trackingNumber)}#tracking`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <Truck size={14} />
                          Відстежити
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          order.items.forEach((item, idx) => {
                            const id = item.id ?? -(Number(order.id) * 1000 + idx);
                            addItem({
                              id,
                              name: item.name,
                              price: item.price,
                              image: item.image ?? PLACEHOLDER_IMG,
                              size: null,
                            });
                            if (item.quantity > 1) updateQuantity(id, item.quantity);
                          });
                          router.push("/checkout");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
                      >
                        <RotateCcw size={14} />
                        Повторити замовлення
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Support link */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Питання щодо замовлення?{" "}
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 font-semibold hover:underline"
          >
            Напишіть нам в Instagram
          </a>
        </p>
      </div>
    </div>
  );
}
