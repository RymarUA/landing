"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/admin-guard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  totalCustomers: number;
  activeCustomers: number;
  totalWishlistItems: number;
  totalViews: number;
  topCategories: { name: string; count: number }[];
  averagePriceRange: string;
  recentActivity: {
    customer: string;
    action: string;
    timestamp: string;
  }[];
}

export default function AdminAnalyticsPage() {
  return (
    <AdminGuard>
      <AdminAnalyticsContent />
    </AdminGuard>
  );
}

function AdminAnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("start", dateRange.start);
      if (dateRange.end) params.append("end", dateRange.end);

      const response = await fetch(`/api/admin/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("[admin/analytics] Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const exportData = async (format: "csv" | "pdf") => {
    try {
      const response = await fetch(`/api/admin/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("[AdminAnalytics] Export failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Аналитика клиентов</h1>
            <p className="text-gray-600 mt-2">Детальная статистика поведения клиентов</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => exportData("csv")} variant="outline">
              📊 Экспорт CSV
            </Button>
            <Button onClick={() => exportData("pdf")} variant="outline">
              📄 Экспорт PDF
            </Button>
          </div>
        </div>

        {/* Date Filter */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Период:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border rounded"
            />
            <span>по</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border rounded"
            />
            <Button onClick={() => setDateRange({ start: "", end: "" })} variant="outline">
              Сброс
            </Button>
          </div>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="text-sm font-medium text-gray-600">Всего клиентов</h3>
            <p className="text-2xl font-bold text-blue-600">{analytics?.totalCustomers || 0}</p>
          </Card>
          <Card className="p-6">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="text-sm font-medium text-gray-600">Активные клиенты</h3>
            <p className="text-2xl font-bold text-green-600">{analytics?.activeCustomers || 0}</p>
          </Card>
          <Card className="p-6">
            <div className="text-2xl mb-2">❤️</div>
            <h3 className="text-sm font-medium text-gray-600">Wishlist товаров</h3>
            <p className="text-2xl font-bold text-red-600">{analytics?.totalWishlistItems || 0}</p>
          </Card>
          <Card className="p-6">
            <div className="text-2xl mb-2">👁️</div>
            <h3 className="text-sm font-medium text-gray-600">Просмотры</h3>
            <p className="text-2xl font-bold text-purple-600">{analytics?.totalViews || 0}</p>
          </Card>
        </div>

        {/* Top Categories */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔝 Популярные категории</h2>
          <div className="space-y-3">
            {analytics?.topCategories.map((category, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700">{category.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(category.count / (analytics.topCategories[0]?.count || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{category.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📈 Последняя активность</h2>
          <div className="space-y-3">
            {analytics?.recentActivity.map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div>
                  <span className="font-medium">{activity.customer}</span>
                  <span className="text-gray-600 ml-2">{activity.action}</span>
                </div>
                <span className="text-sm text-gray-500">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
