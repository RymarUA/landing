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
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options?: { revalidate?: number }
): Promise<T | null> {
  const config = getSitniksConfig();
  if (!config) {
    // Silent fail - no configuration available
    return null;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    Accept: "application/json",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      // @ts-ignore Next.js revalidate option for fetch
      next: options?.revalidate !== undefined ? { revalidate: options.revalidate } : undefined,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`[sitniks] HTTP ${res.status} ${res.statusText} for ${path}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("[sitniks] Request timeout after 8s for", path);
      } else if (error.message.includes('SSL') || error.message.includes('packet length')) {
        console.error("[sitniks] SSL/Connection error - this might be a network or SSL certificate issue:", error.message);
        console.error("[sitniks] Check if SITNIKS_API_URL is correct and accessible");
      } else {
        console.error("[sitniks] Request failed:", error);
      }
    } else {
      console.error("[sitniks] Unknown error:", error);
    }
    return null;
  }
}

/** Safe version of sitniks function that doesn't throw */
async function sitniksWithoutThrow<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options?: { revalidate?: number }
): Promise<T | null> {
  const config = getSitniksConfig();
  if (!config) {
    // Silent in development - only log if explicitly needed
    return null;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    Accept: "application/json",
  };

  try {
    const res = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
      // @ts-ignore Next.js revalidate option for fetch
      next: options?.revalidate !== undefined ? { revalidate: options.revalidate } : undefined,
    });

    if (!res.ok) {
      console.error(`[sitniks] HTTP ${res.status} ${res.statusText} for ${path}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[sitniks] Request failed:", error);
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

  const res = await sitniksWithoutThrow<{ data: SitniksProduct[]; total: number }>(
    "GET",
    `/open-api/products?${params}`,
    undefined,
    { revalidate: 300 } // 5 minutes cache for product listings
  );
  
  if (!res) {
    // Silent fail - return empty result without noise
    return { data: [], total: 0 };
  }
  
  return res;
}

export async function getAllSitniksProducts(): Promise<SitniksProduct[]> {
  const all: SitniksProduct[] = [];
  let skip = 0;
  const limit = 50;
  const maxRetries = 3;
  let consecutiveErrors = 0;

  while (true) {
    const page = await getSitniksProducts({ limit, skip });
    
    // Debug: log what we get
    console.log(`[sitniks] Page ${skip}-${skip + limit}:`, page ? `${page.data.length} products, total ${page.total}` : 'null');
    
    // If API fails completely (null), retry up to maxRetries times
    if (!page) {
      consecutiveErrors++;
      console.error(`[sitniks] API request failed (attempt ${consecutiveErrors}/${maxRetries})`);
      
      if (consecutiveErrors >= maxRetries) {
        console.error(`[sitniks] Failed after ${maxRetries} consecutive errors. Stopping pagination to prevent data loss.`);
        console.error(`[sitniks] Current progress: ${all.length} products loaded. Last successful skip: ${skip - limit}`);
        throw new Error(`Sitniks API failed after ${maxRetries} consecutive attempts. Catalog update aborted to prevent data loss.`);
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, consecutiveErrors - 1), 5000);
      console.log(`[sitniks] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    // Reset error counter on successful request
    consecutiveErrors = 0;
    
    // If we get empty data but expected products, this might be an API issue
    if (page.data.length === 0) {
      if (skip === 0) {
        // First page is empty - likely no products at all
        console.warn(`[sitniks] First page returned no products. Catalog might be empty.`);
        break;
      } else {
        // Middle page is empty - this is suspicious, might be API issue
        console.warn(`[sitniks] Page ${skip} returned empty data but we have ${all.length} products already. This might indicate API issues.`);
        console.warn(`[sitniks] Expected total: ${page.total}, but got 0 products on page ${skip}.`);
        
        // If we have some products and total > 0, this is likely an API error
        if (all.length > 0 && page.total > all.length) {
          throw new Error(`Sitniks API returned empty page ${skip} but expected more products (total: ${page.total}, loaded: ${all.length}). Stopping to prevent data loss.`);
        }
        
        // Otherwise, this might be legitimate end of pagination
        break;
      }
    }
    
    all.push(...page.data);
    if (all.length >= page.total || page.data.length < limit) break;
    skip += limit;
  }

  console.log(`[sitniks] Total products loaded: ${all.length}`);
  return all;
}

export async function getSitniksProductById(productId: number): Promise<SitniksProduct | null> {
  return await sitniksSafe<SitniksProduct>("GET", `/open-api/products/${productId}`, undefined, { revalidate: 300 }); // 5 minutes cache
}

export async function getSitniksCategories(): Promise<SitniksCategory[]> {
  const res = await sitniksSafe<SitniksCategory[]>("GET", "/open-api/products/categories", undefined, { revalidate: 3600 }); // 1 hour cache
  return res ?? [];
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
    // Спочатку пробуємо знайти товар за SKU через фільтр
    const skuResponse = await sitniksSafe<{ data: SitniksProduct[]; total: number }>(
      "GET",
      `/open-api/products?query=${encodeURIComponent(SETTINGS_SKU)}&limit=10`,
      undefined,
      { revalidate: 3600 } // 1 hour cache for settings
    );
    
    let product: SitniksProduct | undefined;
    
    if (skuResponse?.data?.length) {
      // Знайдено товар за SKU - отримуємо повний товар через точковий запит
      const foundProduct = skuResponse.data.find(p => p.sku === SETTINGS_SKU);
      if (foundProduct) {
        console.log(`[sitniks] Found settings product by SKU, fetching full product data...`);
        product = await getSitniksProductById(foundProduct.id);
      }
    }
    
    if (!product) {
      // Якщо не знайдено за SKU, пробуємо за назвою
      const nameResponse = await sitniksSafe<{ data: SitniksProduct[]; total: number }>(
        "GET",
        `/open-api/products?query=${encodeURIComponent("Налаштування сайту")}&limit=10`,
        undefined,
        { revalidate: 3600 } // 1 hour cache for settings
      );
      
      if (nameResponse?.data?.length) {
        const foundByName = nameResponse.data.find(p => 
          p.title === "Налаштування сайту" || 
          p.name === "Налаштування сайту"
        );
        if (foundByName) {
          console.log(`[sitniks] Found settings product by name, fetching full product data...`);
          product = await getSitniksProductById(foundByName.id);
        }
      }
    }
    
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
 * Validates CreateOrderDto before sending to Sitniks CRM.
 * Returns validation error message or null if valid.
 */
function validateCreateOrderDto(dto: CreateOrderDto): string | null {
  // Validate client data
  if (!dto.client?.fullname || dto.client.fullname.trim().length < 2) {
    return "Ім'я клієнта повинно містити мінімум 2 символи";
  }

  // Validate phone format (must be +380XXXXXXXXX)
  if (dto.client.phone) {
    const phoneRegex = /^\+380\d{9}$/;
    if (!phoneRegex.test(dto.client.phone)) {
      return `Невірний формат телефону: ${dto.client.phone}. Очікується +380XXXXXXXXX`;
    }
  }

  // Validate email format if provided
  if (dto.client.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.client.email)) {
      return `Невірний формат email: ${dto.client.email}`;
    }
  }

  // Validate products array
  if (!Array.isArray(dto.products) || dto.products.length === 0) {
    return "Замовлення повинно містити хоча б один товар";
  }

  // Validate each product
  for (let i = 0; i < dto.products.length; i++) {
    const product = dto.products[i];
    
    if (!product.productVariationId || product.productVariationId <= 0) {
      return `Товар #${i + 1}: невірний productVariationId (${product.productVariationId})`;
    }
    
    if (!product.title || product.title.trim().length === 0) {
      return `Товар #${i + 1}: відсутня назва товару`;
    }
    
    if (typeof product.price !== 'number' || product.price < 0) {
      return `Товар #${i + 1}: невірна ціна (${product.price})`;
    }
    
    if (typeof product.quantity !== 'number' || product.quantity < 1) {
      return `Товар #${i + 1}: невірна кількість (${product.quantity})`;
    }
  }

  // Validate Nova Poshta delivery if provided
  if (dto.npDelivery) {
    if (!dto.npDelivery.integrationNovaposhtaId || dto.npDelivery.integrationNovaposhtaId <= 0) {
      return "Невірний ID інтеграції Нової Пошти";
    }
    
    if (!dto.npDelivery.city || dto.npDelivery.city.trim().length === 0) {
      return "Не вказано місто доставки";
    }
    
    if (!dto.npDelivery.department || dto.npDelivery.department.trim().length === 0) {
      return "Не вказано відділення Нової Пошти";
    }
    
    if (typeof dto.npDelivery.weight !== 'number' || dto.npDelivery.weight <= 0) {
      return `Невірна вага посилки (${dto.npDelivery.weight})`;
    }
  }

  return null; // Valid
}

/**
 * Create a new order (safe version - returns null on error).
 */
export async function createSitniksOrder(dto: CreateOrderDto): Promise<SitniksOrder | null> {
  // Validate DTO before sending to CRM
  const validationError = validateCreateOrderDto(dto);
  if (validationError) {
    console.error("[sitniks] Order validation failed:", validationError);
    console.error("[sitniks] Invalid DTO:", JSON.stringify(dto, null, 2));
    return null;
  }

  console.log("[sitniks] Creating order with validated DTO:", JSON.stringify(dto, null, 2));
  const result = await sitniksSafe<SitniksOrder>("POST", "/open-api/orders", dto);
  
  if (!result) {
    console.error("[sitniks] Order creation failed - CRM returned null/error");
  } else {
    console.log("[sitniks] ✓ Order created successfully:", result.orderNumber);
  }
  
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
 * Validate order reference to prevent injection attacks
 */
function validateOrderReference(orderReference: string): string | null {
  if (!orderReference || typeof orderReference !== 'string') {
    return null;
  }
  
  // Allow only alphanumeric characters, hyphens, and underscores
  // Remove any potentially dangerous characters
  const sanitized = orderReference.replace(/[^a-zA-Z0-9\-_]/g, '').trim();
  
  // Check if result is valid after sanitization
  if (sanitized.length === 0 || sanitized.length > 50) {
    return null;
  }
  
  return sanitized;
}

/**
 * Update order status by orderReference (e.g. FHM-123 or order number).
 * Used from WayForPay webhook and notify-shipping.
 * This is the recommended function for status updates.
 */
export async function updateSitniksOrder(
  orderReference: string,
  status: "paid" | "shipped" | "delivered" | "cancelled",
  statusId?: number
): Promise<boolean> {
  console.log(`[sitniks] Updating order ${orderReference} to status ${status}${statusId ? ` (ID: ${statusId})` : ''}`);
  
  // Validate and sanitize order reference to prevent injection
  const sanitizedReference = validateOrderReference(orderReference);
  if (!sanitizedReference) {
    console.error(`[sitniks] Invalid order reference format: ${orderReference}`);
    return false;
  }

  const STATUS_MAP: Record<string, string> = {
    paid: "Оплачено",
    shipped: "Відправлено",
    delivered: "Доставлено",
    cancelled: "Скасовано",
  };
  
  const crmStatus = STATUS_MAP[status] ?? "Оплачено";
  
  // Try to find order by orderNumber or externalId
  // NOTE: no-cache is critical here - searching for a newly created order
  console.log(`[sitniks] Searching for order: ${sanitizedReference}`);
  const search = await sitniksSafe<{ data?: SitniksOrder[] }>(
    "GET", 
    `/open-api/orders?search=${encodeURIComponent(sanitizedReference)}`,
    undefined,
    { revalidate: 0 } // no cache - order may have just been created
  );
  
  const list = search?.data ?? [];
  console.log(`[sitniks] Search results: ${JSON.stringify(list, null, 2)}`);
  
  // Ищем точное совпадение по номеру заказа или ID
  const targetOrder = list.find(
    o => String(o.orderNumber) === sanitizedReference || String(o.id) === sanitizedReference
  );
  const targetId = targetOrder ? targetOrder.id : null;
  
  if (!targetId) {
    console.error(`[sitniks] Order exact match not found for: ${sanitizedReference}`);
    console.error(`[sitniks] Available orders in search results:`, list.map(o => ({ id: o.id, orderNumber: o.orderNumber })));
    return false;
  }
  
  console.log(`[sitniks] Found order ID: ${targetId}, updating status...`);
  
  // Use statusId if provided, otherwise use status name
  const payload = statusId ? { statusId } : { status: crmStatus };
  console.log(`[sitniks] Update payload:`, JSON.stringify(payload, null, 2));
  
  const res = await sitniksSafe<unknown>("PATCH", `/open-api/orders/${targetId}`, payload);
  console.log(`[sitniks] Update result:`, JSON.stringify(res, null, 2));
  
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
      `/open-api/orders?client_phone=${encodeURIComponent(phone)}`,
      undefined,
      { revalidate: 0 } // no cache - user orders must be real-time
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

