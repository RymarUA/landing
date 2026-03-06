"use client";

/**
 * FamilyHub Market — Адмін-панель
 * Файл: app/admin/page.tsx
 *
 * Як підключити:
 * 1. Скопіюй цей файл в app/admin/page.tsx
 * 2. Скопіюй lib/admin-store.ts (другий файл) в lib/admin-store.ts
 * 3. Відкрий /admin в браузері
 * 4. Пароль за замовчуванням: admin2024 (змінити в ADMIN_PASSWORD нижче)
 */

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Plus, Trash2, Save, Eye, LogOut,
  Package, Tag, Star, BarChart2,
  X, Check,
  Percent, Flame, Sparkles,
  AlertCircle, Upload, Search,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice: number | null;
  category: string;
  badge: string | null;
  badgeColor: string;
  isHit: boolean;
  isNew: boolean;
  rating: number;
  reviews: number;
  stock: number;
  sizes: string[];
  description: string;
  image: string;
  visible: boolean;
}

// ⚠️  Для продакшену: перенести перевірку в API route /api/admin/login
// та використовувати httpOnly cookie замість стану React.
// Зараз: проста перевірка на клієнті (підходить для особистого використання).
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

const BADGE_OPTIONS = [
  { label: "— Без бейджа —", value: "", color: "" },
  { label: "🔥 ХІТ", value: "ХІТ", color: "bg-amber-400 text-gray-900" },
  { label: "✨ Новинка", value: "Новинка", color: "bg-orange-500 text-white" },
  { label: "💸 Знижка", value: "Знижка", color: "bg-red-500 text-white" },
  { label: "⚡ Топ", value: "Топ", color: "bg-orange-500 text-white" },
  { label: "🎁 Акція", value: "Акція", color: "bg-purple-500 text-white" },
];

const CATEGORIES = ["Для чоловіків", "Для жінок", "Для дітей", "Іграшки", "Дім", "Авто"];

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "",
  price: 0,
  oldPrice: null,
  category: "Для чоловіків",
  badge: null,
  badgeColor: "bg-amber-400 text-gray-900",
  isHit: false,
  isNew: false,
  rating: 5.0,
  reviews: 0,
  stock: 10,
  sizes: [],
  description: "",
  image: "",
  visible: true,
};

// ── Helpers ──────────────────────────────────────────────
function getDiscount(price: number, oldPrice: number | null) {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem("fhm_admin_products");
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default mock products
  return [
    {
      id: 1, name: "Кросівки Nike Air (репліка)", price: 1200, oldPrice: 1800,
      category: "Для чоловіків", badge: "ХІТ", badgeColor: "bg-amber-400 text-gray-900",
      isHit: true, isNew: false, rating: 4.8, reviews: 48, stock: 3,
      sizes: ["36","37","38","39","40"], description: "Легкі кросівки з амортизацією Air Max.",
      image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
      visible: true,
    },
    {
      id: 2, name: "Кросівки Adidas Ultraboost", price: 950, oldPrice: null,
      category: "Для жінок", badge: "Новинка", badgeColor: "bg-orange-500 text-white",
      isHit: false, isNew: true, rating: 4.6, reviews: 32, stock: 12,
      sizes: ["36","37","38","39"], description: "Комфортні кросівки з підошвою Boost.",
      image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
      visible: true,
    },
    {
      id: 3, name: "Дитячий костюм (зріст 92)", price: 420, oldPrice: 580,
      category: "Для дітей", badge: "Новинка", badgeColor: "bg-orange-500 text-white",
      isHit: false, isNew: true, rating: 4.9, reviews: 19, stock: 5,
      sizes: ["86","92","98","104"], description: "М'який трикотажний костюм для малюків.",
      image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
      visible: true,
    },
  ];
}

function saveProducts(products: Product[]) {
  localStorage.setItem("fhm_admin_products", JSON.stringify(products));
}

// ── Sub-components ────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
  onToggleVisible,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
  onToggleVisible: (id: number) => void;
}) {
  const discount = getDiscount(product.price, product.oldPrice);
  return (
    <tr className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
      <td className="py-3 px-4">
        <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={20} />
            </div>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <p className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</p>
          {!(product.visible ?? true) && (
            <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">прихований</span>
          )}
        </div>
        <p className="text-xs text-gray-400">{product.category}</p>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="font-black text-gray-900">{product.price.toLocaleString("uk-UA")} грн</span>
          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through">{product.oldPrice} грн</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        {discount ? (
          <span className="bg-red-100 text-red-600 font-black text-xs px-2 py-1 rounded-full">-{discount}%</span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        {product.badge ? (
          <span className={`${product.badgeColor} text-xs font-bold px-2 py-1 rounded-full`}>
            {product.badge}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs font-bold ${product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-amber-500" : "text-green-600"}`}>
          {product.stock === 0 ? "Нема" : `${product.stock} шт.`}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-gray-700">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleVisible(product.id)}
            className={`p-2 rounded-xl transition-colors ${(product.visible ?? true) ? "bg-green-50 hover:bg-green-100 text-green-500" : "bg-gray-100 hover:bg-gray-200 text-gray-400"}`}
            title={(product.visible ?? true) ? "Приховати з каталогу" : "Показати в каталозі"}
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-500 transition-colors"
            title="Редагувати"
          >
            <Tag size={14} />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
            title="Видалити"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Product Editor Modal ──────────────────────────────────
function ProductEditor({
  product,
  onSave,
  onClose,
}: {
  product: Product | null;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const isNew = !product;
  const [form, setForm] = useState<Omit<Product, "id">>(
    product ? { ...product } : { ...EMPTY_PRODUCT }
  );
  const [sizeInput, setSizeInput] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (key: keyof Omit<Product, "id">, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleBadgeChange = (badgeValue: string) => {
    const opt = BADGE_OPTIONS.find((o) => o.value === badgeValue);
    set("badge", badgeValue || null);
    if (opt) set("badgeColor", opt.color);
  };

  const addSize = () => {
    const s = sizeInput.trim();
    if (s && !form.sizes.includes(s)) {
      set("sizes", [...form.sizes, s]);
    }
    setSizeInput("");
  };

  const handleSave = () => {
    if (!form.name.trim() || form.price <= 0) return;
    setSaved(true);
    setTimeout(() => {
      onSave({ ...form, id: product?.id ?? Date.now() });
      setEditingProduct_close(); // onClose called by parent via onSave
    }, 600);
  };
  // Alias so linter doesn't complain
  const setEditingProduct_close = onClose;

  const discount = getDiscount(form.price, form.oldPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">
            {isNew ? "➕ Новий товар" : "✏️ Редагувати товар"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Preview */}
          {form.image && (
            <div className="relative h-40 rounded-2xl overflow-hidden bg-gray-100">
              <img src={form.image} alt="preview" className="w-full h-full object-cover" />
              {discount && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black w-9 h-9 rounded-full flex items-center justify-center">
                  -{discount}%
                </span>
              )}
              {form.badge && (
                <span className={`absolute top-2 left-2 ${form.badgeColor} text-xs font-black px-2 py-1 rounded-full`}>
                  {form.badge}
                </span>
              )}
            </div>
          )}

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">URL зображення</label>
            <input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Назва товару *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Кросівки Nike Air..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Категорія</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                Ціна (грн) *
              </label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => set("price", Number(e.target.value))}
                placeholder="1200"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                Стара ціна (грн) {discount ? <span className="text-red-500 normal-case font-black">→ -{discount}%</span> : <span className="normal-case text-gray-400">(необов'язково)</span>}
              </label>
              <input
                type="number"
                value={form.oldPrice || ""}
                onChange={(e) => set("oldPrice", e.target.value ? Number(e.target.value) : null)}
                placeholder="1800"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Badge */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Бейдж на карточці</label>
            <div className="flex flex-wrap gap-2">
              {BADGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleBadgeChange(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                    (form.badge ?? "") === opt.value
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                >
                  {opt.label || "Без бейджа"}
                </button>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.isHit ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300"}`}>
              <input type="checkbox" checked={form.isHit} onChange={(e) => set("isHit", e.target.checked)} className="accent-amber-400 w-4 h-4" />
              <div>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><Flame size={14} className="text-amber-500" /> ХІТ продажів</p>
                <p className="text-xs text-gray-400">Показується в "Топ продажів"</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.isNew ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}>
              <input type="checkbox" checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)} className="accent-orange-400 w-4 h-4" />
              <div>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><Sparkles size={14} className="text-orange-500" /> Новинка</p>
                <p className="text-xs text-gray-400">Показується в "Нові надходження"</p>
              </div>
            </label>
          </div>

          {/* Stock + Rating */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Залишок (шт.)</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {form.stock <= 5 && form.stock > 0 && (
                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><Flame size={10} /> Покаже "Залишилось {form.stock} шт."</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Рейтинг (0–5)</label>
              <input
                type="number"
                min="0" max="5" step="0.1"
                value={form.rating}
                onChange={(e) => set("rating", Math.min(5, Math.max(0, Number(e.target.value))))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Відгуків (шт.)</label>
              <input
                type="number"
                value={form.reviews}
                onChange={(e) => set("reviews", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Розміри</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.sizes.map((s) => (
                <span key={s} className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {s}
                  <button onClick={() => set("sizes", form.sizes.filter((x) => x !== s))} className="hover:text-red-500 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
              {form.sizes.length === 0 && <span className="text-xs text-gray-400">Немає розмірів (для товарів без розміру)</span>}
            </div>
            <div className="flex gap-2">
              <input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSize()}
                placeholder="Введи розмір і натисни Enter"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={addSize}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Швидко: 36 37 38 → додай кожен окремо. Або число: 42, або букву: XL</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Опис (показується в модалці товару)</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Короткий опис товару..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Скасувати
          </button>
          {!form.name.trim() && (
            <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> Заповни назву</p>
          )}
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || form.price <= 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              saved
                ? "bg-green-500 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-200"
            }`}
          >
            {saved ? <><Check size={16} /> Збережено!</> : <><Save size={16} /> Зберегти товар</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────
export default function AdminPage() {
  // Require admin password to be set for security (only in production)
  if (process.env.NODE_ENV === "production" && !ADMIN_PASSWORD) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
            <p className="text-gray-600">NEXT_PUBLIC_ADMIN_PASSWORD environment variable is required for admin access in production.</p>
            <p className="text-sm text-gray-500 mt-2">Please set the environment variable and restart the application.</p>
          </div>
        </div>
      </div>
    );
  }

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null | "new">(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("Всі");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saved, setSaved] = useState(false);

  // Load on mount
  useEffect(() => {
    if (authed) setProducts(loadProducts());
  }, [authed]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const handleSaveProduct = useCallback((product: Product) => {
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      const next = exists
        ? prev.map((p) => (p.id === product.id ? product : p))
        : [...prev, product];
      saveProducts(next);
      return next;
    });
    // ✅ Modal closes itself after animation — no double-close
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleDelete = (id: number) => {
    if (deleteConfirm === id) {
      setProducts((prev) => { const next = prev.filter((p) => p.id !== id); saveProducts(next); return next; });
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(products, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fhm-products.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filtered = products
    .filter((p) => filterCategory === "Всі" || p.category === filterCategory)
    .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Stats
  const onSale = products.filter((p) => p.oldPrice && p.oldPrice > p.price).length;
  const lowStock = products.filter((p) => p.stock <= 5 && p.stock > 0).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  // ── Login screen ─────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
              <Package size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Адмін-панель</h1>
            <p className="text-gray-500 text-sm mt-1">FamilyHub Market</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                  pwError ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-orange-400"
                }`}
              />
              {pwError && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> Невірний пароль</p>}
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-200"
            >
              Увійти
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">
            Пароль за замовчуванням: <code className="bg-gray-100 px-1 rounded">admin2024</code><br/>
            Змінити в: <code className="bg-gray-100 px-1 rounded">ADMIN_PASSWORD</code>
          </p>
        </div>
      </div>
    );
  }

  // ── Main admin UI ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <span className="font-black text-gray-900">FamilyHub</span>
              <span className="font-black text-orange-500">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold bg-green-50 px-3 py-1.5 rounded-xl">
                <Check size={14} /> Збережено
              </span>
            )}
            <a href="/" target="_blank" className="flex items-center gap-1.5 text-gray-500 hover:text-orange-500 text-sm transition-colors">
              <Eye size={15} /> Переглянути сайт
            </a>
            <button
              onClick={() => setAuthed(false)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 text-sm transition-colors"
            >
              <LogOut size={15} /> Вийти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Package size={20} className="text-white" />} label="Всього товарів" value={products.length} color="bg-orange-500" />
          <StatCard icon={<Percent size={20} className="text-white" />} label="Зі знижкою" value={onSale} color="bg-red-500" />
          <StatCard icon={<Flame size={20} className="text-white" />} label="Закінчується" value={lowStock} color="bg-amber-500" />
          <StatCard icon={<BarChart2 size={20} className="text-white" />} label="Немає в наявності" value={outOfStock} color="bg-green-500" />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук товару..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="Всі">Всі категорії</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} /> Експорт JSON
          </button>
          <button
            onClick={() => setEditingProduct("new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-orange-200"
          >
            <Plus size={16} /> Додати товар
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide w-16">Фото</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Назва</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Ціна</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Знижка</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Бейдж</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Залишок</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Рейтинг</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide w-24">Дії</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Товарів не знайдено</p>
                    <button
                      onClick={() => setEditingProduct("new")}
                      className="mt-3 text-orange-500 text-sm font-bold hover:underline"
                    >
                      + Додати перший товар
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={(p) => setEditingProduct(p)}
                    onDelete={handleDelete}
                    onToggleVisible={(id) => {
                      setProducts((prev) => {
                        const next = prev.map((p) => p.id === id ? { ...p, visible: !p.visible } : p);
                        saveProducts(next);
                        return next;
                      });
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Delete hint */}
        {deleteConfirm !== null && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-3 z-50">
            <AlertCircle size={16} />
            Натисни ще раз — підтвердити видалення
            <button onClick={() => setDeleteConfirm(null)} className="ml-2 opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <p className="font-bold mb-1">📌 Як це працює</p>
          <p>Зміни зберігаються в <code className="bg-amber-100 px-1 rounded">localStorage</code> браузера.
          Щоб використати їх на сайті — натисни <strong>«Експорт JSON»</strong> і замінити масив товарів в <code className="bg-amber-100 px-1 rounded">lib/instagram-catalog.ts</code>.
          Або підключи Supabase для автоматичної синхронізації.</p>
        </div>
      </div>

      {/* Editor modal */}
      {editingProduct !== null && (
        <ProductEditor
          product={editingProduct === "new" ? null : editingProduct}
          onSave={handleSaveProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}
