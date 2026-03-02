"use client";
import { useState, KeyboardEvent } from "react";
import { Package, Truck, CheckCircle, Clock, MapPin, AlertCircle, Search } from "lucide-react";

/* ─── Ukrainian error messages ───────────────────────── */
function mapApiError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";

  if (msg.includes("404") || msg.includes("not found") || msg.includes("не знайдено")) {
    return "ТТН не знайдено. Перевірте правильність номеру або спробуйте пізніше — дані оновлюються протягом 1–2 годин після відправлення.";
  }
  if (msg.includes("400") || msg.includes("невалідний") || msg.includes("invalid")) {
    return "Невірний формат ТТН. Номер має містити 14 цифр, наприклад: 20400123456789.";
  }
  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many")) {
    return "Занадто багато запитів. Зачекайте хвилину та спробуйте ще раз.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("failed")) {
    return "Немає з'єднання з інтернетом. Перевірте мережу та спробуйте ще раз.";
  }
  if (msg.includes("500") || msg.includes("server")) {
    return "Сервер Нової Пошти тимчасово недоступний. Спробуйте через кілька хвилин або перевірте статус на сайті novaposhta.ua.";
  }
  return msg || "Не вдалося отримати статус посилки. Спробуйте пізніше або зверніться до підтримки Нової Пошти.";
}

/* ─── Skeleton loader ───────────────────────────────── */
function SkeletonResult() {
  return (
    <div className="mt-6 p-6 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-gray-200" />
        <div className="h-5 w-40 bg-gray-200 rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 rounded-md" />
        <div className="h-4 w-3/4 bg-gray-100 rounded-md" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-28 bg-gray-200 rounded-md mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="h-3 bg-gray-100 rounded-md flex-1" style={{ width: `${60 + i * 10}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tracking result ───────────────────────────────── */
interface TrackingData {
  status: string;
  details?: string;
  history?: Array<{ date: string; event: string }>;
}

function TrackingResult({ data }: { data: TrackingData }) {
  const isDelivered =
    data.status?.toLowerCase().includes("доставлено") ||
    data.status?.toLowerCase().includes("отримано");

  return (
    <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${
            isDelivered ? "bg-green-500" : "bg-blue-500 animate-pulse"
          }`}
        />
        <p className="font-bold text-lg text-gray-900">{data.status || "Статус невідомий"}</p>
      </div>

      {data.details && <p className="text-gray-600 text-sm leading-relaxed">{data.details}</p>}

      {data.history && data.history.length > 0 && (
        <div className="mt-4">
          <p className="font-semibold text-gray-800 text-sm mb-2">Історія руху:</p>
          <ul className="space-y-2">
            {data.history.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <Clock size={13} className="mt-0.5 flex-shrink-0 text-gray-400" />
                <span>
                  <span className="font-medium">{item.date}</span> — {item.event}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ────────────────────────────────── */
export function ShopNovaPoshta() {
  const [ttn, setTtn] = useState("");
  const [status, setStatus] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const track = async () => {
    const trimmed = ttn.trim();
    if (!trimmed) {
      setError("Введіть номер ТТН — 14 цифр без пробілів.");
      return;
    }
    if (!/^\d{10,20}$/.test(trimmed)) {
      setError("Номер ТТН має містити тільки цифри (10–20 символів). Перевірте і спробуйте ще раз.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus(null);

    try {
      const res = await fetch(`/api/track-np?ttn=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setStatus(data as TrackingData);
    } catch (err: unknown) {
      setError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") track();
  };

  const steps = [
    {
      icon: <Package size={22} />,
      title: "Замовлення з Китаю",
      desc: "Ми відбираємо товари від перевірених постачальників",
    },
    {
      icon: <Truck size={22} />,
      title: "Доставка Новою Поштою",
      desc: "Швидко та надійно по всій Україні",
    },
    {
      icon: <MapPin size={22} />,
      title: "Отримання",
      desc: "У відділенні, поштоматі або кур'єром",
    },
    {
      icon: <CheckCircle size={22} />,
      title: "Відео розпакування",
      desc: "Знімаємо кожну посилку — ви бачите товар до отримання",
    },
  ];

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-start">

          {/* ── Left: Tracking ── */}
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-center mb-2 text-gray-900">
                Відстеження посилки
              </h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Введіть номер ТТН із SMS від Нової Пошти
              </p>

              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={ttn}
                    onChange={(e) => {
                      setTtn(e.target.value);
                      if (error) setError(""); // Clear error on typing
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="20400123456789"
                    maxLength={20}
                    inputMode="numeric"
                    className={`w-full px-5 py-4 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base transition ${
                      error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                  />
                  <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <button
                  onClick={track}
                  disabled={loading || !ttn.trim()}
                  className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      {/* Spinner */}
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Перевіряємо...
                    </>
                  ) : (
                    "Відстежити"
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Skeleton while loading */}
              {loading && <SkeletonResult />}

              {/* Result */}
              {!loading && status && <TrackingResult data={status} />}
            </div>

            {/* Help note */}
            <p className="text-xs text-gray-400 text-center mt-3">
              Дані оновлюються кожні 1–2 години. Якщо ТТН щойно створено — спробуйте через годину.
            </p>
          </div>

          {/* ── Right: How it works ── */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
              Як це працює
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-6">
              Доставка Новою Поштою
              <br />
              <span className="text-blue-600">з Китаю в Україну</span>
            </h2>
            <div className="space-y-5">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{step.title}</div>
                    <div className="text-gray-600 text-sm">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="text-blue-800 font-semibold text-sm">
                🎥 Знімаємо відео розпакування кожної посилки — ніяких сюрпризів!
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
