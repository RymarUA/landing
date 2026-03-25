/**
 * lib/transactional-outbox.ts
 *
 * Transactional Outbox pattern implementation for reliable CRM integration.
 * 
 * When payment is confirmed, order data is stored in outbox first.
 * Background worker processes outbox items with retry logic and exponential backoff.
 * 
 * This ensures no orders are lost even if Sitniks CRM is temporarily unavailable.
 */

import { promises as fs } from "fs";
import path from "path";
import { type CreateOrderDto } from "./sitniks-consolidated";
import { createOrderTransaction } from "./transaction-manager";

const OUTBOX_DIR = path.join(process.cwd(), "data", "outbox");
const DEAD_LETTER_DIR = path.join(process.cwd(), "data", "dead-letter");

// Retry configuration
const MAX_RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 60 * 1000; // 1 minute
const MAX_RETRY_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Ensure directories exist
async function ensureDirs(): Promise<void> {
  await fs.mkdir(OUTBOX_DIR, { recursive: true });
  await fs.mkdir(DEAD_LETTER_DIR, { recursive: true });
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 100);
}

export interface OutboxItem {
  id: string;
  type: "create_order";
  data: {
    orderDto: CreateOrderDto;
    customerName: string;
    customerPhone: string;
    amount: number;
    cardMask?: string;
    npDelivery?: {
      cityRef: string;
      departmentRef: string;
      recipientName: string;
      recipientPhone: string;
      description: string;
      weight: number;
      cost: number;
    };
  };
  status: "pending" | "processing" | "completed" | "failed" | "dead_letter";
  attempts: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

/**
 * Add order to outbox for processing
 */
export async function addToOutbox(item: Omit<OutboxItem, "id" | "status" | "attempts" | "createdAt">): Promise<string> {
  await ensureDirs();
  
  const id = `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const outboxItem: OutboxItem = {
    id,
    ...item,
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
  };
  
  const filePath = path.join(OUTBOX_DIR, `${sanitizeId(id)}.json`);
  await fs.writeFile(filePath, JSON.stringify(outboxItem, null, 2), "utf-8");
  
  console.log(`[outbox] Added item ${id} of type ${item.type}`);
  return id;
}

/**
 * Get outbox item by ID
 */
export async function getOutboxItem(id: string): Promise<OutboxItem | null> {
  try {
    const filePath = path.join(OUTBOX_DIR, `${sanitizeId(id)}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as OutboxItem;
  } catch {
    return null;
  }
}

/**
 * Get all pending outbox items that are ready for retry
 */
export async function getPendingOutboxItems(): Promise<OutboxItem[]> {
  await ensureDirs();
  
  try {
    const files = await fs.readdir(OUTBOX_DIR);
    const items: OutboxItem[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(OUTBOX_DIR, file);
        const content = await fs.readFile(filePath, "utf-8");
        const item = JSON.parse(content) as OutboxItem;
        
        // Include items that are pending or ready for retry
        if (item.status === "pending" || 
            (item.status === "failed" && item.nextRetryAt && item.nextRetryAt <= Date.now())) {
          items.push(item);
        }
      } catch (error) {
        console.error(`[outbox] Error reading file ${file}:`, error);
      }
    }
    
    // Sort by creation time (oldest first)
    return items.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error("[outbox] Error reading outbox directory:", error);
    return [];
  }
}

/**
 * Update outbox item status
 */
export async function updateOutboxItem(id: string, updates: Partial<OutboxItem>): Promise<void> {
  const item = await getOutboxItem(id);
  if (!item) {
    throw new Error(`Outbox item ${id} not found`);
  }
  
  const updatedItem = { ...item, ...updates };
  const filePath = path.join(OUTBOX_DIR, `${sanitizeId(id)}.json`);
  await fs.writeFile(filePath, JSON.stringify(updatedItem, null, 2), "utf-8");
}

/**
 * Calculate exponential backoff delay
 */
function calculateRetryDelay(attempt: number): number {
  const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
  return Math.min(delay, MAX_RETRY_DELAY_MS);
}

/**
 * Move item to dead letter queue
 */
async function moveToDeadLetter(id: string, item: OutboxItem, errorMessage: string): Promise<void> {
  await ensureDirs();
  
  const deadLetterItem = {
    ...item,
    status: "dead_letter" as const,
    movedToDeadLetterAt: Date.now(),
    error: errorMessage,
  };
  
  const filePath = path.join(DEAD_LETTER_DIR, `${sanitizeId(id)}.json`);
  await fs.writeFile(filePath, JSON.stringify(deadLetterItem, null, 2), "utf-8");
  
  // Remove from outbox
  const outboxPath = path.join(OUTBOX_DIR, `${sanitizeId(id)}.json`);
  try {
    await fs.unlink(outboxPath);
  } catch (error) {
    console.error(`[outbox] Error removing item ${id} from outbox:`, error);
  }
  
  console.error(`[outbox] Moved item ${id} to dead letter queue after ${item.attempts} attempts`);
}

/**
 * Process a single outbox item with transaction support
 */
export async function processOutboxItem(id: string): Promise<boolean> {
  const item = await getOutboxItem(id);
  if (!item) {
    console.error(`[outbox] Item not found: ${id}`);
    return false;
  }

  if (item.status !== "pending") {
    console.warn(`[outbox] Item ${id} is not pending (status: ${item.status})`);
    return false;
  }

  // Check if it's time to retry
  if (item.nextRetryAt && new Date(item.nextRetryAt) > new Date()) {
    console.log(`[outbox] Item ${id} not ready for retry until ${item.nextRetryAt}`);
    return false;
  }

  console.log(`[outbox] Processing item ${id} (attempt ${item.attempts + 1}/${MAX_RETRY_ATTEMPTS})`);

  // Update status to processing
  await updateOutboxItem(id, {
    status: "processing",
    lastAttemptAt: Date.now(),
  });

  try {
    if (item.type === "create_order") {
      const { orderDto, customerName, customerPhone, amount, cardMask, npDelivery } = item.data;
      
      // Use transaction manager for ACID-like operations
      const result = await createOrderTransaction(
        orderDto,
        customerName,
        customerPhone,
        amount,
        cardMask,
        npDelivery
      );

      if (result.success) {
        // Mark as completed
        await updateOutboxItem(id, {
          status: "completed",
          completedAt: Date.now(),
        });

        console.log(`[outbox] ✅ Item ${id} completed successfully`);
        console.log(`[outbox] Completed steps: ${result.completedSteps.join(", ")}`);
        
        return true;
      } else {
        throw new Error(`Transaction failed: ${result.error} (failed at: ${result.failedStep})`);
      }
    }

    throw new Error(`Unknown outbox item type: ${item.type}`);

  } catch (error) {
    console.error(`[outbox] ❌ Failed to process item ${id}:`, error);

    const newAttempts = item.attempts + 1;
    const shouldRetry = newAttempts < MAX_RETRY_ATTEMPTS;
    const nextRetryAt = shouldRetry ? new Date(Date.now() + calculateRetryDelay(newAttempts)).toISOString() : undefined;

    if (shouldRetry) {
      // Update for retry
      await updateOutboxItem(id, {
        status: "pending",
        attempts: newAttempts,
        lastAttemptAt: Date.now(),
        nextRetryAt: shouldRetry ? Date.now() + calculateRetryDelay(newAttempts) : undefined,
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`[outbox] 🔄 Item ${id} scheduled for retry ${newAttempts}/${MAX_RETRY_ATTEMPTS} at ${nextRetryAt}`);
    } else {
      // Move to dead letter
      await moveToDeadLetter(id, item, error instanceof Error ? error.message : String(error));
      console.log(`[outbox] 💀 Item ${id} moved to dead letter after ${MAX_RETRY_ATTEMPTS} attempts`);
    }

    return false;
  }
}

/**
 * Process all pending outbox items
 */
export async function processPendingOutboxItems(): Promise<{ processed: number; failed: number }> {
  const items = await getPendingOutboxItems();
  
  if (items.length === 0) {
    console.log("[outbox] No pending items to process");
    return { processed: 0, failed: 0 };
  }
  
  console.log(`[outbox] Processing ${items.length} pending items`);
  
  let processed = 0;
  let failed = 0;
  
  for (const item of items) {
    try {
      const success = await processOutboxItem(item.id);
      
      if (success) {
        processed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`[outbox] Error processing item ${item.id}:`, error);
      failed++;
    }
  }
  
  console.log(`[outbox] Processed ${processed} items, ${failed} failed`);
  return { processed, failed };
}

/**
 * Get outbox statistics
 */
export async function getOutboxStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetter: number;
}> {
  await ensureDirs();
  
  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    deadLetter: 0,
  };
  
  // Count outbox items
  try {
    const outboxFiles = await fs.readdir(OUTBOX_DIR);
    for (const file of outboxFiles) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(OUTBOX_DIR, file);
        const content = await fs.readFile(filePath, "utf-8");
        const item = JSON.parse(content) as OutboxItem;
        if (item.status === 'dead_letter') {
          // dead_letter items are handled separately in dead letter directory
          continue;
        }
        stats[item.status]++;
      } catch (error) {
        console.error(`[outbox] Error reading file ${file}:`, error);
      }
    }
  } catch (error) {
    console.error("[outbox] Error reading outbox directory:", error);
  }
  
  // Count dead letter items
  try {
    const deadLetterFiles = await fs.readdir(DEAD_LETTER_DIR);
    stats.deadLetter = deadLetterFiles.filter(f => f.endsWith('.json')).length;
  } catch (error) {
    console.error("[outbox] Error reading dead letter directory:", error);
  }
  
  return stats;
}
