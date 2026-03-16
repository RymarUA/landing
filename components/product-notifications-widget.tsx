// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, TrendingDown, Package, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useProductNotifications } from "@/hooks/use-product-tracking";

interface NotificationAlert {
  priceDrops: Array<{
    id: number;
    productId: number;
    productName: string;
    oldPrice: number;
    newPrice: number;
    discount: number;
    discountPercent: number;
  }>;
  backInStock: Array<{
    id: number;
    productId: number;
    productName: string;
    price: number;
    stock: number;
  }>;
  newArrivals: Array<{
    id: number;
    productId: number;
    productName: string;
    category: string;
    price: number;
  }>;
  total: number;
}

export function ProductNotificationsWidget() {
  const [alerts, setAlerts] = useState<NotificationAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const { getAlerts } = useProductNotifications();

  useEffect(() => {
    console.log("[ProductNotificationsWidget] Loading alerts...");
    loadAlerts();
  }, [loadAlerts]);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    console.log("[ProductNotificationsWidget] Fetching alerts...");
    const data = await getAlerts();
    if (data) {
      console.log("[ProductNotificationsWidget] Alerts loaded:", data.total, "total");
      setAlerts(data);
    } else {
      console.log("[ProductNotificationsWidget] No alerts data");
    }
    setLoading(false);
  }, [getAlerts]);

  const dismissAlert = (id: number) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  if (loading || !alerts || alerts.total === 0) {
    return null;
  }

  const visiblePriceDrops = alerts.priceDrops.filter(a => !dismissed.has(a.id));
  const visibleBackInStock = alerts.backInStock.filter(a => !dismissed.has(a.id));
  const visibleNewArrivals = alerts.newArrivals.filter(a => !dismissed.has(a.id));

  const totalVisible = visiblePriceDrops.length + visibleBackInStock.length + visibleNewArrivals.length;

  if (totalVisible === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <Bell size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-black text-gray-900">Сповіщення</h3>
          <p className="text-xs text-gray-500">{totalVisible} нових оновлень</p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {/* Price Drops */}
          {visiblePriceDrops.map((alert) => (
            <motion.div
              key={`price-${alert.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingDown size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm mb-1">Знижка на товар!</p>
                    <Link 
                      href={`/product/${alert.productId}`}
                      className="text-sm text-gray-700 hover:text-red-600 font-medium"
                    >
                      {alert.productName}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 line-through">
                        {alert.oldPrice.toLocaleString('uk-UA')} грн
                      </span>
                      <span className="text-lg font-black text-red-600">
                        {alert.newPrice.toLocaleString('uk-UA')} грн
                      </span>
                      <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded">
                        -{alert.discountPercent}%
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Back in Stock */}
          {visibleBackInStock.map((alert) => (
            <motion.div
              key={`stock-${alert.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm mb-1">Знову в наявності!</p>
                    <Link 
                      href={`/product/${alert.productId}`}
                      className="text-sm text-gray-700 hover:text-green-600 font-medium"
                    >
                      {alert.productName}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-black text-green-600">
                        {alert.price.toLocaleString('uk-UA')} грн
                      </span>
                      <span className="text-xs text-gray-500">
                        В наявності: {alert.stock} шт
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}

          {/* New Arrivals */}
          {visibleNewArrivals.map((alert) => (
            <motion.div
              key={`new-${alert.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm mb-1">Нова надходження!</p>
                    <Link 
                      href={`/product/${alert.productId}`}
                      className="text-sm text-gray-700 hover:text-purple-600 font-medium"
                    >
                      {alert.productName}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">{alert.category}</span>
                      <span className="text-lg font-black text-purple-600">
                        {alert.price.toLocaleString('uk-UA')} грн
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
