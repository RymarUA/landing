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
import {
  Phone, KeyRound, LogOut, Package, ChevronLeft,
  Loader2, CheckCircle, RefreshCw, User, ShoppingBag,
  AlertCircle, ChevronRight,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */
type Step = "loading" | "phone" | "otp" | "profile";

interface Order {
  id: string | number;
  createdAt: string;
  status: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
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
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */
export function ProfileClient() {
  const [step, setStep]     = useState<Step>("loading");
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState("");
  const [loggedPhone, setLoggedPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError]   = useState("");
  const [busy, setBusy]     = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Check existing session ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setLoggedPhone(data.phone);
          setStep("profile");
          loadOrders(data.phone);
        } else {
          setStep("phone");
        }
      } catch {
        setStep("phone");
      }
    })();
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

  /* ── Load orders from API ── */
  const loadOrders = useCallback(async (_phone: string) => {
    setOrdersLoading(true);
    try {
      // In production: fetch from /api/profile/orders?phone=...
      // which queries Sitniks CRM by phone.
      // For now, return empty list with a friendly message.
      await new Promise((r) => setTimeout(r, 600)); // simulate network
      setOrders([]);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
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
    if (otp.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Невірний код");
      setLoggedPhone(data.phone);
      setStep("profile");
      loadOrders(data.phone);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка перевірки. Спробуйте ще раз.");
    } finally {
      setBusy(false);
    }
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedPhone("");
    setOrders([]);
    setOtp("");
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
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Помилка");
      setOtp("");
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
        <Loader2 size={36} className="text-rose-400 animate-spin" />
      </div>
    );
  }

  /* ── PHONE STEP ── */
  if (step === "phone") {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8">
            <ChevronLeft size={16} />
            На головну
          </Link>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />
            <div className="p-8">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <User size={30} className="text-rose-500" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 text-center mb-1">Особистий кабінет</h1>
              <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
                Введіть номер телефону, яким ви оформляли замовлення. Ми надішлемо код підтвердження.
              </p>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <InputField
                  label="Номер телефону"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+380671234567"
                  disabled={busy}
                  autoComplete="tel"
                />

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-sm text-red-600">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !phone.trim()}
                  className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-rose-200"
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
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => { setStep("phone"); setError(""); setOtp(""); }}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8"
          >
            <ChevronLeft size={16} />
            Змінити номер
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />
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
                {/* Big OTP input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">6-значний код</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(v);
                      setError("");
                    }}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    disabled={busy}
                    className="w-full text-center text-4xl font-black tracking-[0.4em] px-4 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-rose-400 transition disabled:opacity-60"
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
                  disabled={busy || otp.length !== 6}
                  className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-rose-200"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {busy ? "Перевіряємо…" : "Підтвердити"}
                </button>
              </form>

              {/* Resend */}
              <div className="flex items-center justify-center gap-2 mt-5">
                <button
                  onClick={handleResend}
                  disabled={resendIn > 0 || busy}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
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
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors font-semibold"
          >
            <LogOut size={15} />
            Вийти
          </button>
        </div>

        {/* User card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Мій профіль</p>
              <p className="font-black text-gray-900 text-lg">{loggedPhone}</p>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle size={11} />
                Підтверджений номер
              </p>
            </div>
          </div>
        </div>

        {/* Orders section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingBag size={18} className="text-rose-500" />
            <h2 className="text-lg font-black text-gray-900">Мої замовлення</h2>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="text-rose-400 animate-spin" />
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
                className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-2xl transition-colors shadow-lg shadow-rose-200 text-sm"
              >
                Перейти до каталогу
                <ChevronRight size={15} />
              </Link>
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
                      <span className="font-black text-rose-500">{order.total.toLocaleString("uk-UA")} грн</span>
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
            className="text-rose-500 font-semibold hover:underline"
          >
            Напишіть нам в Instagram
          </a>
        </p>
      </div>
    </div>
  );
}
