// @ts-nocheck
/**
 * lib/product-notifications.ts
 *
 * Product notification system for Sitniks CRM integration.
 * Handles price drop alerts, back-in-stock notifications, and new arrivals.
 */

import { sitniksSafe } from "./sitniks-consolidated";
import { sendTelegramNotification, escapeTgHtml } from "./telegram";

// ─── Types ────────────────────────────────────────────────────────

export interface PriceDropAlert {
  id: number;
  customerId: number;
  productId: number;
  productName: string;
  oldPrice: number;
  newPrice: number;
  discount: number;
  discountPercent: number;
  notifiedAt?: Date;
}

export interface BackInStockAlert {
  id: number;
  customerId: number;
  productId: number;
  productName: string;
  price: number;
  stock: number;
  notifiedAt?: Date;
}

export interface NewArrivalAlert {
  id: number;
  customerId: number;
  productId: number;
  productName: string;
  category: string;
  price: number;
  notifiedAt?: Date;
}

export interface NotificationPreferences {
  customerId: number;
  priceDrops: boolean;
  backInStock: boolean;
  newArrivals: boolean;
  categories?: string[];
  maxPriceRange?: { min: number; max: number };
  minDiscountPercent?: number;
}

// ─── Notification Functions ───────────────────────────────────────

/**
 * Subscribe to price drop notifications for a product
 */
export async function subscribeToPriceDrops(
  customerId: number | null,
  productId: number,
  currentPrice: number
): Promise<boolean> {
  try {
    console.log("[product-notifications] Subscribed to price drops:", {
      customerId,
      productId,
      currentPrice,
    });

    // Sitniks Open API doesn't have notifications endpoint
    // We'll log the subscription for future integration
    console.log('[product-notifications] Sitniks Open API - logging price drop subscription:', {
      customerId,
      productId,
      currentPrice
    });

    // Track notification subscription (simple logging for now)
    if (customerId) {
      console.log(`[product-notifications] Customer ${customerId} subscribed to price drops for product ${productId}`);
    }
    
    return true;
  } catch (error) {
    console.error("[product-notifications] Failed to subscribe to price drops:", error);
    return false;
  }
}

/**
 * Subscribe to back-in-stock notifications
 */
export async function subscribeToBackInStock(
  customerId: number | null,
  productId: number
): Promise<boolean> {
  try {
    // TODO: Replace with actual Sitniks API call when endpoint is available
    console.log("[product-notifications] Subscribed to back-in-stock:", {
      customerId,
      productId,
    });

    // Simulate API call success
    await new Promise(resolve => setTimeout(resolve, 100));

    return true;
  } catch (error) {
    console.error("[product-notifications] Failed to subscribe to back-in-stock:", error);
    return false;
  }
}

/**
 * Subscribe to new arrivals in specific categories
 */
export async function subscribeToNewArrivals(
  customerId: number | null,
  categories: string[]
): Promise<boolean> {
  try {
    // TODO: Replace with actual Sitniks API call when endpoint is available
    console.log("[product-notifications] Subscribed to new arrivals:", {
      customerId,
      categories,
    });

    // Simulate API call success
    await new Promise(resolve => setTimeout(resolve, 100));

    return true;
  } catch (error) {
    console.error("[product-notifications] Failed to subscribe to new arrivals:", error);
    return false;
  }
}

/**
 * Get pending price drop alerts for customer
 */
export async function getPriceDropAlerts(
  customerId: number | null
): Promise<PriceDropAlert[]> {
  try {
    // TODO: Replace with actual Sitniks API call when endpoint is available
    console.log("[product-notifications] Getting price drop alerts for customer:", customerId);
    
    // Return empty alerts for now
    return [];
  } catch (error) {
    console.error("[product-notifications] Failed to get price drop alerts:", error);
    return [];
  }
}

/**
 * Get pending back-in-stock alerts for customer
 */
export async function getBackInStockAlerts(
  customerId: number | null
): Promise<BackInStockAlert[]> {
  try {
    // TODO: Replace with actual Sitniks API call when endpoint is available
    console.log("[product-notifications] Getting back-in-stock alerts for customer:", customerId);
    
    // Return empty alerts for now
    return [];
  } catch (error) {
    console.error("[product-notifications] Failed to get back-in-stock alerts:", error);
    return [];
  }
}

/**
 * Get new arrival alerts for customer
 */
export async function getNewArrivalAlerts(
  customerId: number | null
): Promise<NewArrivalAlert[]> {
  try {
    // TODO: Replace with actual Sitniks API call when endpoint is available
    console.log("[product-notifications] Getting new arrival alerts for customer:", customerId);
    
    // Return empty alerts for now
    return [];
  } catch (error) {
    console.error("[product-notifications] Failed to get new arrival alerts:", error);
    return [];
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: NotificationPreferences
): Promise<boolean> {
  try {
    const result = await sitniksSafe(
      "PUT",
      `/api/v1/notifications/customers/${preferences.customerId}/preferences`,
      preferences
    );

    return result !== null;
  } catch (error) {
    console.error("[product-notifications] Failed to update preferences:", error);
    return false;
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(
  customerId: number
): Promise<NotificationPreferences | null> {
  try {
    const result = await sitniksSafe<NotificationPreferences>(
      "GET",
      `/api/v1/notifications/customers/${customerId}/preferences`
    );

    return result;
  } catch (error) {
    console.error("[product-notifications] Failed to get preferences:", error);
    return null;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: number
): Promise<boolean> {
  try {
    const result = await sitniksSafe(
      "PATCH",
      `/api/v1/notifications/${notificationId}/mark-read`,
      { readAt: new Date().toISOString() }
    );

    return result !== null;
  } catch (error) {
    console.error("[product-notifications] Failed to mark as read:", error);
    return false;
  }
}

/**
 * Send price drop notification via Telegram (fallback)
 */
export async function sendPriceDropTelegram(
  customerName: string,
  productName: string,
  oldPrice: number,
  newPrice: number,
  discount: number
): Promise<void> {
  const message = `
🔔 <b>Знижка на товар!</b>

👤 Клієнт: ${escapeTgHtml(customerName)}
📦 Товар: ${escapeTgHtml(productName)}

💰 Стара ціна: ${oldPrice.toLocaleString('uk-UA')} грн
✨ Нова ціна: ${newPrice.toLocaleString('uk-UA')} грн
🎉 Знижка: ${discount.toLocaleString('uk-UA')} грн (${Math.round((discount / oldPrice) * 100)}%)

Товар з вашого списку бажань подешевшав!
  `.trim();

  try {
    await sendTelegramNotification(message);
  } catch (error) {
    console.error("[product-notifications] Failed to send Telegram notification:", error);
  }
}

/**
 * Send back-in-stock notification via Telegram (fallback)
 */
export async function sendBackInStockTelegram(
  customerName: string,
  productName: string,
  price: number,
  stock: number
): Promise<void> {
  const message = `
🔔 <b>Товар знову в наявності!</b>

👤 Клієнт: ${escapeTgHtml(customerName)}
📦 Товар: ${escapeTgHtml(productName)}

💰 Ціна: ${price.toLocaleString('uk-UA')} грн
📊 Залишок: ${stock} шт

Товар з вашого списку бажань знову доступний!
  `.trim();

  try {
    await sendTelegramNotification(message);
  } catch (error) {
    console.error("[product-notifications] Failed to send Telegram notification:", error);
  }
}
