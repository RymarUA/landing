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

// ─── Config ────────────────────────────────────────────────────────────────────
const API_KEY  = process.env.SITNIKS_API_KEY ?? "";

if (!API_KEY && process.env.NODE_ENV !== "test") {
  console.warn("[Sitniks] ⚠️  SITNIKS_API_KEY is not set — API calls will fail with 401");
}

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
    category?: { id: number; name: string };
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
  category?: { id: number; name: string };
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
  name: string;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
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
async function sitniksSafe<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown
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

    const res = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      next: { revalidate: 300 },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[sitniks] HTTP ${res.status}: ${errorText}`);
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
  const res = await sitniks<{ data: SitniksCategory[] }>("GET", "/open-api/products/categories");
  return res.data;
}

// ─── Orders API (consolidated) ─────────────────────────────────────────────────────

/**
 * Create a new order (safe version - returns null on error).
 */
export async function createSitniksOrder(dto: CreateOrderDto): Promise<SitniksOrder | null> {
  return sitniksSafe<SitniksOrder>("POST", "/open-api/orders", dto);
}

/**
 * Create a new order (legacy version - throws on error).
 */
export async function createSitniksOrderLegacy(payload: any): Promise<any> {
  return sitniks("POST", "/orders", payload);
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
 * Update order status (legacy).
 */
export async function updateSitniksOrderStatus(
  orderId: string | number,
  status: string,
  comment?: string
): Promise<void> {
  const payload = comment ? { status, comment } : { status };
  await sitniks("PATCH", `/orders/${orderId}`, payload);
}

/**
 * Update order status by orderReference (e.g. FHM-123 or order number).
 * Used from WayForPay webhook and notify-shipping.
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

// ─── Helpers (from sitniks.ts) ─────────────────────────────────────────────────────

/**
 * Get orders for a customer by phone (for profile/cabinet).
 * Uses Next.js fetch cache (revalidate 5m) instead of in-memory Map, so it works in serverless.
 */
export async function getSitniksOrdersByPhone(phone: string): Promise<any[]> {
  const config = getSitniksConfig();
  if (!config) return [];

  const res = await fetch(
    `${config.apiUrl}/orders?contact_phone=${encodeURIComponent(phone)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) return [];
  const json = await res.json();
  const list = (json as { data?: any[] }).data ?? (json as { orders?: any[] }).orders ?? [];
  return Array.isArray(list) ? list : [];
}

/**
 * Normalizes a Ukrainian phone number to +380XXXXXXXXX format.
 * @deprecated Use normalizePhone from @/lib/phone-utils instead
 */
export { normalizePhone as normalizeSitniksPhone } from "./phone-utils";

