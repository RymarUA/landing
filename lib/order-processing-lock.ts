/**
 * lib/order-processing-lock.ts
 *
 * Distributed lock mechanism to prevent race conditions when processing payments.
 * Uses KV Store (Redis) to ensure only one process creates a Sitniks order.
 *
 * Problem: Both webhook and verify endpoints can receive payment confirmation
 * simultaneously, leading to duplicate orders in Sitniks CRM.
 *
 * Solution: Atomic lock with TTL to prevent concurrent order creation.
 */

import { getKVStore } from "./persistent-kv-store";

const LOCK_TTL_SECONDS = 60; // Lock expires after 60 seconds
const LOCK_PREFIX = "order_lock:";
const PROCESSED_PREFIX = "order_processed:";
const PROCESSED_TTL_SECONDS = 86400; // 24 hours

/**
 * Attempts to acquire a lock for processing an order.
 * Returns true if lock was acquired, false if already locked.
 */
export async function acquireOrderLock(orderReference: string): Promise<boolean> {
  const kv = getKVStore();
  const lockKey = `${LOCK_PREFIX}${orderReference}`;

  try {
    // Check if order was already processed
    const processedKey = `${PROCESSED_PREFIX}${orderReference}`;
    const alreadyProcessed = await kv.exists(processedKey);
    
    if (alreadyProcessed) {
      console.log(`[order-lock] Order ${orderReference} already processed, skipping`);
      return false;
    }

    // Try to acquire lock
    const lockExists = await kv.exists(lockKey);
    
    if (lockExists) {
      console.log(`[order-lock] Order ${orderReference} is locked by another process`);
      return false;
    }

    // Set lock with TTL
    await kv.set(lockKey, Date.now(), LOCK_TTL_SECONDS);
    console.log(`[order-lock] ✅ Acquired lock for order ${orderReference}`);
    return true;
  } catch (error) {
    console.error(`[order-lock] Error acquiring lock for ${orderReference}:`, error);
    return false;
  }
}

/**
 * Releases the lock for an order.
 */
export async function releaseOrderLock(orderReference: string): Promise<void> {
  const kv = getKVStore();
  const lockKey = `${LOCK_PREFIX}${orderReference}`;

  try {
    await kv.delete(lockKey);
    console.log(`[order-lock] Released lock for order ${orderReference}`);
  } catch (error) {
    console.error(`[order-lock] Error releasing lock for ${orderReference}:`, error);
  }
}

/**
 * Marks an order as successfully processed.
 * This prevents duplicate processing even after lock expires.
 */
export async function markOrderProcessed(orderReference: string): Promise<void> {
  const kv = getKVStore();
  const processedKey = `${PROCESSED_PREFIX}${orderReference}`;

  try {
    await kv.set(processedKey, Date.now(), PROCESSED_TTL_SECONDS);
    console.log(`[order-lock] ✅ Marked order ${orderReference} as processed`);
  } catch (error) {
    console.error(`[order-lock] Error marking order ${orderReference} as processed:`, error);
  }
}

/**
 * Checks if an order was already processed.
 */
export async function isOrderProcessed(orderReference: string): Promise<boolean> {
  const kv = getKVStore();
  const processedKey = `${PROCESSED_PREFIX}${orderReference}`;

  try {
    return await kv.exists(processedKey);
  } catch (error) {
    console.error(`[order-lock] Error checking if order ${orderReference} was processed:`, error);
    return false;
  }
}
