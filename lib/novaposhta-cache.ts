/**
 * lib/novaposhta-cache.ts
 *
 * Caching layer for Nova Poshta API calls to reduce race conditions
 * and improve performance by debouncing duplicate requests.
 */

import { fetchNPCities, fetchNPWarehouses, type NPCity, type NPWarehouse } from './novaposhta-api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
}

class NovaPoshtaCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pending = new Map<string, PendingRequest<any>>();
  
  // TTL in milliseconds
  private readonly CITY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly WAREHOUSE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  
  /**
   * Get cached data or fetch if expired/missing
   */
  private async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Check if there's already a pending request for this key
    const pending = this.pending.get(key);
    if (pending) {
      return pending.promise;
    }

    // Create new pending request
    let resolve: (value: T) => void;
    let reject: (reason: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    this.pending.set(key, { promise, resolve: resolve!, reject: reject! });

    try {
      const data = await fetcher();
      
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
      
      // Resolve pending requests
      resolve!(data);
      return data;
    } catch (error) {
      reject!(error);
      throw error;
    } finally {
      // Clean up pending request
      this.pending.delete(key);
    }
  }

  /**
   * Fetch cities with caching and deduplication
   */
  async fetchCities(query: string, limit = 20): Promise<NPCity[]> {
    const key = `cities:${query}:${limit}`;
    return this.getOrFetch(key, () => fetchNPCities(query, limit), this.CITY_CACHE_TTL);
  }

  /**
   * Fetch warehouses with caching and deduplication
   */
  async fetchWarehouses(cityRef: string, query = "", limit = 500): Promise<NPWarehouse[]> {
    const key = `warehouses:${cityRef}:${query}:${limit}`;
    return this.getOrFetch(key, () => fetchNPWarehouses(cityRef, query, limit), this.WAREHOUSE_CACHE_TTL);
  }

  /**
   * Clear cache for specific keys or all cache
   */
  clearCache(keyPattern?: string): void {
    if (keyPattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { cities: number; warehouses: number; pending: number } {
    let cities = 0;
    let warehouses = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith('cities:')) cities++;
      if (key.startsWith('warehouses:')) warehouses++;
    }

    return {
      cities,
      warehouses,
      pending: this.pending.size
    };
  }
}

// Global cache instance
const npCache = new NovaPoshtaCache();

// Clean up expired entries every 5 minutes
setInterval(() => npCache.cleanup(), 5 * 60 * 1000);

export { npCache };
export const cachedFetchNPCities = (query: string, limit?: number) => 
  npCache.fetchCities(query, limit);
export const cachedFetchNPWarehouses = (cityRef: string, query?: string, limit?: number) => 
  npCache.fetchWarehouses(cityRef, query, limit);
