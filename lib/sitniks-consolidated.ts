// @ts-nocheck
/**
 * lib/sitniks-consolidated.ts
 *
 * Consolidated Sitniks CRM API client.
 * Combines functionality from sitniks.ts and sitniks-api.ts
 *
 * ENV VARS:
 *   SITNIKS_API_URL  — base URL (no trailing slash)
 *   SITNIKS_API_KEY  — Bearer token
 */

import { siteConfig } from "@/lib/site-config";

// ─── Config ────────────────────────────────────────────────────────────────────

// ─── Types (from sitniks-api.ts) ───────────────────────────────────────────────

export interface SitniksAttachment {
  id: number;
  url: string;
}

export interface SitniksAuxiliaryInfo {
  badge?: string;
  badgeColor?: string;
  isHit?: boolean;
  isNew?: boolean;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
}

export interface SitniksProperty {
  id: number;
  name: string;   // e.g. "Розмір", "Колір"
  value: string;  // e.g. "36", "Червоний"
}

export interface SitniksWarehouseQuantity {
  id: number;
  quantity: number;
  stockQuantity: number;
  availableQuantity: number;
  reserveQuantity: number;
  deliveryQuantity: number;
  warehouse: { id: number; name: string };
}

export interface SitniksVariation {
  id: number;
  sku?: string;
  isActive: boolean;
  barcode?: string;
  price: number;
  costPrice: number;
  weight?: number;
  attachments: SitniksAttachment[];
  images?: SitniksAttachment[];
  properties: SitniksProperty[];
  warehouseQuantities: SitniksWarehouseQuantity[];
  availableQuantity: number;
  product: {
    id: number;
    name: string;
    sku?: string;
    description?: string;
    category?: { id: number; title: string };
  };
}

export interface SitniksProduct {
  id: number;
  title: string;
  name?: string;
  sku?: string;
  description?: string;
  price: number;
  costPrice: number;
  weight?: number;
  barcode?: string;
  isActive: boolean;
  category?: { id: number; title: string };
  attachments: SitniksAttachment[];
  images?: SitniksAttachment[];
  properties: SitniksProperty[];
  variations: SitniksVariation[];
  warehouseQuantities: SitniksWarehouseQuantity[];
  auxiliaryInfo?: SitniksAuxiliaryInfo | Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SitniksCategory {
  id: number;
  title: string;
  parentCategoryId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  announcementText: string;
  telegramUsername: string;
  viberPhone: string;
  instagramUsername: string;
  phone: string;
}

export interface CreateOrderDto {
  client: {
    fullname: string;
    phone?: string;
    email?: string;
  };
  products: Array<{
    productVariationId: number;
    isUpsale: boolean;
    price: number;
    quantity: number;
    title: string;
  }>;
  npDelivery?: {
    integrationNovaposhtaId: number;
    price: number;
    seatsAmount: number;
    city: string;
    cityRef?: string;
    department: string;
    departmentRef?: string;
    serviceType: string;
    payerType: string;
    cargoType: string;
    paymentMethod: string;
    productPaymentMethod: string;
    weight: number;
    description: string;
  };
  statusId?: number;
  salesChannelId?: number;
  clientComment?: string;
  managerComment?: string;
  externalId?: string;
}

export interface SitniksOrder {
  id: number;
  orderNumber: number;
  client: {
    fullname: string;
    phone?: string;
    email?: string;
  };
  products: Array<{
    id: number;
    productVariationId: number;
    isUpsale: boolean;
    price: number;
    quantity: number;
    title: string;
  }>;
  status: { id: number; name: string };
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── HTTP Client (from sitniks.ts) ───────────────────────────────────────────────

const SITNIKS_TIMEOUT_MS = 8000;

interface SitniksConfig {
  apiUrl: string;
  apiKey: string;
}

function getSitniksConfig(): SitniksConfig | null {
  const apiUrl = process.env.SITNIKS_API_URL?.trim().replace(/\/$/, "");
  const apiKey = process.env.SITNIKS_API_KEY;
  if (!apiUrl || !apiKey) return null;
  return { apiUrl, apiKey };
}

function getSitniksConfigOrThrow(): SitniksConfig {
  const config = getSitniksConfig();
  if (!config) {
    throw new Error("Sitniks API configuration missing: set SITNIKS_API_URL and SITNIKS_API_KEY");
  }
  return config;
}

/** Safe fetch: timeout 8000ms, on error log and return null. */
export async function sitniksSafe<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
  options?: { revalidate?: number }
): Promise<T | null> {
  const config = getSitniksConfig();
  if (!config) {
    console.error("[sitniks] SITNIKS_API_URL or SITNIKS_API_KEY not set");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SITNIKS_TIMEOUT_MS);

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/json",
    };

    // For GET requests, don't send body
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
      next: { revalidate: options?.revalidate ?? 60 },
    };

    // Only add body for POST/PATCH requests
    if (method !== "GET" && body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(`${config.apiUrl}${path}`, fetchOptions);

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      // Reduce noise for expected 404 errors on product lookup
      if (res.status === 404 && (path.includes('/products/') || path.includes('/open-api/products/'))) {
        console.log(`[sitniks] Product not found (404): ${path}`);
      } else {
        console.error(`[sitniks] HTTP ${res.status}: ${errorText}`);
      }
      return null;
    }

    return await res.json() as T;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[sitniks] Request timeout after 8000ms");
    } else {
      console.error("[sitniks] Request failed:", error);
    }
    return null;
  }
}

/** Standard fetch: throws on error (legacy compatibility). */
async function sitniks<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const { apiUrl, apiKey } = getSitniksConfigOrThrow();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    next: { revalidate: 300 },
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = { message: await res.text() };
  }

  if (!res.ok) {
    const message =
      typeof json === "object" && json !== null && "message" in json
        ? String((json as Record<string, unknown>).message)
        : `Sitniks API error ${res.status}`;
    throw new Error(`[Sitniks] ${message} (HTTP ${res.status})`);
  }

  return json as T;
}

// ─── Products API (from sitniks-api.ts) ───────────────────────────────────────────

export async function getSitniksProducts(options: {
  limit?: number;
  skip?: number;
  ids?: number[];
  categoryIds?: number[];
  query?: string;
}): Promise<{ data: SitniksProduct[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 50),
    skip: String(options.skip ?? 0),
    ...(options.ids !== undefined ? { ids: options.ids.join(",") } : {}),
    ...(options.categoryIds?.length ? { categoryIds: options.categoryIds.join(",") } : {}),
    ...(options.query ? { query: options.query } : {}),
  });

  const res = await sitniks<{ data: SitniksProduct[]; total: number }>(
    "GET",
    `/open-api/products?${params}`
  );
  return res;
}

export async function getAllSitniksProducts(): Promise<SitniksProduct[]> {
  const all: SitniksProduct[] = [];
  let skip = 0;
  const limit = 50;

  while (true) {
    const page = await getSitniksProducts({ limit, skip });
    all.push(...page.data);
    if (all.length >= page.total || page.data.length < limit) break;
    skip += limit;
  }

  return all;
}

export async function getSitniksProductById(productId: number): Promise<SitniksProduct | null> {
  return sitniksSafe<SitniksProduct>("GET", `/open-api/products/${productId}`);
}

export async function getSitniksCategories(): Promise<SitniksCategory[]> {
  const res = await sitniks<SitniksCategory[]>("GET", "/open-api/products/categories");
  return res;
}

// ─── Site Settings API ─────────────────────────────────────────────────────────────

/**
 * Get site settings from Sitniks.
 * 
 * В Sitniks CRM створіть спеціальний товар з SKU = "SITE_SETTINGS"
 * і додайте характеристики (Properties):
 * - announcementText: "✨ Текст анонсу"
 * - telegramUsername: "your_bot"
 * - viberPhone: "+380..."
 * - instagramUsername: "your_account"
 * - phone: "+380..."
 * 
 * Категорія товару обов'язкова (будь-яка), назва може бути "Налаштування сайту".
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  // Шукаємо товар з SKU = "SITE_SETTINGS"
  const SETTINGS_SKU = "SITE_SETTINGS";
  
  try {
    // Отримуємо всі товари і шукаємо потрібний SKU
    const response = await sitniksSafe<{ data: SitniksProduct[]; total: number }>(
      "GET",
      `/open-api/products`
    );
    
    if (!response?.data) {
      console.warn("[sitniks] Failed to fetch products for settings");
      return null;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[sitniks] Loaded ${response.data.length} products, searching for SKU="${SETTINGS_SKU}"`);
      
      // Детальний лог для дебагу
      response.data.forEach((p, idx) => {
        console.log(`[sitniks] Product ${idx}:`, {
          id: p.id,
          sku: p.sku,
          title: p.title,
          name: p.name,
          hasProperties: p.properties?.length > 0
        });
      });
    }
    
    // Шукаємо товар з потрібним SKU або назвою "Налаштування сайту"
    const product = response.data.find(p => 
      p.sku === SETTINGS_SKU || 
      p.title === "Налаштування сайту" || 
      p.name === "Налаштування сайту"
    );
    
    if (!product) {
      console.warn(`[sitniks] Site settings product with SKU="${SETTINGS_SKU}" or name="Налаштування сайту" not found`);
      console.warn(`[sitniks] Hint: Create a product in Sitniks with SKU="${SETTINGS_SKU}" (or name "Налаштування сайту") and add Properties`);
      return null;
    }
    
    if (!product.properties || product.properties.length === 0) {
      console.warn(`[sitniks] Site settings product found but has no properties`);
      return null;
    }
    
    console.log(`[sitniks] ✓ Found settings product:`, product.title || product.name);
    console.log(`[sitniks] Properties:`, product.properties.map(p => p.name));
    
    // Читаємо налаштування з характеристик товару
    const getProp = (name: string): string => {
      const prop = product.properties.find(p => p.name?.toLowerCase() === name.toLowerCase());
      return prop?.value ?? "";
    };
    
    return {
      announcementText: getProp("announcementText") || getProp("announcement"),
      telegramUsername: getProp("telegramUsername") || getProp("telegram"),
      viberPhone: getProp("viberPhone") || getProp("viber"),
      instagramUsername: getProp("instagramUsername") || getProp("instagram"),
      phone: getProp("phone"),
    };
  } catch (error) {
    console.error("[sitniks] Error fetching site settings:", error);
    return null;
  }
}

/**
 * Get site settings with fallback to site-config
 * Returns settings from Sitniks or fallback to local config
 */
export async function getSiteSettingsWithFallback(): Promise<{ settings: SiteSettings; source: 'sitniks' | 'fallback' }> {
  try {
    const settings = await getSiteSettings();
    
    if (!settings) {
      return createFallbackSettings();
    }
    
    return { settings, source: "sitniks" };
  } catch (error) {
    console.error("[sitniks] Failed to fetch settings from Sitniks:", error);
    return createFallbackSettings();
  }
}

/** Helper function to create fallback settings - avoids duplication */
function createFallbackSettings(): { settings: SiteSettings; source: 'fallback' } {
  return {
    settings: {
      announcementText: siteConfig.announcementText,
      telegramUsername: siteConfig.telegramUsername,
      viberPhone: siteConfig.viberPhone,
      instagramUsername: siteConfig.instagramUsername,
      phone: siteConfig.phone,
    },
    source: "fallback",
  };
}

// ─── Orders API (consolidated) ─────────────────────────────────────────────────────

/**
 * Create a new order (safe version - returns null on error).
 */
export async function createSitniksOrder(dto: CreateOrderDto): Promise<SitniksOrder | null> {
  console.log("[sitniks] Creating order with DTO:", JSON.stringify(dto, null, 2));
  const result = await sitniksSafe<SitniksOrder>("POST", "/open-api/orders", dto);
  console.log("[sitniks] Order creation result:", result);
  return result;
}

/**
 * Create a new order (legacy version - throws on error).
 * @deprecated Use createSitniksOrder instead
 */
export async function createSitniksOrderLegacy(payload: CreateOrderDto): Promise<SitniksOrder> {
  return sitniks<SitniksOrder>("POST", "/orders", payload);
}

/**
 * Get order by ID.
 */
export async function getSitniksOrder(orderId: number): Promise<SitniksOrder> {
  return sitniks<SitniksOrder>("GET", `/open-api/orders/${orderId}`);
}

/**
 * Get order statuses.
 */
export async function getSitniksOrderStatuses(): Promise<Array<{ id: number; name: string }>> {
  const res = await sitniks<{ data: Array<{ id: number; name: string }> }>("GET", "/open-api/orders/statuses");
  return res.data;
}

/**
 * Update order status by orderReference (e.g. FHM-123 or order number).
 * Used from WayForPay webhook and notify-shipping.
 * This is the recommended function for status updates.
 */
export async function updateSitniksOrder(
  orderReference: string,
  status: "paid" | "shipped" | "delivered" | "cancelled"
): Promise<boolean> {
  const STATUS_MAP: Record<string, string> = {
    paid: "Оплачено",
    shipped: "Відправлено",
    delivered: "Доставлено",
    cancelled: "Скасовано",
  };
  
  const crmStatus = STATUS_MAP[status] ?? "Оплачено";
  
  // Try to find order by orderNumber or externalId
  const search = await sitniksSafe<{ data?: SitniksOrder[] }>("GET", `/open-api/orders?search=${encodeURIComponent(orderReference)}`);
  
  const list = search?.data ?? [];
  const targetId = Array.isArray(list) && list.length > 0 ? list[0].id : null;
  if (!targetId) {
    console.error(`[sitniks] Order not found: ${orderReference}`);
    return false;
  }
  
  const res = await sitniksSafe<unknown>("PATCH", `/open-api/orders/${targetId}`, { status: crmStatus });
  return res !== null;
}

/**
 * Update order status (legacy version).
 * @deprecated Use updateSitniksOrder instead - it has better error handling and status mapping
 */
export async function updateSitniksOrderStatus(
  orderId: string | number,
  status: string,
  comment?: string
): Promise<void> {
  const payload = comment ? { status, comment } : { status };
  await sitniks("PATCH", `/orders/${orderId}`, payload);
}

// ─── Helpers (from sitniks.ts) ─────────────────────────────────────────────────────

/**
 * Get orders for a customer by phone (for profile/cabinet).
 * Uses Next.js fetch cache (revalidate 5m) instead of in-memory Map, so it works in serverless.
 */
export async function getSitniksOrdersByPhone(phone: string): Promise<any[]> {
  try {
    // Use the working endpoint: /open-api/orders with client_phone parameter
    const response = await sitniksSafe<{ data?: any[]; orders?: any[] }>(
      "GET",
      `/open-api/orders?client_phone=${encodeURIComponent(phone)}`
    );
    
    const list = response?.data ?? response?.orders ?? [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("[sitniks] Failed to fetch orders by phone:", error);
    return [];
  }
}

/**
 * Normalizes a Ukrainian phone number to +380XXXXXXXXX format.
 * @deprecated Use normalizePhone from @/lib/phone-utils instead
 */
export { normalizePhone as normalizeSitniksPhone } from "./phone-utils";

