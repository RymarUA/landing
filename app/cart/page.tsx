// @ts-nocheck
"use client";

import { useCart } from "@/components/cart-context";
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalCount,
    totalPrice,
    totalSavings,
    hydrated,
  } = useCart();

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white hover:bg-gray-100 transition-colors"
            aria-label="Повернутися на головну"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Кошик</h1>
          {totalCount > 0 && (
            <span className="bg-emerald-100 text-emerald-600 text-sm font-bold px-3 py-1 rounded-full">
              {totalCount} {totalCount === 1 ? "товар" : totalCount < 5 ? "товари" : "товарів"}
            </span>
          )}
        </div>

        {items.length === 0 ? (
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
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <motion.div
                  key={`${item.id}-${item.size ?? ""}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{item.name}</h3>
                    {item.size && (
                      <p className="text-sm text-gray-500 mb-2">Розмір: {item.size}</p>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                          className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                          aria-label="Зменшити"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-base font-bold text-gray-900 w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                          className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                          aria-label="Збільшити"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm text-gray-400">× {item.price} грн</span>
                    </div>

                    <p className="text-emerald-600 font-black text-lg mt-2">
                      {(item.price * item.quantity).toLocaleString("uk-UA")} грн
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id, item.size)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                    aria-label="Видалити"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}

              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 font-semibold py-3 rounded-2xl transition-colors border border-gray-200"
                >
                  <Trash2 size={16} />
                  Очистити кошик
                </button>
              )}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
                <h2 className="text-lg font-black text-gray-900 mb-4">Підсумок замовлення</h2>
                
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Товарів:</span>
                    <span className="font-semibold text-gray-900">{totalCount} шт.</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Знижка:</span>
                      <span className="font-semibold text-green-600">
                        -{totalSavings.toLocaleString("uk-UA")} грн
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-gray-600 text-sm">Разом:</span>
                  <span className="text-3xl font-black text-gray-900">
                    {totalPrice.toLocaleString("uk-UA")} грн
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-200 mb-3"
                >
                  Оформити замовлення
                </Link>

                <Link
                  href="/#catalog"
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition-colors"
                >
                  Продовжити покупки
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
