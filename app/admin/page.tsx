"use client";

import { AdminGuard } from "@/components/admin-guard";
import Link from "next/link";
import { BarChart3, Package, Users, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface RecentOrder {
  id: number;
  orderNumber: number;
  client: {
    fullname: string;
    phone?: string;
    email?: string;
  };
  totalAmount: number;
  status: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  newCustomers: number;
  newReferrals: number;
}

interface DashboardData {
  recentOrders: RecentOrder[];
  stats: DashboardStats;
}

export default function AdminPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Admin dashboard error:', err);
        setError('Не вдалося завантажити дані');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'новий':
      case 'new':
        return 'text-green-600';
      case 'обробка':
      case 'processing':
      case 'в роботі':
        return 'text-blue-600';
      case 'доставка':
      case 'shipping':
      case 'відправлено':
        return 'text-gray-600';
      case 'доставлено':
      case 'delivered':
        return 'text-purple-600';
      case 'скасовано':
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Адмін панель</h1>
            <p className="text-gray-600 mt-2">FamilyHub Market - Управління магазином</p>
          </div>

          {/* Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link
              href="/admin/analytics"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Аналітика</h3>
                  <p className="text-sm text-gray-600">Статистика продажів</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/products"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Товари</h3>
                  <p className="text-sm text-gray-600">Управління каталогом</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/customers"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Клієнти</h3>
                  <p className="text-sm text-gray-600">Управління клієнтами</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Налаштування</h3>
                  <p className="text-sm text-gray-600">Налаштування магазину</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Останні замовлення</h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="animate-pulse text-right">
                        <div className="h-4 bg-gray-200 rounded w-12 mb-2 ml-auto"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 ml-auto"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{error}</p>
                </div>
              ) : dashboardData?.recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Замовлень ще немає</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.client.fullname}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                        <p className={`text-sm ${getStatusColor(order.status.name)}`}>
                          {order.status.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика сьогодні</h2>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboardData?.stats.todayOrders || 0}
                    </p>
                    <p className="text-sm text-gray-600">Замовлень</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {dashboardData?.stats.todayRevenue ? 
                        `${(dashboardData.stats.todayRevenue / 1000).toFixed(1)}K` : 
                        '0'
                      }K
                    </p>
                    <p className="text-sm text-gray-600">Дохід</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {dashboardData?.stats.newCustomers || 0}
                    </p>
                    <p className="text-sm text-gray-600">Нових клієнтів</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {dashboardData?.stats.newReferrals || 0}
                    </p>
                    <p className="text-sm text-gray-600">Рефералів</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
