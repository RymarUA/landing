/**
 * app/api/outbox/worker/route.ts
 *
 * Background worker endpoint for processing outbox items.
 * 
 * This endpoint should be called by a cron job or scheduler every few minutes
 * to process pending outbox items with retry logic and exponential backoff.
 * 
 * Usage:
 *   GET /api/outbox/worker  - Process all pending items
 *   GET /api/outbox/worker?stats=true - Get statistics only
 */

import { NextRequest, NextResponse } from "next/server";
import { processPendingOutboxItems, getOutboxStats } from "@/lib/transactional-outbox";
import { sendTelegramNotification } from "@/lib/telegram";
import { getKVStore } from "@/lib/persistent-kv-store";

// Rate limiting to prevent too frequent processing
const MIN_INTERVAL_MS = 30 * 1000; // 30 seconds minimum between runs
const LAST_RUN_KEY = "outbox_worker_last_run";

export async function GET(req: NextRequest) {
  console.log("[outbox-worker] Worker started");
  
  try {
    // Check if this is a stats-only request
    const { searchParams } = new URL(req.url);
    const statsOnly = searchParams.get("stats") === "true";
    
    if (statsOnly) {
      const stats = await getOutboxStats();
      return NextResponse.json({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Simple rate limiting using KV store
    const kvStore = getKVStore();
    const lastRunStr = await kvStore.get<string>(LAST_RUN_KEY);
    const now = Date.now();
    
    if (lastRunStr && (now - parseInt(lastRunStr)) < MIN_INTERVAL_MS) {
      console.log("[outbox-worker] Rate limited - last run too recent");
      return NextResponse.json({
        success: true,
        message: "Rate limited - last run too recent",
        nextRunAt: new Date(parseInt(lastRunStr) + MIN_INTERVAL_MS).toISOString(),
      });
    }
    
    // Update last run time
    await kvStore.set(LAST_RUN_KEY, now.toString(), 300); // 5 minutes TTL
    
    // Process pending items
    const result = await processPendingOutboxItems();
    
    // Get current stats
    const stats = await getOutboxStats();
    
    // Send alert if too many failed items
    if (stats.failed > 10) {
      const alertMsg = [
        "⚠️ Outbox Alert",
        "",
        `Failed items: ${stats.failed}`,
        `Pending items: ${stats.pending}`,
        `Dead letter: ${stats.deadLetter}`,
        "",
        "Check the outbox system immediately!",
      ].join("\n");
      
      await sendTelegramNotification(alertMsg).catch(e => 
        console.error("[outbox-worker] Failed to send alert:", e)
      );
    }
    
    console.log("[outbox-worker] Worker completed:", result);
    
    return NextResponse.json({
      success: true,
      result,
      stats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("[outbox-worker] Worker failed:", error);
    
    // Send error alert
    const errorMsg = [
      "❌ Outbox Worker Error",
      "",
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      `Time: ${new Date().toISOString()}`,
      "",
      "Check the worker logs immediately!",
    ].join("\n");
    
    await sendTelegramNotification(errorMsg).catch(e => 
      console.error("[outbox-worker] Failed to send error alert:", e)
    );
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * POST endpoint for manual triggering (admin use)
 */
export async function POST(req: NextRequest) {
  console.log("[outbox-worker] Manual worker trigger");
  
  try {
    const body = await req.json();
    const { force = false } = body;
    
    if (!force) {
      // Check rate limiting for manual triggers too
      const kvStore = getKVStore();
      const lastRunStr = await kvStore.get<string>(LAST_RUN_KEY);
      const now = Date.now();
      
      if (lastRunStr && (now - parseInt(lastRunStr)) < MIN_INTERVAL_MS) {
        return NextResponse.json({
          success: false,
          message: "Rate limited - use force=true to override",
        }, { status: 429 });
      }
    }
    
    // Process items
    const result = await processPendingOutboxItems();
    const stats = await getOutboxStats();
    
    return NextResponse.json({
      success: true,
      result,
      stats,
      timestamp: new Date().toISOString(),
      forced: force,
    });
    
  } catch (error) {
    console.error("[outbox-worker] Manual trigger failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
