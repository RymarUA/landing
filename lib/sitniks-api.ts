// @ts-nocheck
/**
 * lib/sitniks-api.ts
 *
 * Типізований клієнт для Sitniks Open API.
 * Документація: https://crm.sitniks.com/open-api
 *
 * Налаштування (.env.local):
 *   SITNIKS_API_URL=https://crm.sitniks.com
 *   SITNIKS_API_KEY=your_bearer_token_here
 */

// ─── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = (process.env.SITNIKS_API_URL ?? "https://crm.sitniks.com").replace(/\/$/, "");
const API_KEY  = process.env.SITNIKS_API_KEY ?? "";

if (!API_KEY && process.env.NODE_ENV !== "test") {
  console.warn("[Sitniks] ⚠️  SITNIKS_API_KEY is not set — API calls will fail with 401");
}

// ─── Types (from swagger schema) ───────────────────────────────────────────────

export interface SitniksAttachment {
  id: number;
  url: string;
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
  stockQuantity: number;
  availableQuantity: number;
  reserveQuantity: number;
  deliveryQuantity: number;
  properties: SitniksProperty[];   // e.g. [{name:"Розмір", value:"36"}]
  attachments: SitniksAttachment[]; // фото варіації
  warehouses: SitniksWarehouseQuantity[];
  auxiliaryInfo: Record<string, unknown>; // кастомні поля (badge, isHit тощо)
}

export interface SitniksCategory {
  id: number;
  name: string;
}

export interface SitniksProduct {
  id: number;
  title: string;
  category?: SitniksCategory;
  categoryId?: number;
  description?: string;
  auxiliaryInfo: Record<string, unknown>; // кастомні поля
  variations: SitniksVariation[];
  attachments: SitniksAttachment[]; // фото продукту (загальні)
  properties: SitniksProperty[];
}

export interface SitniksProductList {
  data: SitniksProduct[];
  total: number;
}

// ─── Order types ───────────────────────────────────────────────────────────────

export interface CreateOrderDto {
  client: {
    fullname: string;   // required, min 3 chars
    phone?: string;
    email?: string;
  };
  products?: Array<{
    productVariationId: number;
    isUpsale: boolean;
    price?: number;
    quantity?: number;
    title?: string;
    notes?: string;
  }>;
  npDelivery?: {
    integrationNovaposhtaId: number;
    price: number;
    seatsAmount: number;
    city?: string;
    cityRef?: string;
    department?: string;
    departmentRef?: string;
    serviceType?: "WarehouseWarehouse" | "DoorsDoors" | "DoorsWarehouse" | "WarehouseDoors";
    payerType?: "Sender" | "Recipient";
    cargoType?: "Parcel" | "Cargo";
    paymentMethod?: "Cash" | "NonCash";
    productPaymentMethod?: "postpaid" | "payment-control";
    weight?: number;
    description?: string;
  };
  statusId?: number;
  discountPercent?: number;
  discountAmount?: number;
  clientComment?: string;
  managerComment?: string;
  salesChannelId?: number;
  externalId?: string; // можна передати ID замовлення з сайту
}

export interface SitniksOrder {
  id: number;
  orderNumber: number;
  status: { id: number; name: string };
  client: { fullname: string; phone?: string; email?: string };
  totalPrice: number;
  totalPriceDiscount: number;
  cashOnDelivery: number;
  createdAt: string;
  updatedAt: string;
  source: string;
}

// ─── HTTP helper ───────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | number[] | undefined> } = {},
  cache?: RequestCache | { revalidate: number }
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build query string
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      if (Array.isArray(val)) {
        val.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(val));
      }
    });
  }

  const nextCache = typeof cache === "object" ? { next: cache } : { cache: cache ?? "no-store" };

  const res = await fetch(url.toString(), {
    ...fetchOptions,
    ...nextCache,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[Sitniks API] ${res.status} ${res.statusText} — ${path}\n${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Products API ──────────────────────────────────────────────────────────────

/**
 * Отримати список товарів.
 * Увага: параметр `ids` є required в API, але можна передати порожній масив
 * і тоді повертаються всі товари (до limit).
 */
export async function getSitniksProducts(options: {
  limit?: number;
  skip?: number;
  ids?: number[];
  categoryIds?: number[];
  query?: string;
} = {}): Promise<SitniksProductList> {
  return request<SitniksProductList>(
    "/open-api/products",
    {
      method: "GET",
      params: {
        limit: options.limit ?? 50,
        skip: options.skip ?? 0,
        ...(options.ids !== undefined ? { ids: options.ids } : {}),
        ...(options.categoryIds?.length ? { categoryIds: options.categoryIds } : {}),
        ...(options.query ? { query: options.query } : {}),
      },
    },
    { revalidate: 300 } // кеш 5 хвилин
  );
}

/**
 * Отримати всі товари з пагінацією (обходить ліміт 50).
 */
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

/**
 * Отримати один товар за ID.
 */
export async function getSitniksProductById(productId: number): Promise<SitniksProduct | null> {
  try {
    return await request<SitniksProduct>(
      `/open-api/products/${productId}`,
      { method: "GET" },
      { revalidate: 300 }
    );
  } catch {
    return null;
  }
}

/**
 * Отримати категорії товарів.
 */
export async function getSitniksCategories(): Promise<SitniksCategory[]> {
  const res = await request<{ data: SitniksCategory[] }>(
    "/open-api/products/categories",
    { method: "GET" },
    { revalidate: 3600 } // кеш 1 година
  );
  return res.data;
}

// ─── Orders API ────────────────────────────────────────────────────────────────

/**
 * Створити нове замовлення.
 * Повертає створене замовлення з ID та номером.
 */
export async function createSitniksOrder(dto: CreateOrderDto): Promise<SitniksOrder> {
  return request<SitniksOrder>("/open-api/orders", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/**
 * Отримати замовлення за ID.
 */
export async function getSitniksOrder(orderId: number): Promise<SitniksOrder> {
  return request<SitniksOrder>(`/open-api/orders/${orderId}`, { method: "GET" });
}

/**
 * Отримати статуси замовлень.
 */
export async function getSitniksOrderStatuses(): Promise<Array<{ id: number; name: string }>> {
  const res = await request<{ data: Array<{ id: number; name: string }> }>(
    "/open-api/orders/statuses",
    { method: "GET" },
    { revalidate: 3600 }
  );
  return res.data;
}

