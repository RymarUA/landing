// @ts-nocheck
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
  AlertCircle, ChevronRight, Heart, Copy, Truck, RotateCcw,
  Mail, Plus, Shield,
} from "lucide-react";
import { useWishlist } from "@/components/wishlist-context";
import { useCart } from "@/components/cart-context";
import Image from "next/image";
import { blurProps } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { ShopFooter } from "@/components/shop-footer";
import { useLocalStorage } from "@/hooks/use-isomorphic";
import dynamic from "next/dynamic";

const ShopNovaPoshta = dynamic(
  () => import("@/components/shop-novaposhta").then(mod => ({ default: mod.ShopNovaPoshta })),
  { ssr: false }
);

/* ─── Types ──────────────────────────────────────────── */
type Step = "loading" | "email" | "otp" | "profile" | "add-phone";

/** Normalize email for API: lowercase, trimmed */
function normalizeEmailForApi(email: string): string {
  return email.toLowerCase().trim();
}

const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string): boolean {
  return EMAIL_VALID.test(email);
}

/** Normalize phone for API: always +380XXXXXXXXX (13 chars) */
function normalizePhoneForApi(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("38")) return "+" + digits;
  if (digits.length >= 10) {
    const tail = digits.slice(-10);
    if (tail.startsWith("0")) return "+38" + tail;
    if (tail.length === 9) return "+380" + tail;
  }
  if (digits.length === 9) return "+380" + digits;
  return "";
}

const PHONE_VALID = /^\+380\d{9}$/;
function isValidPhone(phone: string): boolean {
  const normalized = normalizePhoneForApi(phone);
  return normalized.length === 13 && PHONE_VALID.test(normalized);
}

/** Format display phone: +38 (067) 123-45-67 — only digits, max 10 (0XX...) */
function formatPhoneDisplay(digitsOnly: string): string {
  const digits = digitsOnly.replace(/\D/g, "").slice(0, 10);
  if (!digits.length) return "";
  if (digits.length <= 3) return "+38 (" + digits;
  if (digits.length <= 6) return "+38 (" + digits.slice(0, 3) + ") " + digits.slice(3);
  return "+38 (" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6, 8) + "-" + digits.slice(8, 10);
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

const PROFILE_NAME_KEY = "fhm_profile_name";
const PROMO_CODE = "FIRST10";

/* ─── Main component ─────────────────────────────────── */
export function ProfileClient({ allProducts = [] }: { allProducts?: Array<{ id: number; name: string; price: number; image: string; sizes?: string[] }> }) {
  const [step, setStep]     = useState<Step>("loading");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState(["", "", "", "", "", ""]);
  const [loggedEmail, setLoggedEmail] = useState("");
  const [loggedPhone, setLoggedPhone] = useState("");
  const [profileName, setProfileName] = useLocalStorage<string>(PROFILE_NAME_KEY, "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError]   = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [busy, setBusy]     = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [showPromoBlock, setShowPromoBlock] = useState(false);
  const [popupSeen] = useLocalStorage<string>("fhm_popup_seen", "");
  const [copiedTTN, setCopiedTTN] = useState<string | null>(null);
  const [sitniksCustomer, setSitniksCustomer] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [devMode, setDevMode] = useState(true); // Temporary dev mode
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpString = otp.join("");
  const router = useRouter();
  const { count: wishlistCount, ids: wishlistIds, hydrated: wishlistHydrated } = useWishlist();
  const { addItem, updateQuantity } = useCart();
  const PLACEHOLDER_IMG = "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero";

  useEffect(() => {
    // Profile name is handled by useLocalStorage hook
  }, [step]);
  useEffect(() => {
    if (step !== "profile") return;
    setShowPromoBlock(!!popupSeen);
  }, [step, popupSeen]);

  /* ── Load Sitniks customer data ── */
  const loadSitniksCustomer = useCallback(async (abortController?: AbortController) => {
    setCustomerLoading(true);
    try {
      const res = await fetch("/api/profile/customer", { 
        signal: abortController?.signal 
      });
      
      if (!res.ok) {
        if (!abortController?.signal.aborted) setSitniksCustomer(null);
        return;
      }
      
      const data = await res.json();
      
      if (!abortController?.signal.aborted) {
        setSitniksCustomer(data.customer);
      }
    } catch (error) {
      console.error("[profile] Failed to load Sitniks customer:", error);
      if (!abortController?.signal.aborted) setSitniksCustomer(null);
    } finally {
      if (!abortController?.signal.aborted) setCustomerLoading(false);
    }
  }, []);

  /* ── Load orders from API (AbortController prevents setState on unmount) ── */
  const loadOrders = useCallback(async (_phone: string, abortController?: AbortController) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/profile/orders", { 
        signal: abortController?.signal 
      });
      
      if (!res.ok) {
        if (!abortController?.signal.aborted) setOrders([]);
        return;
      }
      
      const data = await res.json();
      
      if (!abortController?.signal.aborted) {
        // Transform Sitniks orders to our Order interface
        const transformedOrders: Order[] = (data.orders || []).map((order: any) => ({
          id: order.orderNumber || order.id,
          createdAt: order.createdAt,
          status: order.status?.name || order.status || 'В обробці',
          total: order.totalAmount || order.total || 0,
          trackingNumber: order.trackingNumber,
          items: (order.products || []).map((item: any) => ({
            id: item.productVariationId || item.id,
            name: item.title || item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image || PLACEHOLDER_IMG,
          })),
        }));
        
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error("[profile] Failed to load orders:", error);
      if (!abortController?.signal.aborted) setOrders([]);
    } finally {
      if (!abortController?.signal.aborted) setOrdersLoading(false);
    }
  }, []);

  /* ── Check existing session ── */
  useEffect(() => {
    const abortController = new AbortController();
    
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { signal: abortController.signal });
        if (res.ok) {
          const data = await res.json();
          setLoggedEmail(data.email || "");
          setLoggedPhone(data.phone || "");
          setStep("profile");
          if (data.phone) {
            loadOrders(data.phone, abortController);
          }
          loadSitniksCustomer(abortController);
        } else {
          setStep("email");
        }
      } catch {
        if (!abortController.signal.aborted) {
          setStep("email");
        }
      }
    })();
    
    return () => { abortController.abort(); };
  }, [loadOrders, loadSitniksCustomer]);

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

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // DEV MODE: Skip OTP for testing
    if (email === "dev@test.com") {
      try {
        const res = await fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          const data = await res.json();
          setLoggedEmail(data.email);
          setStep("profile");
          setError("");
          setEmailError("");
          return;
        }
      } catch (error) {
        console.error("Dev login failed:", error);
      }
    }
    
    const normalized = normalizeEmailForApi(email);
    if (!isValidEmail(email)) {
      setEmailError("Email некоректний");
      setError("Введіть коректну email адресу");
      return;
    }
    setBusy(true);
    setError("");
    setEmailError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data.error ?? "Спробуйте ще раз через 60 с.");
        }
        throw new Error(data.error ?? "Помилка відправлення коду. Спробуйте ще раз.");
      }
      setStep("otp");
      startResendTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOtp = useCallback(async (e: React.FormEvent | { preventDefault: () => void }) => {
    e.preventDefault();
    if (otpString.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizeEmailForApi(email), otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Невірний код");
      setLoggedEmail(data.email);
      setLoggedPhone(data.phone || "");
      setStep("profile");
      if (data.phone) {
        loadOrders(data.phone, undefined);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка перевірки. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  }, [otpString, email, loadOrders]);

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
  }, [otpString, busy, handleVerifyOtp]);

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
    setEmail("");
    window.location.href = "/profile";
  };

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={36} className="text-emerald-600 animate-spin" />
      </div>
    );
  }

  /* ── EMAIL STEP ── */
  if (step === "email") {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8">
            <ChevronLeft size={16} />
            На головну
          </Link>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700" />
            <div className="p-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Mail size={30} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Особистий кабінет</h1>
              <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
                Введіть вашу email адресу. Ми надішлемо код підтвердження для входу.
              </p>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Email адреса</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                      setError("");
                    }}
                    onBlur={() => {
                      if (email.trim() && !isValidEmail(email)) setEmailError("Email некоректний");
                      else setEmailError("");
                    }}
                    placeholder="example@email.com"
                    disabled={busy}
                    autoComplete="email"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed ${emailError ? "border-red-400 bg-red-50/50" : "border-gray-200"}`}
                  />
                  {emailError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {emailError}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !email.trim() || !isValidEmail(email)}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-emerald-200"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  {busy ? "Відправляємо…" : "Отримати код"}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
                Код підтвердження буде надіслано на вказану email адресу.
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
            onClick={() => { setStep("email"); setError(""); setEmailError(""); setOtp(["", "", "", "", "", ""]); }}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8"
          >
            <ChevronLeft size={16} />
            Змінити email
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700" />
            <div className="p-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <KeyRound size={30} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Введіть код</h1>
              <p className="text-sm text-gray-500 text-center mb-1 leading-relaxed">
                Код надіслано на email
              </p>
              <p className="text-sm font-black text-gray-900 text-center mb-7">{email}</p>

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
                        className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition disabled:opacity-60"
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
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-emerald-200"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {busy ? "Перевіряємо…" : "Підтвердити"}
                </button>
              </form>

              <div className="flex items-center justify-center gap-2 mt-5">
                <button
                  onClick={handleResend}
                  disabled={resendIn > 0 || busy}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
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

  /* ── ADD PHONE STEP ── */
  if (step === "add-phone") {
    const handleAddPhone = async (e: React.FormEvent) => {
      e.preventDefault();
      const normalized = normalizePhoneForApi(phone);
      if (!isValidPhone(phone)) {
        setPhoneError("Номер некоректний");
        setError("Введіть номер у форматі +38 (0XX) XXX-XX-XX");
        return;
      }
      setBusy(true);
      setError("");
      setPhoneError("");
      try {
        const res = await fetch("/api/auth/update-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalized }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Помилка додавання номера");
        }
        setLoggedPhone(normalized);
        setPhone("");
        setStep("profile");
        loadOrders(normalized, undefined);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Помилка. Спробуйте ще раз.");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 transition-opacity duration-300">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => { setStep("profile"); setError(""); setPhoneError(""); setPhone(""); }}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8"
          >
            <ChevronLeft size={16} />
            Назад до профілю
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-700" />
            <div className="p-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Shield size={30} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Підтвердження телефону</h1>
              <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
                Додайте номер телефону для отримання замовлень та сповіщень про доставку.
              </p>

              <form onSubmit={handleAddPhone} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Номер телефону</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (!raw.length) {
                        setPhone("");
                        setPhoneError("");
                        setError("");
                        return;
                      }
                      let ten = raw.length === 12 && raw.startsWith("38") ? raw.slice(2) : raw.slice(-10);
                      if (ten.length === 10 && ten.startsWith("8")) ten = "0" + ten.slice(1);
                      else if (ten.length === 9 && !ten.startsWith("0")) ten = "0" + ten;
                      setPhone(formatPhoneDisplay(ten));
                      setPhoneError("");
                      setError("");
                    }}
                    onBlur={() => {
                      if (phone.trim() && !isValidPhone(phone)) setPhoneError("Номер некоректний");
                      else setPhoneError("");
                    }}
                    placeholder="+38 (067) 123-45-67"
                    disabled={busy}
                    autoComplete="tel"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed ${phoneError ? "border-red-400 bg-red-50/50" : "border-gray-200"}`}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {phoneError}
                    </p>
                  )}
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
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-200"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {busy ? "Додаємо…" : "Додати номер"}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
                Номер телефону потрібен для відстеження замовлень через Ситнікс CRM
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PROFILE STEP ── */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 py-10 px-4">
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

        {/* Sitniks Customer Stats */}
        {sitniksCustomer && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={18} className="text-emerald-600" />
              <h3 className="font-black text-gray-900">Статистика покупок</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">{sitniksCustomer.ordersCount || 0}</p>
                <p className="text-xs text-gray-600 font-medium">Замовлень</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">
                  {sitniksCustomer.totalSpent ? sitniksCustomer.totalSpent.toLocaleString("uk-UA") : 0}
                </p>
                <p className="text-xs text-gray-600 font-medium">Витрачено, грн</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">
                  {sitniksCustomer.averageOrderValue ? Math.round(sitniksCustomer.averageOrderValue).toLocaleString("uk-UA") : 0}
                </p>
                <p className="text-xs text-gray-600 font-medium">Середній чек, грн</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">
                  {sitniksCustomer.lastOrderDate ? new Date(sitniksCustomer.lastOrderDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short" }) : "-"}
                </p>
                <p className="text-xs text-gray-600 font-medium">Останнє замовлення</p>
              </div>
            </div>
            {sitniksCustomer.createdAt && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Клієнт з {new Date(sitniksCustomer.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        )}

        {/* User card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Мій профіль</p>
              <p className="font-black text-gray-900 text-lg">
                {profileName.trim() ? `Привіт, ${profileName.trim()}!` : loggedEmail}
              </p>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle size={11} />
                Підтверджена пошта
              </p>
              <input
                type="text"
                value={profileName}
                onChange={(e) => {
                  const v = e.target.value;
                  setProfileName(v);
                }}
                placeholder="Додати ім'я"
                className="mt-2 w-full max-w-[200px] px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Phone verification block */}
        {!loggedPhone && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={18} className="text-blue-600" />
                  <h3 className="font-black text-gray-900">Підтвердіть телефон</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Додайте номер телефону для отримання замовлень та сповіщень
                </p>
              </div>
              <button
                onClick={() => setStep("add-phone")}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors text-sm"
              >
                <Plus size={14} />
                Додати
              </button>
            </div>
          </div>
        )}

        {/* Wishlist block */}
        {wishlistHydrated && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-emerald-600 fill-emerald-600" />
                <h2 className="text-lg font-black text-gray-900">Список бажань</h2>
              </div>
              <Link
                href="/wishlist"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
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
            <ShoppingBag size={18} className="text-emerald-600" />
            <h2 className="text-lg font-black text-gray-900">Мої замовлення</h2>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="text-emerald-600 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={36} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-500 mb-1">Замовлень поки немає</p>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                Ваші майбутні замовлення з ������� ����� будуть відображатися тут.
              </p>
              <Link
                href="/#catalog"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl transition-colors shadow-lg shadow-emerald-200 text-sm"
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
                          <Image src={product.image} alt={product.name} fill sizes="120px" className="object-cover" {...blurProps()} />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs font-semibold text-emerald-600">{product.price.toLocaleString("uk-UA")} грн</p>
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
                      <span className="font-black text-emerald-600">{order.total.toLocaleString("uk-UA")} грн</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {order.trackingNumber && (
                        <>
                          <Link
                            href={`/?ttn=${encodeURIComponent(order.trackingNumber)}#tracking`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100"
                          >
                            <Truck size={13} />
                            Відстежити ТТН
                          </Link>
                          <button
                            type="button"
                            onClick={async () => {
                              await navigator.clipboard?.writeText(order.trackingNumber!);
                              setCopiedTTN(order.trackingNumber!);
                              setTimeout(() => setCopiedTTN(null), 2000);
                            }}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                              copiedTTN === order.trackingNumber
                                ? "text-green-600 bg-green-50 border-green-100"
                                : "text-gray-500 hover:text-gray-700 bg-gray-50 border-gray-100"
                            }`}
                            title={`Скопіювати ТТН: ${order.trackingNumber}`}
                          >
                            {copiedTTN === order.trackingNumber ? (
                              <CheckCircle size={13} />
                            ) : (
                              <Copy size={13} />
                            )}
                            {copiedTTN === order.trackingNumber ? "Скопійовано!" : order.trackingNumber}
                          </button>
                        </>
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
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
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
          Потрібна допомога?{" "}
          <a
            href={`tel:${siteConfig.phone}`}
            className="text-emerald-600 font-semibold hover:underline"
          >
            Зателефонуйте
          </a>
        </p>
      </div>

      {/* Nova Poshta Tracking */}
      <ShopNovaPoshta />
      </div>
      <ShopFooter />
    </div>
  );
}



