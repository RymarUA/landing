/**
 * lib/webhook-replay-protection.ts
 *
 * Replay attack protection for webhooks.
 * 
 * Prevents duplicate webhook processing by tracking processed request IDs.
 * Uses Redis/KV store with TTL to store unique request identifiers.
 */

import { getKVStore } from "./persistent-kv-store";

const WEBHOOK_PROCESSED_PREFIX = "webhook_processed:";
const WEBHOOK_NONCE_PREFIX = "webhook_nonce:";
const WEBHOOK_TTL_SECONDS = 300; // 5 minutes

export interface WebhookRequest {
  orderReference: string;
  merchantSignature?: string;
  timestamp?: number;
  nonce?: string;
  [key: string]: any;
}

/**
 * Generate a unique request ID for replay protection
 */
export function generateWebhookRequestId(request: WebhookRequest): string {
  // Use orderReference + timestamp + signature (if available) to create unique ID
  const components = [
    request.orderReference,
    request.timestamp || Date.now(),
    request.merchantSignature || '',
    request.nonce || '',
  ];
  
  return components.join('|');
}

/**
 * Check if webhook request has been processed before
 */
export async function isWebhookProcessed(requestId: string): Promise<boolean> {
  const kv = getKVStore();
  const key = `${WEBHOOK_PROCESSED_PREFIX}${requestId}`;
  
  try {
    const exists = await kv.exists(key);
    return exists;
  } catch (error) {
    console.error("[webhook-replay] Error checking processed status:", error);
    // If KV is down, assume not processed to avoid false positives
    return false;
  }
}

/**
 * Mark webhook request as processed
 */
export async function markWebhookProcessed(requestId: string): Promise<void> {
  const kv = getKVStore();
  const key = `${WEBHOOK_PROCESSED_PREFIX}${requestId}`;
  
  try {
    await kv.set(key, Date.now(), WEBHOOK_TTL_SECONDS);
    console.log(`[webhook-replay] Marked request as processed: ${requestId}`);
  } catch (error) {
    console.error("[webhook-replay] Error marking as processed:", error);
    // Don't throw - this is protection logic, not critical
  }
}

/**
 * Check if nonce has been used before (if WayForPay sends nonce)
 */
export async function isNonceUsed(nonce: string): Promise<boolean> {
  const kv = getKVStore();
  const key = `${WEBHOOK_NONCE_PREFIX}${nonce}`;
  
  try {
    const exists = await kv.exists(key);
    return exists;
  } catch (error) {
    console.error("[webhook-replay] Error checking nonce:", error);
    return false;
  }
}

/**
 * Mark nonce as used
 */
export async function markNonceUsed(nonce: string): Promise<void> {
  const kv = getKVStore();
  const key = `${WEBHOOK_NONCE_PREFIX}${nonce}`;
  
  try {
    await kv.set(key, Date.now(), WEBHOOK_TTL_SECONDS);
    console.log(`[webhook-replay] Marked nonce as used: ${nonce}`);
  } catch (error) {
    console.error("[webhook-replay] Error marking nonce as used:", error);
  }
}

/**
 * Validate webhook for replay protection
 * Returns true if request should be processed, false if duplicate
 */
export async function validateWebhookReplayProtection(request: WebhookRequest): Promise<{
  valid: boolean;
  reason?: string;
  requestId: string;
}> {
  // Generate unique request ID
  const requestId = generateWebhookRequestId(request);
  
  console.log(`[webhook-replay] Generated request ID: ${requestId}`);
  
  // Check if already processed
  if (await isWebhookProcessed(requestId)) {
    console.warn(`[webhook-replay] ❌ Duplicate request detected: ${requestId}`);
    return {
      valid: false,
      reason: "Request already processed",
      requestId,
    };
  }
  
  // Check nonce if provided (WayForPay may not send this)
  if (request.nonce) {
    if (await isNonceUsed(request.nonce)) {
      console.warn(`[webhook-replay] ❌ Duplicate nonce detected: ${request.nonce}`);
      return {
        valid: false,
        reason: "Nonce already used",
        requestId,
      };
    }
  }
  
  // Check timestamp if provided (prevent old requests)
  if (request.timestamp) {
    const now = Date.now();
    const requestAge = now - request.timestamp;
    const maxAgeMs = 5 * 60 * 1000; // 5 minutes
    
    if (requestAge > maxAgeMs) {
      console.warn(`[webhook-replay] ❌ Request too old: ${requestAge}ms`);
      return {
        valid: false,
        reason: "Request timestamp too old",
        requestId,
      };
    }
  }
  
  console.log(`[webhook-replay] ✅ Request validation passed: ${requestId}`);
  return {
    valid: true,
    requestId,
  };
}

/**
 * Mark webhook as processed after successful validation
 */
export async function markWebhookAsProcessed(request: WebhookRequest, requestId: string): Promise<void> {
  // Mark the request as processed
  await markWebhookProcessed(requestId);
  
  // Mark nonce as used if provided
  if (request.nonce) {
    await markNonceUsed(request.nonce);
  }
}

/**
 * Cleanup old processed requests (called by cron job)
 */
export async function cleanupOldProcessedRequests(): Promise<number> {
  try {
    // This would require a scan operation which may not be available in all KV stores
    // For now, rely on TTL expiration
    console.log("[webhook-replay] Cleanup relies on TTL expiration");
    return 0;
  } catch (error) {
    console.error("[webhook-replay] Error during cleanup:", error);
    return 0;
  }
}
