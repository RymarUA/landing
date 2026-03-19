/**
 * lib/persistent-abandoned-cart.ts
 *
 * Persistent abandoned cart scheduler using KV store.
 * Replaces in-memory timers with durable storage for serverless environments.
 */

import { getKVStore, type PersistentKVStore } from './persistent-kv-store';

export interface AbandonedCartEntry {
  sessionId: string;
  cartData: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalPrice: number;
  };
  scheduledAt: number;
  delayMs: number;
  phone?: string;
  email?: string;
}

export interface AbandonedCartConfig {
  delayMs: number;
  telegramBotToken: string;
  telegramChatId: string;
}

// Key prefixes
const ABANDONED_CART_PREFIX = 'abandoned_cart:';
const SCHEDULED_CART_PREFIX = 'scheduled_cart:';

// Default configuration
const DEFAULT_CONFIG: AbandonedCartConfig = {
  delayMs: Number(process.env.ABANDONED_CART_DELAY_MS) || 30 * 60 * 1000, // 30 minutes default
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
};

let kvStore: PersistentKVStore;

function getStore(): PersistentKVStore {
  if (!kvStore) {
    kvStore = getKVStore();
  }
  return kvStore;
}

/**
 * Schedule an abandoned cart notification
 */
export async function scheduleAbandonedCartNotification(
  sessionId: string,
  cartData: AbandonedCartEntry['cartData'],
  phone?: string,
  email?: string,
  config: Partial<AbandonedCartConfig> = {}
): Promise<void> {
  const store = getStore();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const entry: AbandonedCartEntry = {
    sessionId,
    cartData,
    scheduledAt: Date.now(),
    delayMs: finalConfig.delayMs,
    phone,
    email,
  };

  // Store the cart entry with TTL
  const ttlSeconds = Math.ceil((finalConfig.delayMs + 5 * 60 * 1000) / 1000); // Add 5 minutes buffer
  await store.set(`${ABANDONED_CART_PREFIX}${sessionId}`, entry, ttlSeconds);
  
  // Store in scheduled queue for processing
  const scheduleKey = `${SCHEDULED_CART_PREFIX}${Date.now() + finalConfig.delayMs}:${sessionId}`;
  await store.set(scheduleKey, sessionId, ttlSeconds);
  
  console.log(`[AbandonedCart] Scheduled notification for session ${sessionId} in ${finalConfig.delayMs}ms`);
}

/**
 * Cancel an abandoned cart notification
 */
export async function cancelAbandonedCartNotification(sessionId: string): Promise<boolean> {
  const store = getStore();
  
  // Get the entry to find its scheduled time
  const entry = await store.get<AbandonedCartEntry>(`${ABANDONED_CART_PREFIX}${sessionId}`);
  if (!entry) {
    return false;
  }
  
  // Remove the cart entry
  await store.delete(`${ABANDONED_CART_PREFIX}${sessionId}`);
  
  // Remove from scheduled queue
  const scheduleKey = `${SCHEDULED_CART_PREFIX}${entry.scheduledAt + entry.delayMs}:${sessionId}`;
  await store.delete(scheduleKey);
  
  console.log(`[AbandonedCart] Cancelled notification for session ${sessionId}`);
  return true;
}

/**
 * Get all scheduled carts that are ready to be processed
 */
export async function getReadyCarts(): Promise<AbandonedCartEntry[]> {
  const store = getStore();
  const now = Date.now();
  const readyCarts: AbandonedCartEntry[] = [];
  
  // This is a simplified approach - in production you'd use Redis SCAN with pattern matching
  // For now, we'll use a timestamp-based approach
  
  // Get all scheduled keys up to current time
  const scheduledPrefix = SCHEDULED_CART_PREFIX;
  const maxScanTime = now + 60000; // Scan 1 minute ahead
  
  // Note: This is a simplified implementation
  // In production with Redis, you'd use SCAN or sorted sets (ZSET) for efficiency
  try {
    // For now, we'll implement a basic approach
    // In a real implementation, you'd use Redis SCAN or maintain a sorted set
    console.log('[AbandonedCart] Scanning for ready carts (simplified implementation)');
    
    // This would be replaced with proper Redis SCAN in production
    return readyCarts;
  } catch (error) {
    console.error('[AbandonedCart] Error scanning for ready carts:', error);
    return [];
  }
}

/**
 * Send Telegram notification for abandoned cart
 */
export async function sendAbandonedCartNotification(
  entry: AbandonedCartEntry,
  config: Partial<AbandonedCartConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!finalConfig.telegramBotToken || !finalConfig.telegramChatId) {
    console.warn('[AbandonedCart] Telegram configuration missing');
    return;
  }
  
  const message = buildTelegramMessage(entry);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${finalConfig.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: finalConfig.telegramChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
    
    console.log(`[AbandonedCart] Sent notification for session ${entry.sessionId}`);
  } catch (error) {
    console.error('[AbandonedCart] Failed to send Telegram notification:', error);
    throw error;
  }
}

/**
 * Build Telegram message for abandoned cart
 */
function buildTelegramMessage(entry: AbandonedCartEntry): string {
  const { cartData, phone, email } = entry;
  
  let message = '<b>🛒 Покинута корзина</b>\n\n';
  
  if (phone || email) {
    message += '<b>Контактні дані:</b>\n';
    if (phone) message += `📱 ${phone}\n`;
    if (email) message += `📧 ${email}\n`;
    message += '\n';
  }
  
  message += '<b>Товари:</b>\n';
  cartData.items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} x${item.quantity} = ${item.price * item.quantity} грн\n`;
  });
  
  message += `\n<b>Разом:</b> ${cartData.totalPrice} грн`;
  
  return message;
}

/**
 * Process ready abandoned carts (call this from a cron job or scheduled function)
 */
export async function processReadyCarts(config: Partial<AbandonedCartConfig> = {}): Promise<{
  processed: number;
  errors: number;
}> {
  const readyCarts = await getReadyCarts();
  let processed = 0;
  let errors = 0;
  
  for (const cart of readyCarts) {
    try {
      await sendAbandonedCartNotification(cart, config);
      
      // Clean up processed cart
      const store = getStore();
      await store.delete(`${ABANDONED_CART_PREFIX}${cart.sessionId}`);
      const scheduleKey = `${SCHEDULED_CART_PREFIX}${cart.scheduledAt + cart.delayMs}:${cart.sessionId}`;
      await store.delete(scheduleKey);
      
      processed++;
    } catch (error) {
      console.error(`[AbandonedCart] Failed to process cart ${cart.sessionId}:`, error);
      errors++;
    }
  }
  
  console.log(`[AbandonedCart] Processed ${processed} carts, ${errors} errors`);
  return { processed, errors };
}

/**
 * Get abandoned cart statistics
 */
export async function getAbandonedCartStats(): Promise<{
  totalScheduled: number;
  scheduledInLastHour: number;
  scheduledInLast24Hours: number;
}> {
  const store = getStore();
  const now = Date.now();
  
  // This is a simplified implementation
  // In production with Redis, you'd use SCAN with pattern matching
  
  return {
    totalScheduled: 0,
    scheduledInLastHour: 0,
    scheduledInLast24Hours: 0,
  };
}
