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
}

// ─── HTTP Client ───────────────────────────────────────────────────

const SITNIKS_TIMEOUT_MS = 8000;

async function sitniksRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.SITNIKS_API_URL;
  const apiKey = process.env.SITNIKS_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Sitniks API not configured");
  }

  const url = `${baseUrl}${endpoint}`;
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

// ─── Customer Operations ────────────────────────────────────────────

/**
 * Search customers by email or phone
 */
export async function searchSitniksCustomer(
  email?: string,
  phone?: string
): Promise<SitniksCustomer | null> {
  try {
    let endpoint = "/api/v1/customers/search";
    const params = new URLSearchParams();
    
    if (email) params.append("email", email);
    if (phone) params.append("phone", phone);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const customers = await sitniksRequest<SitniksCustomer[]>(endpoint);
    return customers.length > 0 ? customers[0] : null;
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
    const customer = await sitniksRequest<SitniksCustomer>(`/api/v1/customers/${id}`);
    
    // Enrich with order statistics
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
    } catch (orderError) {
      console.warn("[sitniks-customers] Failed to fetch order stats:", orderError);
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
    const customer = await sitniksRequest<SitniksCustomer>("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify(data),
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
    const customer = await sitniksRequest<SitniksCustomer>(`/api/v1/customers/${id}`, {
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
 * Find or create customer (used during registration)
 */
export async function findOrCreateSitniksCustomer(
  email?: string,
  phone?: string,
  fullname?: string
): Promise<{ customer: SitniksCustomer; created: boolean } | null> {
  try {
    // Validate input
    if (!email && !phone) {
      throw new Error("Email or phone is required");
    }
    
    // First try to find by email
    let customer = await searchSitniksCustomer(email);
    
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
      customer = await searchSitniksCustomer(undefined, phone);
      if (customer) {
        // Update email if missing
        if (email && !customer.email) {
          customer = await updateSitniksCustomer(customer.id, { email }) || customer;
        }
        if (fullname && customer.fullname !== fullname) {
          customer = await updateSitniksCustomer(customer.id, { fullname }) || customer;
        }
        return { customer, created: false };
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
    return {
      ordersCount: 0,
      totalSpent: 0,
      averageOrderValue: 0,
    };
  }
}
