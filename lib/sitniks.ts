/**
 * lib/sitniks.ts
 *
 * Sitniks CRM API client.
 *
 * ENV VARS:
 *   SITNIKS_API_URL  — base URL (no trailing slash)
 *   SITNIKS_API_KEY  — Bearer token
 *
 * New API: createSitniksOrder, updateSitniksOrder, getSitniksOrdersByPhone
 * use 8000ms timeout and return null/false/[] on error (no throw).
 * Legacy: createSitniksOrder (payload), updateSitniksOrderStatus, getSitniksOrder still throw.
 */

import type {
  SitniksCreateOrderPayload,
  SitniksCreateOrderResponse,
  SitniksUpdateOrderPayload,
  SitniksOrderStatus,
  Order,
} from "./types";

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
    const res = await fetch(`${config.apiUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = { message: await res.text() };
    }

    if (!res.ok) {
      const msg = typeof json === "object" && json !== null && "message" in json
        ? String((json as Record<string, unknown>).message)
        : `HTTP ${res.status}`;
      console.error("[sitniks]", method, path, msg);
      return null;
    }

    return json as T;
  } catch (err) {
    clearTimeout(timeout);
    console.error("[sitniks]", err);
    return null;
  }
}

/** Status map: API uses "paid" | "shipped" | "delivered" | "cancelled" → CRM labels */
const STATUS_MAP: Record<string, SitniksOrderStatus> = {
  paid: "Оплачено",
  shipped: "Відправлено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

/* ─────────────────────────────────────────────────────────────────────────
   NEW PUBLIC API (safe, no throw)
   ───────────────────────────────────────────────────────────────────────── */

export interface CreateSitniksOrderInput {
  orderReference: string;
  customer: { name: string; phone: string; email?: string };
  delivery: { city: string; warehouse: string };
  items: Array<{ name: string; price: number; quantity: number; size?: string | null }>;
  total: number;
}

/**
 * Create order in Sitniks after checkout. Returns { id } or null on error.
 */
export async function createSitniksOrder(
  order: CreateSitniksOrderInput
): Promise<{ id: string | number } | null> {
  const payload: SitniksCreateOrderPayload = {
    contact_name: order.customer.name,
    contact_phone: order.customer.phone,
    delivery_address: `${order.delivery.city}, ${order.delivery.warehouse}`,
    comment: `OrderRef: ${order.orderReference} | Нова Пошта: ${order.delivery.city}, ${order.delivery.warehouse}`,
    status: "Очікує оплати",
    items: order.items.map((i) => ({
      sku: i.name.slice(0, 64),
      name: i.size ? `${i.name} (розм. ${i.size})` : i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    total_price: order.total,
    source: "familyhub_landing",
  };

  const result = await sitniksSafe<SitniksCreateOrderResponse>("POST", "/orders", payload);
  if (!result || (result.id !== 0 && !result.id)) return null;
  return { id: result.id };
}

/**
 * Update order status by orderReference (e.g. FHM-123). Used from callback and notify-shipping.
 */
export async function updateSitniksOrder(
  orderReference: string,
  status: "paid" | "shipped" | "delivered" | "cancelled"
): Promise<boolean> {
  const crmStatus = STATUS_MAP[status] ?? "Оплачено";
  // Assume Sitniks allows PATCH by order_number or external ref; fallback: PATCH by id if API uses orderReference as id
  const res = await sitniksSafe<unknown>("PATCH", `/orders/${encodeURIComponent(orderReference)}`, { status: crmStatus });
  return res !== null;
}

const ORDERS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const ordersCache = new Map<string, { orders: Order[]; expires: number }>();

/**
 * Get orders for a customer by phone (for profile/cabinet).
 * Results are cached in memory for 5 minutes to reduce load on profile/tracking.
 */
export async function getSitniksOrdersByPhone(phone: string): Promise<Order[]> {
  const normalized = phone.replace(/\D/g, "").slice(-10);
  const cacheKey = `orders:${normalized}`;
  const now = Date.now();
  const cached = ordersCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return cached.orders;
  }

  const result = await sitniksSafe<{ data?: Order[]; orders?: Order[] }>(
    "GET",
    `/orders?contact_phone=${encodeURIComponent(phone)}`
  );
  if (!result) return [];
  const list = (result as { data?: Order[] }).data ?? (result as { orders?: Order[] }).orders ?? [];
  const orders = Array.isArray(list) ? list : [];

  ordersCache.set(cacheKey, { orders, expires: now + ORDERS_CACHE_TTL_MS });
  return orders;
}

/* ─────────────────────────────────────────────────────────────────────────
   INTERNAL FETCH HELPER (legacy — throws)
   ───────────────────────────────────────────────────────────────────────── */

function getSitniksConfigOrThrow(): SitniksConfig {
  const apiUrl = process.env.SITNIKS_API_URL;
  const apiKey = process.env.SITNIKS_API_KEY;
  if (!apiUrl) throw new Error("Missing env: SITNIKS_API_URL");
  if (!apiKey) throw new Error("Missing env: SITNIKS_API_KEY");
  return { apiUrl: apiUrl.replace(/\/$/, ""), apiKey };
}

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
    cache: "no-store",
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

/* ─────────────────────────────────────────────────────────────────────────
   PUBLIC API
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Legacy: create order with full Sitniks payload (throws on error).
 */
export async function createSitniksOrderLegacy(
  payload: SitniksCreateOrderPayload
): Promise<SitniksCreateOrderResponse> {
  return sitniks<SitniksCreateOrderResponse>("POST", "/orders", payload);
}

/**
 * Updates the status of an existing Sitniks order (by id).
 *
 * @param orderId  The order ID returned by `createSitniksOrder`
 * @param status   New status label (must match your CRM configured statuses)
 * @param comment  Optional comment to append in CRM history log
 *
 * @example
 * ```ts
 * await updateSitniksOrderStatus("1042", "Оплачено", "WayForPay Approved, authCode: 123456");
 * ```
 */
export async function updateSitniksOrderStatus(
  orderId: string | number,
  status: SitniksOrderStatus,
  comment?: string
): Promise<void> {
  const payload: SitniksUpdateOrderPayload = { status };
  if (comment) payload.comment = comment;

  /*
   * ┌─ Sitniks API endpoint ──────────────────────────────────────────┐
   * │  PATCH /orders/{id}                                              │
   * │  Body: SitniksUpdateOrderPayload                                │
   * │                                                                  │
   * │  Some Sitniks accounts use PUT instead of PATCH — check yours.  │
   * └──────────────────────────────────────────────────────────────────┘
   */
  await sitniks<unknown>("PATCH", `/orders/${orderId}`, payload);
}

/**
 * Fetches a single order from Sitniks by ID (legacy, throws).
 */
export async function getSitniksOrder(
  orderId: string | number
): Promise<SitniksCreateOrderResponse> {
  return sitniks<SitniksCreateOrderResponse>("GET", `/orders/${orderId}`);
}

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Normalizes a Ukrainian phone number to +380XXXXXXXXX format
 * expected by Sitniks.
 *
 * Input examples: "0671234567", "+380671234567", "380671234567"
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("380") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+38${digits}`;
  // Already correct or unknown format — return as-is
  return raw.startsWith("+") ? raw : `+${digits}`;
}
