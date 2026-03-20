/**
 * lib/pending-orders-store.ts
 *
 * File-based temporary store for online payment orders.
 * Orders are stored here BEFORE payment is confirmed.
 * After WayForPay confirms payment (webhook or verify),
 * the order is created in Sitniks and deleted from this store.
 *
 * Storage: {cwd}/data/pending-orders/{orderRef}.json
 * Cleanup: files older than 24h can be safely deleted by a cron job.
 */

import { promises as fs } from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), "data", "pending-orders");

async function ensureDir(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

export interface PendingOrderData {
  orderRef: string;
  dto: Record<string, unknown>;
  amount: number;
  customerName: string;
  customerPhone: string;
  createdAt: number;
}

export async function savePendingOrder(
  orderRef: string,
  data: PendingOrderData
): Promise<void> {
  await ensureDir();
  const filePath = path.join(STORE_DIR, `${sanitizeRef(orderRef)}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`[pending-store] Saved pending order: ${orderRef}`);
}

export async function getPendingOrder(
  orderRef: string
): Promise<PendingOrderData | null> {
  try {
    const filePath = path.join(STORE_DIR, `${sanitizeRef(orderRef)}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as PendingOrderData;
  } catch {
    return null;
  }
}

export async function deletePendingOrder(orderRef: string): Promise<void> {
  try {
    const filePath = path.join(STORE_DIR, `${sanitizeRef(orderRef)}.json`);
    await fs.unlink(filePath);
    console.log(`[pending-store] Deleted pending order: ${orderRef}`);
  } catch {
    // File may not exist, ignore
  }
}

function sanitizeRef(ref: string): string {
  return ref.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 100);
}
