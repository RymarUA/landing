// @ts-nocheck
/**
 * lib/sitniks-customers.ts
 *
 * Sitniks CRM customer management integration.
 * Handles customer search, creation, and synchronization.
 *
 * ENV VARS:
 *   SITNIKS_API_URL - Base URL (no trailing slash)
 *   SITNIKS_API_KEY - Bearer token
 */

import { SitniksOrder } from "./sitniks-consolidated";

// ─── Types ────────────────────────────────────────────────────────

// Расширить интерфейс SitniksCustomer для реферальной программы
export interface SitniksCustomer {
  id: number;
  fullname: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  ordersCount?: number;
  totalSpent?: number;
  lastOrderAt?: string;
  
  // Поля реферальной программы
  referralCode?: string;           // Уникальный код клиента
  referredBy?: string;             // Кто пригласил
  referralCount?: number;          // Сколько пригласил
  referralEarnings?: number;      // Заработок на рефералах
  
  // Поля статистики
  totalOrders?: number;
  totalSpentAmount?: number;
  averageOrderValue?: number;
  lastOrderDate?: string;
  
  // Дополнительные поля
  note?: string;
  comment?: string;  // Альтернативное поле для заметок
  discount?: number;
  isBlocked?: boolean;
  type?: string;
  
  // Custom fields из Sitniks API
  customFields?: Array<{
    id?: number;
    code: string;
    value: string;
    name?: string;
  }>;
}

export interface CreateCustomerDto {
  fullname: string;
  phone?: string;
  email?: string;
  comment?: string;
}

export interface UpdateCustomerDto {
  fullname?: string;
  phone?: string;
  email?: string;
  comment?: string;
  referralCode?: string;         // Для установки реферального кода
  referredBy?: string;           // Для установки пригласившего
}

// Новая сущность для отслеживания рефералов
export interface SitniksReferral {
  id: number;
  referrerId: number;            // ID пригласившего клиента
  referredCustomerId: number;    // ID приглашенного клиента
  referralCode: string;          // Код приглашения
  status: 'pending' | 'completed'; // Статус (сделал заказ или нет)
  rewardAmount?: number;         // Награда в грн
  createdAt: string;
  completedAt?: string;
}

// ─── HTTP Client ───────────────────────────────────────────────────

const SITNIKS_TIMEOUT_MS = 8000;

export async function sitniksRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.SITNIKS_API_URL;
  const apiKey = process.env.SITNIKS_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Sitniks API not configured");
  }

  const url = `${baseUrl}${endpoint}`;
  console.log("[sitniksRequest] Request URL:", url);
  console.log("[sitniksRequest] API Key configured:", !!apiKey);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITNIKS_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    console.log("[sitniksRequest] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Sitniks API error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Sitniks API timeout");
    }
    throw error;
  }
}

/**
 * Generate unique fallback phone number for customers without phone
 */
function generateFallbackPhone(): string {
  // Generate random mobile number to avoid collisions
  const randomSuffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+38050${randomSuffix}`;
}

/**
 * Search customers by email or phone
 */
export async function searchSitniksCustomer(
  email?: string,
  phone?: string
): Promise<SitniksCustomer | null> {
  try {
    let endpoint = "/open-api/clients";
    const params = new URLSearchParams();
    
    if (email) params.append("email", email);
    if (phone) params.append("phone", phone);
    params.append("limit", "10");
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    console.log("[sitniks-customers] Making request to:", endpoint);
    const response = await sitniksRequest<any>(endpoint);
    console.log("[sitniks-customers] API response:", response.clients?.length || 0, "clients found");
    
    // Open API возвращает ClientListEntity с массивом clients
    if (response.clients && response.clients.length > 0) {
      return response.clients[0];
    }
    return null;
  } catch (error) {
    console.error("[sitniks-customers] Search failed:", error);
    return null;
  }
}

/**
 * Get customer by ID with order statistics
 */
export async function getSitniksCustomer(id: number): Promise<SitniksCustomer | null> {
  try {
    const customer = await sitniksRequest<SitniksCustomer>(`/open-api/clients/${id}`);
    
    // Enrich with order statistics - try orders endpoint but don't fail if it doesn't work
    try {
      const orders = await sitniksRequest<SitniksOrder[]>(`/api/v1/orders?customerId=${id}`);
      const completedOrders = orders.filter(order => 
        order.status?.name === "Відправлено" || order.status?.name === "Доставлено"
      );
      
      customer.ordersCount = orders.length;
      customer.totalSpent = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      customer.lastOrderAt = orders.length > 0 ? 
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt : 
        undefined;
    } catch (_error) {
      console.warn("[sitniks-customers] Orders endpoint not available, using defaults");
      // Set default values if orders endpoint fails
      customer.ordersCount = 0;
      customer.totalSpent = 0;
      customer.lastOrderAt = undefined;
    }
    
    return customer;
  } catch (error) {
    console.error("[sitniks-customers] Get failed:", error);
    return null;
  }
}

/**
 * Create new customer in Sitniks
 */
export async function createSitniksCustomer(
  data: CreateCustomerDto
): Promise<SitniksCustomer | null> {
  try {
    // Ensure phone is a valid mobile number if provided
    let phone = data.phone;
    if (phone) {
      // Format phone to ensure it's a valid mobile number
      phone = phone.replace(/[^0-9+]/g, ''); // Remove all non-numeric chars except +
      if (!phone.startsWith('+380')) {
        phone = '+380' + phone.replace(/^\+?380?/, ''); // Add +380 prefix if missing
      }
      // Ensure it's a mobile number (starts with +380 and has 12 digits total)
      if (!/^\+380[0-9]{9}$/.test(phone)) {
        console.warn("[sitniks-customers] Invalid mobile phone format, using generated fallback");
        phone = generateFallbackPhone();
      }
    } else {
      phone = generateFallbackPhone(); // Generate unique fallback if not provided
    }

    const customer = await sitniksRequest<SitniksCustomer>("/open-api/clients", {
      method: "POST",
      body: JSON.stringify({
        fullname: data.fullname || 'Клієнт',
        email: data.email,
        phone: phone,
      }),
    });
    console.log(`[sitniks-customers] Created customer: ${customer.id} (${customer.email})`);
    return customer;
  } catch (error) {
    console.error("[sitniks-customers] Create failed:", error);
    return null;
  }
}

/**
 * Update existing customer in Sitniks
 */
export async function updateSitniksCustomer(
  id: number,
  data: UpdateCustomerDto
): Promise<SitniksCustomer | null> {
  try {
    const customer = await sitniksRequest<SitniksCustomer>(`/open-api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    
    console.log(`[sitniks-customers] Updated customer: ${id}`);
    return customer;
  } catch (error) {
    console.error("[sitniks-customers] Update failed:", error);
    return null;
  }
}

/**
 * Генерация уникального реферального кода
 */
export function generateReferralCode(customerId: number): string {
  const timestamp = Date.now().toString(36);
  const hash = Buffer.from(customerId.toString()).toString('base64').slice(0, 6).toUpperCase();
  return `REF_${hash}_${timestamp}`;
}

/**
 * Поиск клиента по реферальному коду через Sitniks Open API
 * Использует поиск по comment для оптимизации вместо загрузки всех клиентов
 */
export async function findCustomerByReferralCode(referralCode: string): Promise<SitniksCustomer | null> {
  try {
    // Валидация входных данных
    if (!referralCode || typeof referralCode !== 'string') {
      console.error("[sitniks-customers] Invalid referral code provided");
      return null;
    }

    // Используем поиск по comment поле через API фильтр
    const searchQuery = encodeURIComponent(referralCode);
    const response = await sitniksRequest<any>(`/open-api/clients?search=${searchQuery}&limit=10`);
    
    if (response.clients && response.clients.length > 0) {
      // Дополнительная проверка точного совпадения
      const customer = response.clients.find((client: any) => 
        client.comment?.includes(referralCode) ||
        client.customFields?.some((field: any) => field.value === referralCode)
      );
      
      return customer || null;
    }
    
    return null;
  } catch (error) {
    console.error("[sitniks-customers] Find by referral code failed:", error);
    return null;
  }
}

/**
 * Enrich customer with order statistics and source tracking
 */
export async function enrichCustomerWithStats(
  customerId: number,
  stats: {
    ordersCount?: number;
    totalSpent?: number;
    lastOrderAt?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer?: string;
  }
): Promise<boolean> {
  try {
    const customer = await getSitniksCustomer(customerId);
    if (!customer) {
      console.error("[sitniks-customers] Customer not found for enrichment:", customerId);
      return false;
    }

    // Build custom fields for tracking
    const customFields = customer.customFields || [];
    
    // Update or add statistics fields
    if (stats.ordersCount !== undefined) {
      const field = customFields.find(f => f.code === "orders_count");
      if (field) {
        field.value = String(stats.ordersCount);
      } else {
        customFields.push({
          code: "orders_count",
          name: "Orders Count",
          value: String(stats.ordersCount),
        });
      }
    }
    
    if (stats.totalSpent !== undefined) {
      const field = customFields.find(f => f.code === "total_spent");
      if (field) {
        field.value = String(stats.totalSpent);
      } else {
        customFields.push({
          code: "total_spent",
          name: "Total Spent",
          value: String(stats.totalSpent),
        });
      }
    }
    
    if (stats.lastOrderAt) {
      const field = customFields.find(f => f.code === "last_order_at");
      if (field) {
        field.value = stats.lastOrderAt;
      } else {
        customFields.push({
          code: "last_order_at",
          name: "Last Order Date",
          value: stats.lastOrderAt,
        });
      }
    }

    // Add source tracking on first order
    if (stats.ordersCount === 1) {
      if (stats.utm_source) {
        customFields.push({
          code: "first_utm_source",
          name: "First UTM Source",
          value: stats.utm_source,
        });
      }
      if (stats.utm_medium) {
        customFields.push({
          code: "first_utm_medium",
          name: "First UTM Medium",
          value: stats.utm_medium,
        });
      }
      if (stats.utm_campaign) {
        customFields.push({
          code: "first_utm_campaign",
          name: "First UTM Campaign",
          value: stats.utm_campaign,
        });
      }
      if (stats.referrer) {
        customFields.push({
          code: "first_referrer",
          name: "First Referrer",
          value: stats.referrer,
        });
      }
    }

    // Update customer with enriched data
    const updated = await updateSitniksCustomer(customerId, {
      comment: customer.comment,
    });

    console.log(`[sitniks-customers] Enriched customer ${customerId} with stats:`, stats);
    return updated !== null;
  } catch (error) {
    console.error("[sitniks-customers] Failed to enrich customer:", error);
    return false;
  }
}

/**
 * Find or create customer (used during registration)
 */
export async function findOrCreateSitniksCustomer(
  email?: string,
  phone?: string,
  fullname?: string
): Promise<{ customer: SitniksCustomer; created: boolean } | null> {
  try {
    console.log("[sitniks-customers] findOrCreate called:", { email, phone, fullname });
    
    // Validate input
    if (!email && !phone) {
      throw new Error("Email or phone is required");
    }
    
    // First try to find by email
    console.log("[sitniks-customers] Searching by email:", email);
    let customer = await searchSitniksCustomer(email);
    console.log("[sitniks-customers] Search result:", customer ? "found" : "not found");
    
    if (customer) {
      // Update with additional info if provided
      if (phone && !customer.phone) {
        customer = await updateSitniksCustomer(customer.id, { phone }) || customer;
      }
      if (fullname && customer.fullname !== fullname) {
        customer = await updateSitniksCustomer(customer.id, { fullname }) || customer;
      }
      return { customer, created: false };
    }
    
    // Try to find by phone if provided
    if (phone) {
      console.log("[sitniks-customers] Searching by phone:", phone);
      customer = await searchSitniksCustomer(undefined, phone);
      if (customer) {
        console.log("[sitniks-customers] Found customer by phone:", customer.id);
        // Update email if missing
        if (email && !customer.email) {
          customer = await updateSitniksCustomer(customer.id, { email }) || customer;
        }
        if (fullname && customer.fullname !== fullname) {
          customer = await updateSitniksCustomer(customer.id, { fullname }) || customer;
        }
        return { customer, created: false };
      }
      
      // Try different phone formats
      const phoneFormats = [
        phone.replace('+', ''),           // 380507877430
        phone.replace('+380', ''),        // 507877430
        phone.replace('+', '00'),        // 00380507877430
        phone.replace(/\s/g, ''),         // +380507877430 (no spaces)
        phone.replace(/[-\s]/g, ''),     // +380507877430 (no dashes/spaces)
      ];
      
      for (const format of phoneFormats) {
        if (format !== phone) {
          console.log("[sitniks-customers] Trying phone format:", format);
          customer = await searchSitniksCustomer(undefined, format);
          if (customer) {
            console.log("[sitniks-customers] Found customer with format:", format, customer.id);
            return { customer, created: false };
          }
        }
      }
    }
    
    // Create new customer
    const newCustomer = await createSitniksCustomer({
      fullname: fullname || (email ? email.split("@")[0] : "Клієнт"), // Use email prefix or default name
      email: email || undefined,
      phone: phone || undefined,
      comment: "Зареєстрований через сайт",
    });
    
    if (!newCustomer) return null;
    
    return { customer: newCustomer, created: true };
  } catch (error) {
    console.error("[sitniks-customers] Find or create failed:", error);
    return null;
  }
}

/**
 * Get customer statistics for profile
 */
export async function getSitniksCustomerStats(
  customerId: number
): Promise<{
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  averageOrderValue: number;
}> {
  try {
    const orders = await sitniksRequest<SitniksOrder[]>(`/api/v1/orders?customerId=${customerId}`);
    const completedOrders = orders.filter(order => 
      order.status?.name === "Відправлено" || order.status?.name === "Доставлено"
    );
    
    const totalSpent = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const lastOrder = orders.length > 0 ? 
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : 
      null;
    
    return {
      ordersCount: orders.length,
      totalSpent,
      lastOrderDate: lastOrder?.createdAt,
      averageOrderValue: completedOrders.length > 0 ? totalSpent / completedOrders.length : 0,
    };
  } catch (error) {
    console.error("[sitniks-customers] Stats failed:", error);
    // Return default stats when API fails
    return {
      ordersCount: 0,
      totalSpent: 0,
      averageOrderValue: 0,
    };
  }
}
