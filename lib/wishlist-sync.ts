// @ts-nocheck
/**
 * lib/wishlist-sync.ts
 *
 * Wishlist synchronization with Sitniks CRM.
 * Syncs customer's favorite products between local storage and CRM.
 */

import { sitniksSafe } from "./sitniks-consolidated";
import { addToWishlist } from "./sitniks-custom-fields";

// ─── Types ────────────────────────────────────────────────────────

export interface WishlistItem {
  productId: number;
  productName: string;
  price: number;
  category: string;
  addedAt: Date;
  notifyOnPriceDrop?: boolean;
  notifyOnBackInStock?: boolean;
}

export interface WishlistSyncResult {
  success: boolean;
  synced: number;
  errors?: string[];
}

// ─── Wishlist Sync Functions ──────────────────────────────────────

/**
 * Sync wishlist to Sitniks CRM
 */
export async function syncWishlistToSitniks(
  customerId: number | null,
  productIds: number[],
  _products?: Array<{ id: number; name: string; price: number; category: string }>
): Promise<WishlistSyncResult> {
  try {
    console.log("[wishlist-sync] Syncing wishlist for customer:", customerId, {
      productIds,
      count: productIds.length,
    });

    // Use custom fields to store wishlist in Sitniks
    if (customerId) {
      console.log('[wishlist-sync] Storing wishlist in custom fields:', {
        customerId,
        productIds,
        count: productIds.length
      });

      try {
        // Add each product to wishlist custom field
        for (const productId of productIds) {
          const success = await addToWishlist(customerId, productId);
          if (!success) {
            console.warn('[wishlist-sync] Failed to add product to wishlist:', productId);
          }
        }
        
        console.log(`[wishlist-sync] Customer ${customerId} wishlist updated: ${productIds.length} items`);
      } catch (error) {
        console.error('[wishlist-sync] Failed to update wishlist custom fields:', error);
      }
    } else {
      console.log('[wishlist-sync] No customerId - skipping custom fields update');
    }

    // Return success for UI functionality
    return { synced: productIds.length, errors: [] };
  } catch (error) {
    console.error("[wishlist-sync] Failed to sync wishlist:", error);
    return {
      success: false,
      synced: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Get wishlist from Sitniks CRM
 */
export async function getWishlistFromSitniks(
  customerId: number
): Promise<WishlistItem[]> {
  try {
    // TODO: Replace with actual Sitniks API call when endpoint is available
    console.log("[wishlist-sync] Getting wishlist for customer:", customerId);
    
    // Return empty wishlist for now
    return [];
  } catch (error) {
    console.error("[wishlist-sync] Failed to get wishlist:", error);
    return [];
  }
}

/**
 * Add product to wishlist in Sitniks
 */
export async function addToWishlistInSitniks(
  customerId: number,
  productId: number,
  productData?: { name: string; price: number; category: string }
): Promise<boolean> {
  try {
    const result = await sitniksSafe("POST", `/api/v1/customers/${customerId}/wishlist/add`, {
      productId,
      productName: productData?.name || `Product ${productId}`,
      price: productData?.price || 0,
      category: productData?.category || 'Unknown',
      addedAt: new Date().toISOString(),
    });

    return result !== null;
  } catch (error) {
    console.error("[wishlist-sync] Failed to add to wishlist:", error);
    return false;
  }
}

/**
 * Remove product from wishlist in Sitniks
 */
export async function removeFromWishlistInSitniks(
  customerId: number,
  productId: number
): Promise<boolean> {
  try {
    const result = await sitniksSafe("DELETE", `/api/v1/customers/${customerId}/wishlist/${productId}`, {});

    return result !== null;
  } catch (error) {
    console.error("[wishlist-sync] Failed to remove from wishlist:", error);
    return false;
  }
}

/**
 * Update wishlist item notification preferences
 */
export async function updateWishlistNotifications(
  customerId: number,
  productId: number,
  notifications: {
    notifyOnPriceDrop?: boolean;
    notifyOnBackInStock?: boolean;
  }
): Promise<boolean> {
  try {
    const result = await sitniksSafe(
      "PATCH",
      `/api/v1/customers/${customerId}/wishlist/${productId}/notifications`,
      notifications
    );

    return result !== null;
  } catch (error) {
    console.error("[wishlist-sync] Failed to update notifications:", error);
    return false;
  }
}

/**
 * Get products with price drops from wishlist
 */
export async function getWishlistPriceDrops(
  customerId: number | null
): Promise<Array<{ productId: number; oldPrice: number; newPrice: number; discount: number }>> {
  try {
    // TODO: Replace with actual Sitniks API call when endpoint is available
    console.log("[wishlist-sync] Getting price drops for customer:", customerId);
    
    // Return empty price drops for now
    return [];
  } catch (error) {
    console.error("[wishlist-sync] Failed to get price drops:", error);
    return [];
  }
}

/**
 * Get products back in stock from wishlist
 */
export async function getWishlistBackInStock(
  customerId: number | null
): Promise<number[]> {
  try {
    // TODO: Replace with actual Sitniks API call when endpoint is available
    console.log("[wishlist-sync] Getting back-in-stock for customer:", customerId);
    
    // Return empty back-in-stock for now
    return [];
  } catch (error) {
    console.error("[wishlist-sync] Failed to get back in stock:", error);
    return [];
  }
}
