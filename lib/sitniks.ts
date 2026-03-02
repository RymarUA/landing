/**
 * lib/sitniks.ts
 *
 * Sitniks CRM API client.
 *
 * Sitniks is a Ukrainian SaaS CRM for e-commerce stores.
 * API reference: https://sitniks.com/api (log in to your account for the full spec).
 *
 * ENV VARS required:
 *   SITNIKS_API_URL    — your account base URL, e.g. https://my-store.sitniks.com/api/v1
 *   SITNIKS_API_KEY    — bearer token from Settings → API
 *
 * All functions are async and throw on non-2xx responses, so the caller
 * should wrap them in try/catch.
 */

import type {
  SitniksCreateOrderPayload,
  SitniksCreateOrderResponse,
  SitniksUpdateOrderPayload,
  SitniksOrderStatus,
} from "./types";

/* ─────────────────────────────────────────────────────────────────────────
   CONFIG
   ───────────────────────────────────────────────────────────────────────── */

interface SitniksConfig {
  apiUrl: string;
  apiKey: string;
}

function getSitniksConfig(): SitniksConfig {
  const apiUrl = process.env.SITNIKS_API_URL;
  const apiKey = process.env.SITNIKS_API_KEY;

  if (!apiUrl) throw new Error("Missing env: SITNIKS_API_URL");
  if (!apiKey) throw new Error("Missing env: SITNIKS_API_KEY");

  // Normalize: strip trailing slash
  return { apiUrl: apiUrl.replace(/\/$/, ""), apiKey };
}

/* ─────────────────────────────────────────────────────────────────────────
   INTERNAL FETCH HELPER
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Generic JSON fetch wrapper for Sitniks API.
 * Attaches Authorization header and parses JSON response.
 * Throws a descriptive Error on HTTP 4xx/5xx.
 */
async function sitniks<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const { apiUrl, apiKey } = getSitniksConfig();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Next.js: disable caching for all CRM calls (always fresh)
    cache: "no-store",
  });

  // Parse body regardless of status (error bodies contain useful messages)
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
 * Creates a new order in Sitniks CRM.
 *
 * @param payload  Order data (customer, items, delivery, status)
 * @returns        Sitniks response — importantly contains the new order `.id`
 *
 * @example
 * ```ts
 * const order = await createSitniksOrder({
 *   contact_name: "Олена Коваль",
 *   contact_phone: "+380671234567",
 *   delivery_address: "Одеса, відділення №5",
 *   comment: "Оплата WayForPay. Місто: Одеса. Відділення: №5",
 *   status: "Очікує оплати",
 *   items: [{ sku: "1", name: "Кросівки Nike", price: 1200, quantity: 1 }],
 *   total_price: 1200,
 *   source: "familyhub_landing",
 * });
 * console.log(order.id); // → 1042
 * ```
 */
export async function createSitniksOrder(
  payload: SitniksCreateOrderPayload
): Promise<SitniksCreateOrderResponse> {
  /*
   * ┌─ Sitniks API endpoint ──────────────────────────────────────────┐
   * │  POST /orders                                                    │
   * │  Body: SitniksCreateOrderPayload (see lib/types.ts)             │
   * │                                                                  │
   * │  NOTE: Adjust the endpoint path and field names below to match  │
   * │  your specific Sitniks account API schema. Log in to your       │
   * │  Sitniks account → Settings → API to see the exact spec.        │
   * └──────────────────────────────────────────────────────────────────┘
   */
  return sitniks<SitniksCreateOrderResponse>("POST", "/orders", payload);
}

/**
 * Updates the status of an existing Sitniks order.
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
 * Fetches a single order from Sitniks by ID.
 * Useful for verifying order state before processing.
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
