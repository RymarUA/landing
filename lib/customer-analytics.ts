// @ts-nocheck
/**
 * lib/customer-analytics.ts
 *
 * Customer behavior analytics and tracking for Sitniks CRM integration.
 * Tracks product views, category interests, search queries, and provides personalized recommendations.
 */

import { sitniksSafe } from "./sitniks-consolidated";
import { addProductView } from "./sitniks-custom-fields";

// ─── Types ────────────────────────────────────────────────────────

export interface ProductView {
  customerId: number;
  productId: number;
  productName: string;
  category: string;
  price: number;
  timestamp: Date;
  sessionId?: string;
  source?: 'catalog' | 'search' | 'recommendation' | 'direct';
}

export interface CategoryInterest {
  customerId: number;
  category: string;
  viewCount: number;
  lastViewedAt: Date;
  purchaseCount?: number;
}

export interface SearchQuery {
  customerId: number;
  query: string;
  resultsCount: number;
  timestamp: Date;
  clickedProductId?: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    minOrders?: number;
    maxOrders?: number;
    minSpent?: number;
    maxSpent?: number;
    categories?: string[];
    lastActivityDays?: number;
  };
}

export interface PersonalizedRecommendation {
  productId: number;
  score: number;
  reason: 'viewed_category' | 'similar_purchases' | 'trending' | 'price_drop' | 'back_in_stock';
}

// ─── Analytics Tracking Functions ────────────────────────────────

/**
 * Track product view
 */
export async function trackProductView(data: {
  customerId: number | null;
  productId: number;
  productName: string;
  category: string;
  price: number;
  source?: string;
}): Promise<boolean> {
  try {
    const { customerId, productId, productName, category, price, source } = data;
    
    // Use custom fields to store analytics in Sitniks
    if (customerId) {
      console.log('[customer-analytics] Storing product view in custom fields:', {
        customerId,
        productId,
        productName,
        category,
        price,
        source
      });

      try {
        const success = await addProductView(customerId, productId, category, price);
        if (success) {
          console.log(`[customer-analytics] Customer ${customerId} view tracked: ${productName} (${productId})`);
        } else {
          console.warn('[customer-analytics] Failed to track product view');
        }
      } catch (error) {
        console.error('[customer-analytics] Failed to update analytics custom fields:', error);
      }
    } else {
      console.log('[customer-analytics] No customerId - skipping custom fields update');
    }
    
    return true;
  } catch (error) {
    console.error("[customer-analytics] Failed to track product view:", error);
    return false;
  }
}

/**
 * Track category interest
 */
export async function trackCategoryInterest(
  customerId: number,
  category: string
): Promise<boolean> {
  try {
    const result = await sitniksSafe("POST", "/api/v1/analytics/category-interests", {
      customerId,
      category,
      timestamp: new Date().toISOString(),
    });

    return result !== null;
  } catch (error) {
    console.error("[customer-analytics] Failed to track category interest:", error);
    return false;
  }
}

/**
 * Track search query
 */
export async function trackSearchQuery(data: {
  customerId: number;
  query: string;
  resultsCount: number;
  clickedProductId?: number;
}): Promise<boolean> {
  try {
    const result = await sitniksSafe("POST", "/api/v1/analytics/search-queries", {
      customerId: data.customerId,
      query: data.query,
      resultsCount: data.resultsCount,
      clickedProductId: data.clickedProductId,
      timestamp: new Date().toISOString(),
    });

    return result !== null;
  } catch (error) {
    console.error("[customer-analytics] Failed to track search query:", error);
    return false;
  }
}

/**
 * Get customer's category interests
 */
export async function getCustomerCategoryInterests(
  customerId: number
): Promise<CategoryInterest[]> {
  try {
    const result = await sitniksSafe<CategoryInterest[]>(
      "GET",
      `/api/v1/analytics/customers/${customerId}/category-interests`
    );

    return result || [];
  } catch (error) {
    console.error("[customer-analytics] Failed to get category interests:", error);
    return [];
  }
}

/**
 * Get customer's recent product views
 */
export async function getCustomerRecentViews(
  customerId: number,
  limit: number = 20
): Promise<ProductView[]> {
  try {
    const result = await sitniksSafe<ProductView[]>(
      "GET",
      `/api/v1/analytics/customers/${customerId}/recent-views?limit=${limit}`
    );

    return result || [];
  } catch (error) {
    console.error("[customer-analytics] Failed to get recent views:", error);
    return [];
  }
}

/**
 * Get personalized product recommendations
 */
export async function getPersonalizedRecommendations(
  customerId: number,
  _limit: number = 10
): Promise<PersonalizedRecommendation[]> {
  try {
    console.log("[customer-analytics] Getting recommendations for customer:", customerId);
    
    // Return empty recommendations for now
    return [];
  } catch (error) {
    console.error("[customer-analytics] Failed to get recommendations:", error);
    return [];
  }
}

/**
 * Update customer segment based on behavior
 */
export async function updateCustomerSegment(customerId: number): Promise<boolean> {
  try {
    const result = await sitniksSafe("POST", `/api/v1/analytics/customers/${customerId}/update-segment`, {
      timestamp: new Date().toISOString(),
    });

    return result !== null;
  } catch (error) {
    console.error("[customer-analytics] Failed to update customer segment:", error);
    return false;
  }
}

/**
 * Get customer segments
 */
export async function getCustomerSegments(): Promise<CustomerSegment[]> {
  try {
    const result = await sitniksSafe<CustomerSegment[]>(
      "GET",
      "/api/v1/analytics/segments"
    );

    return result || [];
  } catch (error) {
    console.error("[customer-analytics] Failed to get segments:", error);
    return [];
  }
}

/**
 * Batch track multiple product views (for performance)
 */
export async function batchTrackProductViews(
  views: Array<{
    customerId: number;
    productId: number;
    productName: string;
    category: string;
    price: number;
  }>
): Promise<boolean> {
  try {
    const result = await sitniksSafe("POST", "/api/v1/analytics/product-views/batch", {
      views: views.map(v => ({
        ...v,
        timestamp: new Date().toISOString(),
      })),
    });

    return result !== null;
  } catch (error) {
    console.error("[customer-analytics] Failed to batch track views:", error);
    return false;
  }
}
