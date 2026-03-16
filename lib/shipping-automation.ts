/**
 * lib/shipping-automation.ts
 * 
 * Automated shipping status updates for Nova Poshta packages
 * Integrates with Sitniks CRM and WayForPay for complete order lifecycle management
 */

import { getComprehensiveTracking } from "@/lib/novaposhta-api";
import { updateSitniksOrder } from "@/lib/sitniks-consolidated";

interface OrderWithTracking {
  orderReference: string;
  ttn: string;
  phone?: string;
  currentStatus?: string;
  lastChecked?: string;
}

interface ShippingUpdateResult {
  success: boolean;
  orderReference: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  autoUpdated: boolean;
}

/**
 * Check and update shipping status for a single order
 */
export async function updateOrderShippingStatus(
  order: OrderWithTracking,
  adminSecret: string
): Promise<ShippingUpdateResult> {
  try {
    const trackingInfo = await getComprehensiveTracking(
      order.ttn,
      order.orderReference,
      adminSecret
    );

    const oldStatus = order.currentStatus || 'unknown';
    let newStatus = oldStatus;

    // Determine status based on tracking information
    const statusLower = trackingInfo.status.toLowerCase();
    if (statusLower.includes('доставлено') || statusLower.includes('отримано')) {
      newStatus = 'delivered';
    } else if (statusLower.includes('відправлено') || statusLower.includes('надіслано')) {
      newStatus = 'shipped';
    } else if (statusLower.includes('в дорозі') || statusLower.includes('транзит')) {
      newStatus = 'in_transit';
    }

    // Update Sitniks if status changed
    if (oldStatus !== newStatus) {
      try {
        // Map our status to Sitniks status
        let sitniksStatus: "paid" | "shipped" | "delivered" | "cancelled";
        switch (newStatus) {
          case 'delivered':
            sitniksStatus = 'delivered';
            break;
          case 'shipped':
          case 'in_transit':
            sitniksStatus = 'shipped';
            break;
          default:
            sitniksStatus = 'shipped'; // Default to shipped for other statuses
        }
        
        await updateSitniksOrder(order.orderReference, sitniksStatus);
        // sitniksUpdated = true;
      } catch (error) {
        console.error(`[shipping-automation] Failed to update Sitniks order ${order.orderReference}:`, error);
      }
    }

    return {
      success: true,
      orderReference: order.orderReference,
      oldStatus,
      newStatus,
      message: `Status updated from ${oldStatus} to ${newStatus}`,
      autoUpdated: trackingInfo.autoUpdated || false,
    };
  } catch (error) {
    return {
      success: false,
      orderReference: order.orderReference,
      oldStatus: order.currentStatus || 'unknown',
      newStatus: order.currentStatus || 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      autoUpdated: false,
    };
  }
}

/**
 * Batch update shipping status for multiple orders
 */
export async function batchUpdateShippingStatuses(
  orders: OrderWithTracking[],
  adminSecret: string,
  options: {
    maxConcurrent?: number;
    delayBetweenUpdates?: number;
  } = {}
): Promise<ShippingUpdateResult[]> {
  const {
    maxConcurrent = 5,
    delayBetweenUpdates = 1000,
  } = options;

  const results: ShippingUpdateResult[] = [];
  
  // Process orders in batches to avoid overwhelming APIs
  for (let i = 0; i < orders.length; i += maxConcurrent) {
    const batch = orders.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (order, index) => {
      // Add delay between requests in the same batch
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenUpdates));
      }
      
      return updateOrderShippingStatus(order, adminSecret);
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          orderReference: batch[index].orderReference,
          oldStatus: batch[index].currentStatus || 'unknown',
          newStatus: batch[index].currentStatus || 'unknown',
          message: `Batch processing failed: ${result.reason}`,
          autoUpdated: false,
        });
      }
    });

    // Add delay between batches
    if (i + maxConcurrent < orders.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenUpdates * 2));
    }
  }

  return results;
}

/**
 * Get orders that need status updates
 * This would typically integrate with your order management system
 */
export async function getOrdersNeedingUpdate(
  _hoursSinceLastCheck: number = 6
): Promise<OrderWithTracking[]> {
  // This is a placeholder implementation
  // In a real application, you would:
  // 1. Query your database for orders with TTN numbers
  // 2. Filter out orders that are already delivered/cancelled
  // 3. Check when each order was last updated
  
  // For now, return empty array - implement based on your order system
  return [];
}

/**
 * Automated shipping status check (for cron jobs)
 */
export async function runAutomatedShippingUpdates(
  adminSecret: string,
  options: {
    hoursSinceLastCheck?: number;
    maxConcurrent?: number;
    notifyOnChanges?: boolean;
  } = {}
): Promise<{
  total: number;
  updated: number;
  failed: number;
  results: ShippingUpdateResult[];
}> {
  const {
    hoursSinceLastCheck = 6,
    maxConcurrent = 5,
    notifyOnChanges = true,
  } = options;

  try {
    // Get orders that need checking
    const orders = await getOrdersNeedingUpdate(hoursSinceLastCheck);
    
    if (orders.length === 0) {
      return {
        total: 0,
        updated: 0,
        failed: 0,
        results: [],
      };
    }

    console.log(`[shipping-automation] Checking ${orders.length} orders for updates`);

    // Batch update statuses
    const results = await batchUpdateShippingStatuses(orders, adminSecret, {
      maxConcurrent,
      delayBetweenUpdates: 1000,
    });

    const updated = results.filter(r => r.success && r.autoUpdated);
    const failed = results.filter(r => !r.success);

    console.log(`[shipping-automation] Updated ${updated.length} orders, ${failed.length} failed`);

    // Send notification if there were updates
    if (notifyOnChanges && updated.length > 0) {
      await sendShippingUpdateNotification(updated);
    }

    return {
      total: orders.length,
      updated: updated.length,
      failed: failed.length,
      results,
    };
  } catch (error) {
    console.error('[shipping-automation] Automated update failed:', error);
    throw error;
  }
}

/**
 * Send notification about shipping updates
 */
async function sendShippingUpdateNotification(
  updates: ShippingUpdateResult[]
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return;
  }

  const message = `
📦 <b>Shipping Status Updates</b>

${updates.map(update => `
• Order #${update.orderReference}: ${update.oldStatus} → ${update.newStatus}
${update.autoUpdated ? '✅ Auto-updated' : 'ℹ️ Status checked'}
`).join('\n')}

Total updated: ${updates.length}
  `.trim();

  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );
  } catch (error) {
    console.error('[shipping-automation] Failed to send notification:', error);
  }
}

/**
 * Manual trigger for shipping status updates
 * Useful for admin panels or manual interventions
 */
export async function triggerManualShippingUpdate(
  orderReference: string,
  ttn: string,
  adminSecret: string
): Promise<ShippingUpdateResult> {
  const order: OrderWithTracking = {
    orderReference,
    ttn,
  };

  return updateOrderShippingStatus(order, adminSecret);
}
