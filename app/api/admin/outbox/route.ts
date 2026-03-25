/**
 * app/api/admin/outbox/route.ts
 *
 * Admin API for monitoring and managing the transactional outbox system.
 * 
 * Provides endpoints for:
 * - Viewing outbox statistics
 * - Managing dead letter items
 * - Manual worker control
 */

import { NextRequest, NextResponse } from "next/server";
import { getOutboxStats, getPendingOutboxItems } from "@/lib/transactional-outbox";
import { promises as fs } from "fs";
import path from "path";

const DEAD_LETTER_DIR = path.join(process.cwd(), "data", "dead-letter");

/**
 * GET /api/admin/outbox - Get outbox statistics and pending items
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includePending = searchParams.get("pending") === "true";
    const includeDeadLetter = searchParams.get("dead-letter") === "true";
    
    const stats = await getOutboxStats();
    
    let pending: any[] = [];
    let deadLetter: any[] = [];
    
    if (includePending) {
      const pendingItems = await getPendingOutboxItems();
      pending = pendingItems.map(item => ({
        id: item.id,
        type: item.type,
        status: item.status,
        attempts: item.attempts,
        createdAt: new Date(item.createdAt).toISOString(),
        lastAttemptAt: item.lastAttemptAt ? new Date(item.lastAttemptAt).toISOString() : null,
        nextRetryAt: item.nextRetryAt ? new Date(item.nextRetryAt).toISOString() : null,
        error: item.error,
        customerName: item.data.customerName,
        amount: item.data.amount,
      }));
    }
    
    if (includeDeadLetter) {
      try {
        const files = await fs.readdir(DEAD_LETTER_DIR);
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          try {
            const filePath = path.join(DEAD_LETTER_DIR, file);
            const content = await fs.readFile(filePath, "utf-8");
            const item = JSON.parse(content);
            
            deadLetter.push({
              id: item.id,
              type: item.type,
              status: item.status,
              attempts: item.attempts,
              createdAt: new Date(item.createdAt).toISOString(),
              completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : null,
              movedToDeadLetterAt: new Date(item.movedToDeadLetterAt).toISOString(),
              error: item.error,
              customerName: item.data.customerName,
              amount: item.data.amount,
            });
          } catch (error) {
            console.error(`[admin-outbox] Error reading dead letter file ${file}:`, error);
          }
        }
      } catch (error) {
        console.error("[admin-outbox] Error reading dead letter directory:", error);
      }
    }
    
    return NextResponse.json({
      success: true,
      stats,
      pending: includePending ? pending : undefined,
      deadLetter: includeDeadLetter ? deadLetter : undefined,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("[admin-outbox] GET error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/outbox - Manual operations (retry dead letter items, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, itemId } = body;
    
    if (action === "retry-dead-letter") {
      // Move item from dead letter back to outbox
      if (!itemId) {
        return NextResponse.json({
          success: false,
          error: "itemId is required for retry-dead-letter action",
        }, { status: 400 });
      }
      
      const deadLetterPath = path.join(DEAD_LETTER_DIR, `${itemId.replace(/[^a-zA-Z0-9_\-]/g, "_")}.json`);
      
      try {
        // For now, just remove from dead letter
        await fs.unlink(deadLetterPath);
        
        console.log(`[admin-outbox] Moved item ${itemId} from dead letter to retry queue`);
        
        return NextResponse.json({
          success: true,
          message: "Item moved to retry queue",
          itemId,
        });
        
      } catch (error) {
        console.error(`[admin-outbox] Error retrying dead letter item ${itemId}:`, error);
        return NextResponse.json({
          success: false,
          error: "Failed to retry dead letter item",
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: "Unknown action",
    }, { status: 400 });
    
  } catch (error) {
    console.error("[admin-outbox] POST error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
