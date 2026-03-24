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
  // Get the entry to find its scheduled time
  const entry = await getStore().get<AbandonedCartEntry>(`${ABANDONED_CART_PREFIX}${sessionId}`);
  if (!entry) {
    return false;
  }
  
  // Remove the cart entry
  const store = getStore();
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
  const now = Date.now();
  const readyCarts: AbandonedCartEntry[] = [];
  const store = getStore();
  
  try {
    // Scan for scheduled cart keys that are ready
    // Use the clear method with prefix to get all scheduled keys
    // Since we can't directly get all keys with SCAN in this implementation,
    // we'll use a timestamp-based approach with a reasonable time window
    
    // Look for scheduled carts from the last 24 hours that should be ready now
    // This is a practical approach for serverless environments
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours ago
    const startTime = now - timeWindow;
    
    console.log(`[AbandonedCart] Scanning for ready carts since ${new Date(startTime).toISOString()}`);
    
    // For Vercel KV, we would use SCAN, but for our implementation,
    // we'll check a reasonable number of recent timestamp keys
    const timeSteps = 60; // Check every minute for the last hour
    const stepMs = 60 * 1000; // 1 minute steps
    
    for (let i = 0; i < timeSteps; i++) {
      const checkTime = now - (i * stepMs);
      // const timePrefix = `${SCHEDULED_CART_PREFIX}${checkTime}`; // Unused variable
      
      // Try to find keys around this timestamp
      // This is a simplified approach - in production with Redis SCAN you'd be more efficient
      const possibleKeys = [];
      
      // Check a small window around each timestamp (±30 seconds)
      for (let offset = -30; offset <= 30; offset += 10) {
        const offsetTime = checkTime + (offset * 1000);
        possibleKeys.push(`${SCHEDULED_CART_PREFIX}${offsetTime}`);
      }
      
      // Check each possible key
      for (const key of possibleKeys) {
        try {
          const sessionId = await store.get<string>(key);
          if (sessionId) {
            // Found a scheduled cart, get the full entry
            const cartEntry = await store.get<AbandonedCartEntry>(`${ABANDONED_CART_PREFIX}${sessionId}`);
            if (cartEntry) {
              const scheduledTime = cartEntry.scheduledAt + cartEntry.delayMs;
              if (scheduledTime <= now) {
                readyCarts.push(cartEntry);
                console.log(`[AbandonedCart] Found ready cart: session ${sessionId}, scheduled ${new Date(scheduledTime).toISOString()}`);
              }
            }
          }
        } catch {
          // Key might not exist or be expired, continue
          continue;
        }
      }
    }
    
    console.log(`[AbandonedCart] Found ${readyCarts.length} ready carts`);
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
      await getStore().delete(`${ABANDONED_CART_PREFIX}${cart.sessionId}`);
      const scheduleKey = `${SCHEDULED_CART_PREFIX}${cart.scheduledAt + cart.delayMs}:${cart.sessionId}`;
      await getStore().delete(scheduleKey);
      
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
  const now = Date.now();
  const store = getStore();
  
  try {
    // Count carts scheduled in different time windows
    let totalScheduled = 0;
    let scheduledInLastHour = 0;
    let scheduledInLast24Hours = 0;
    
    // Scan recent scheduled carts (similar approach to getReadyCarts)
    const timeSteps = 60; // Check every minute for the last hour
    const stepMs = 60 * 1000; // 1 minute steps
    
    for (let i = 0; i < timeSteps; i++) {
      const checkTime = now - (i * stepMs);
      
      // Check a small window around each timestamp
      for (let offset = -30; offset <= 30; offset += 10) {
        const offsetTime = checkTime + (offset * 1000);
        const key = `${SCHEDULED_CART_PREFIX}${offsetTime}`;
        
        try {
          const sessionId = await store.get<string>(key);
          if (sessionId) {
            totalScheduled++;
            
            // Check if scheduled in last hour
            if (offsetTime >= (now - 60 * 60 * 1000)) {
              scheduledInLastHour++;
            }
            
            // Check if scheduled in last 24 hours
            if (offsetTime >= (now - 24 * 60 * 60 * 1000)) {
              scheduledInLast24Hours++;
            }
          }
        } catch {
          // Key might not exist or be expired, continue
          continue;
        }
      }
    }
    
    console.log(`[AbandonedCart] Stats: ${totalScheduled} total, ${scheduledInLastHour} last hour, ${scheduledInLast24Hours} last 24h`);
    
    return {
      totalScheduled,
      scheduledInLastHour,
      scheduledInLast24Hours,
    };
    
  } catch (error) {
    console.error('[AbandonedCart] Error getting stats:', error);
    return {
      totalScheduled: 0,
      scheduledInLastHour: 0,
      scheduledInLast24Hours: 0,
    };
  }
}
