// @ts-nocheck
/**
 * lib/types.ts
 *
 * Shared TypeScript interfaces used across the checkout flow:
 *   - Cart (client-side)
 *   - WayForPay (payment gateway)
 *   - Sitniks CRM
 *   - Instagram catalog (mock → real Graph API)
 */

/* ═══════════════════════════════════════════════════════════
   CART
   ═══════════════════════════════════════════════════════════ */

/** A single item as stored in the cart (client-side). */
export interface CartItem {
  id: number;
  name: string;
  price: number;      // UAH, integer kopecks rounded to hryvnia
  image: string;
  quantity: number;
}

/** Payload sent from the checkout form to POST /api/checkout. */
export interface CheckoutRequestBody {
  /** Customer full name */
  name: string;
  /** Ukrainian phone: 0XXXXXXXXX or +380XXXXXXXXX */
  phone: string;
  /** Nova Poshta city */
  city: string;
  /** Nova Poshta branch / parcel locker */
  warehouse: string;
  /** Optional free-text comment */
  comment?: string;
  /** Optional customer email for confirmation */
  email?: string;
  /** Cart items */
  items: Array<Pick<CartItem, "id" | "name" | "price" | "quantity">>;
  /** Pre-calculated total (used as a double-check; server recalculates anyway) */
  totalPrice: number;
}

/** Successful response from POST /api/checkout. */
export interface CheckoutResponseSuccess {
  /** WayForPay payment page URL — frontend redirects here */
  paymentUrl: string;
  /** Sitniks order ID, for reference */
  orderId: string | number;
}

/** Error response from POST /api/checkout. */
export interface CheckoutResponseError {
  error: string;
  details?: Record<string, string[]>;
}

/* ═══════════════════════════════════════════════════════════
   WAYFORPAY
   ═══════════════════════════════════════════════════════════ */

/** Parameters used to generate a WayForPay hosted-page signature and URL. */
export interface WayForPayPaymentParams {
  merchantAccount: string;
  merchantDomainName: string;
  /** Unique order reference — use Sitniks order ID */
  orderReference: string;
  /** Unix timestamp (seconds) */
  orderDate: number;
  /** Total order amount in UAH */
  amount: number;
  currency: "UAH";
  /** Array of product names (must match productPrice and productCount lengths) */
  productName: string[];
  /** Array of unit prices (UAH) */
  productPrice: number[];
  /** Array of quantities */
  productCount: number[];
  /** URL WayForPay redirects to after successful payment */
  returnUrl: string;
  /** URL WayForPay sends async webhook to */
  serviceUrl: string;
}

/**
 * Async webhook (callback) payload sent by WayForPay to serviceUrl.
 * https://wiki.wayforpay.com/en/view/852114
 */
export interface WayForPayWebhookPayload {
  merchantAccount: string;
  orderReference: string;
  merchantSignature: string;
  amount: number;
  currency: string;
  authCode: string;
  email: string;
  phone: string;
  createdDate: number;
  processingDate: number;
  cardPan: string;
  cardType: string;
  issuerBankCountry: string;
  issuerBankName: string;
  recTokenLifetime?: string;
  transactionStatus: "Approved" | "Declined" | "Expired" | "InProcessing" | "Waiting" | "Refunded" | "Voided";
  reason: string;
  reasonCode: number;
  fee: number;
  paymentSystem: string;
}

/** Response we must send back to WayForPay after processing the webhook. */
export interface WayForPayWebhookResponse {
  orderReference: string;
  status: "accept";
  time: number;
  signature: string;
}

/* ═══════════════════════════════════════════════════════════
   SITNIKS CRM
   ═══════════════════════════════════════════════════════════ */

/** A single line item for a Sitniks order. */
export interface SitniksOrderItem {
  /** SKU / product ID in Sitniks (use our product id as string) */
  sku: string;
  /** Product name */
  name: string;
  /** Unit price in UAH */
  price: number;
  /** Quantity */
  quantity: number;
}

/** Payload sent to Sitniks when creating a new order. */
export interface SitniksCreateOrderPayload {
  /** Customer full name */
  contact_name: string;
  /** Phone in +380... format */
  contact_phone: string;
  /** Shipping address / branch description */
  delivery_address: string;
  /** Order comment (includes city + warehouse) */
  comment: string;
  /** Order status at creation */
  status: SitniksOrderStatus;
  /** Line items */
  items: SitniksOrderItem[];
  /** Total order amount in UAH */
  total_price: number;
  /** Source channel tag */
  source?: string;
}

/** Payload sent to Sitniks when updating an existing order's status. */
export interface SitniksUpdateOrderPayload {
  status: SitniksOrderStatus;
  /** Optional comment to append in CRM history */
  comment?: string;
}

/**
 * Sitniks order statuses (Ukrainian CRM system).
 * Adjust names to match your account's configured status labels.
 */
export type SitniksOrderStatus =
  | "Очікує оплати"
  | "Оплачено"
  | "В обробці"
  | "Відправлено"
  | "Доставлено"
  | "Скасовано"
  | "Повернення";

/** Response from Sitniks when creating an order. */
export interface SitniksCreateOrderResponse {
  /** Numeric order ID */
  id: number | string;
  /** Order number shown in CRM UI (e.g. "#1042") */
  order_number?: string;
  status: string;
  [key: string]: unknown;
}

/** Order shape returned by getSitniksOrdersByPhone (for profile/cabinet). */
export interface Order {
  id: string | number;
  orderReference?: string;
  status: string;
  total?: number;
  createdAt?: string;
  items?: Array<{ name: string; price: number; quantity: number }>;
  delivery?: { city: string; warehouse: string };
  [key: string]: unknown;
}

/* ═══════════════════════════════════════════════════════════
   NOVA POSHTA
   ═══════════════════════════════════════════════════════════ */

/** Nova Poshta city item returned by getCities API */
export interface NPCity {
  Ref: string;
  Description: string;
  DescriptionRu?: string;
  AreaDescription?: string;
  AreaDescriptionRu?: string;
  RegionsDescription?: string;
  RegionsDescriptionRu?: string;
  SettlementTypeDescription?: string;
  Delivery1?: string;
  Delivery2?: string;
  Delivery3?: string;
  Delivery4?: string;
  Delivery5?: string;
  Delivery6?: string;
  Delivery7?: string;
}

/** Nova Poshta warehouse (branch / parcel locker) returned by getWarehouses API */
export interface NPWarehouse {
  Ref: string;
  SiteKey: string;
  Description: string;
  DescriptionRu?: string;
  ShortAddress?: string;
  Phone?: string;
  TypeOfWarehouse?: string;
  Number?: string;
  CityRef: string;
  CityDescription?: string;
  MaxWeightAllowed?: string;
  Schedule?: Record<string, string>;
  PostFinance?: string;
  BicycleParking?: string;
  PaymentAccess?: string;
  POSTerminal?: string;
  InternationalShipping?: string;
  SelfServiceWorkplacesCount?: string;
  TotalMaxWeightAllowed?: string;
  PlaceMaxWeightAllowed?: string;
  Dimensions?: {
    width: string;
    height: string;
    length: string;
  };
  Reception?: Record<string, string>;
  Delivery?: Record<string, string>;
  WorkInMobileAwis?: string;
  DenyToSelect?: string;
  CanGetMoneyTransfer?: string;
  HasMirror?: string;
  HasFittingRoom?: string;
  OnlyReceivingParcel?: string;
  PostMachineType?: string;
  PostalCodeUA?: string;
  WarehouseStatus?: string;
  WarehouseStatusDate?: string;
  CategoryOfWarehouse?: string;
  RegionCity?: string;
  WarehouseForAgent?: string;
  MaxDeclaredCost?: string;
  HaveMoneyTransfer?: string;
  Longitude?: string;
  Latitude?: string;
  NPABoxesCount?: string;
  NPLockerPostMachineCount?: string;
  NPPostMachineCount?: string;
}

/* ═══════════════════════════════════════════════════════════
   INSTAGRAM CATALOG
   ═══════════════════════════════════════════════════════════ */

/**
 * Normalized product shape used throughout the app.
 * This is what instagram-catalog.ts (and products.ts) must return.
 *
 * In production the Instagram Graph API returns a "catalog product" object
 * which we normalize into this shape.
 */
export interface CatalogProduct {
  /** Unique numeric ID (from Instagram product feed or our DB) */
  id: number;
  /** URL-friendly slug for /product/[slug] pages */
  slug: string;
  /** Display name */
  name: string;
  /** Category — used for filter tabs */
  category: string;
  /** Current price in UAH */
  price: number;
  /** Original price before discount, or null */
  oldPrice: number | null;
  /** Primary image URL */
  image: string;
  /** Short badge text (e.g. "Хіт", "Новинка", "Знижка") or null */
  badge: string | null;
  /** Tailwind bg-color class for the badge */
  badgeColor: string;
  /** Available size options (empty array = one-size) */
  sizes: string[];
  /** Star rating 0-5 */
  rating: number;
  /** Number of customer reviews */
  reviews: number;
  /** Units in stock */
  stock: number;
  /** Long-form product description */
  description: string;
  /** Tag this product as newly arrived */
  isNew?: boolean;
  /** Tag this product as a bestseller */
  isHit?: boolean;
  /**
   * Raw Instagram media ID — populated when synced from Graph API.
   * null for manually entered / mock products.
   */
  instagramMediaId: string | null;
  /**
   * Instagram permalink to the original post.
   * Used for "Order via Instagram" fallback link.
   */
  instagramPermalink: string | null;
}

/**
 * Raw media item as returned by the Instagram Graph API
 * GET /me/media?fields=id,caption,media_url,permalink,timestamp
 *
 * This is the shape you will receive when you replace the mock with a real fetch.
 */
export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_url: string;
  permalink: string;
  timestamp: string;
}

/** Response envelope from GET /me/media */
export interface InstagramMediaResponse {
  data: InstagramMediaItem[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

