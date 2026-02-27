"use client";
import { useState } from "react";
import { Package, Truck, CheckCircle, Clock, MapPin, AlertCircle } from "lucide-react";

export function ShopNovaPoshta() {
  const [ttn, setTtn] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const track = async () => {
    if (!ttn.trim()) {
      setError("Введіть номер ТТН");
      return;
    }

    setLoading(true);
    setError("");
    setStatus(null);

    try {
      const res = await fetch(`/api/track-np?ttn=${ttn.trim()}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Помилка відстеження");
      }

      setStatus(data);
    } catch (err) {
      setError(err.message || "Не вдалося отримати статус. Перевірте номер ТТН.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { icon: <Package size={22} />, title: "Замовлення з Китаю", desc: "Ми відбираємо товари від перевірених постачальників" },
    { icon: <Truck size={22} />, title: "Доставка Новою Поштою", desc: "Швидко та надійно по всій Україні" },
    { icon: <MapPin size={22} />, title: "Отримання", desc: "У відділенні або кур'єром" },
    { icon: <CheckCircle size={22} />, title: "Відео розпакування", desc: "Знімаємо кожну посилку — ви бачите товар до отримання" },
  ];

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: трекинг + визуал */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">
                Відстеження посилки Новою Поштою
              </h3>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={ttn}
                  onChange={(e) => setTtn(e.target.value)}
                  placeholder="Введіть номер ТТН (наприклад: 20400000000000)"
                  className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />

                <button
                  onClick={track}
                  disabled={loading || !ttn.trim()}
                  className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Clock size={20} className="animate-spin" />
                      Перевіряємо...
                    </>
                  ) : (
                    "Відстежити"
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              {status && (
                <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${status.status === "Доставлено" ? "bg-green-500" : "bg-blue-500 animate-pulse"}`}></div>
                    <p className="font-bold text-lg">{status.status || "Статус невідомий"}</p>
                  </div>

                  <p className="text-gray-700">{status.details || ""}</p>

                  {status.history && status.history.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-800 mb-2">Історія руху:</p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {status.history.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Clock size={14} className="mt-1 flex-shrink-0 text-gray-500" />
                            <span>{item.date} — {item.event}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: шаги */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
              Як це працює
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-6">
              Доставка Новою Поштою<br />
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
                    <div className="text-gray-600">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="text-blue-800 font-semibold">
                🎥 Знімаємо відео розпакування кожної посилки — ніяких сюрпризів!
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}