"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin-guard";
// import { getCustomerActivity } from "@/lib/sitniks-custom-fields";

interface CustomerActivityData {
  customerId: number;
  fullname: string;
  email: string;
  phone: string;
  wishlist: number[];
  lastViewed: number[];
  viewCount: number;
  categories: string[];
  priceRange: string;
  notifications: string[];
  lastActivity: string;
}

export default function CustomerAnalyticsPage() {
  return (
    <AdminGuard>
      <CustomerAnalyticsContent />
    </AdminGuard>
  );
}

function CustomerAnalyticsContent() {
  const [activities, setActivities] = useState<CustomerActivityData[]>([]);
  const [loading, setLoading] = useState(false);

  // Тестовые данные для демонстрации
  const testCustomers = useMemo(() => [
    { id: 4769814, fullname: "devtest", email: "dev@test.com", phone: "+380508888888" },
  ], []);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const results: CustomerActivityData[] = [];
      
      for (const customer of testCustomers) {
        try {
          const response = await fetch(`/api/customer-activity?id=${customer.id}`);
          console.log(`[customer-analytics] Response for customer ${customer.id}:`, response.status);
          if (response.ok) {
            const activity = await response.json();
            console.log(`[customer-analytics] Activity data:`, activity);
            results.push({
              customerId: customer.id,
              ...customer,
              ...activity,
            });
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        } catch (error) {
          console.warn(`[customer-analytics] Failed to load activity for customer ${customer.id}:`, error);
          // Добавляем пустую активность если ошибка
          results.push({
            customerId: customer.id,
            ...customer,
            wishlist: [],
            lastViewed: [],
            viewCount: 0,
            categories: [],
            priceRange: "",
            notifications: [],
            lastActivity: new Date().toISOString(),
          });
        }
      }
      setActivities(results);
    } catch (error) {
      console.error("[customer-analytics] Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  }, [testCustomers]); // Добавляем testCustomers в зависимости

  useEffect(() => {
    loadActivities();
  }, [loadActivities]); // Добавляем loadActivities в зависимости

  const getRecommendations = (activity: CustomerActivityData) => {
    const recommendations = [];
    
    // Если смотрел бандажи, рекомендовать похожие
    if (activity.categories.includes("bandages")) {
      recommendations.push("Показать больше бандажей и ортопедических изделий");
    }
    
    // Если много просмотров, предложить скидку
    if (activity.viewCount > 10) {
      recommendations.push("Предложить скидку за лояльность");
    }
    
    // Если wishlist > 3 товаров, отправить email
    if (activity.wishlist.length > 3) {
      recommendations.push("Отправить email о скидках на wishlist");
    }
    
    // Если интересуется спортивными товарами
    if (activity.categories.includes("sports")) {
      recommendations.push("Показать новинки спортивных товаров");
    }
    
    return recommendations;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Customer Analytics
          </h1>
          <p className="text-gray-600">
            Анализ поведения клиентов и персонализированные рекомендации
          </p>
        </div>
        <Button 
          onClick={() => loadActivities()} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "🔄 Обновление..." : "🔄 Обновить данные"}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Загрузка данных...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((activity) => (
            <Card key={`customer-${activity.customerId}`} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activity.fullname}
                  </h3>
                  <p className="text-sm text-gray-600">{activity.email}</p>
                  <p className="text-sm text-gray-600">{activity.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">ID: {activity.customerId}</p>
                  <p className="text-xs text-gray-400">
                    Последняя активность:{" "}
                    {new Date(activity.lastActivity).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-600 font-semibold">👁️ Просмотры</p>
                  <p className="text-xl font-bold text-blue-900">{activity.viewCount}</p>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-sm text-red-600 font-semibold">❤️ Wishlist</p>
                  <p className="text-xl font-bold text-red-900">{activity.wishlist.length}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    📂 Интересующие категории:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {activity.categories.length > 0 ? (
                      activity.categories.map((category) => (
                        <span
                          key={category}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {category}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">Нет данных</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">💰 Бюджет:</p>
                  <p className="text-sm text-gray-600">
                    {activity.priceRange || "Не определен"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">🔔 Уведомления:</p>
                  <div className="flex flex-wrap gap-1">
                    {activity.notifications.length > 0 ? (
                      activity.notifications.map((notification) => (
                        <span
                          key={notification}
                          className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                        >
                          {notification}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">Нет подписок</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">🎯 Рекомендации:</p>
                  <div className="space-y-1">
                    {getRecommendations(activity).length > 0 ? (
                      getRecommendations(activity).map((rec, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {rec}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">
                        Недостаточно данных для рекомендаций
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">🤖 Как работает &quot;обучение&quot;:</h3>
        <div className="space-y-2 text-sm text-yellow-800">
          <p>• <strong>Просмотры:</strong> Система запоминает какие товары смотрит клиент</p>
          <p>• <strong>Категории:</strong> Определяет интересующие категории товаров</p>
          <p>• <strong>Бюджет:</strong> Анализирует ценовой диапазон клиента</p>
          <p>• <strong>Wishlist:</strong> Отслеживает самые желанные товары</p>
          <p>• <strong>Рекомендации:</strong> На основе данных предлагает персональные товары и скидки</p>
        </div>
      </div>
    </div>
  );
}
