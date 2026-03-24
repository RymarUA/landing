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
  // Nova Poshta delivery data for TTN creation after payment
  npDelivery?: {
    cityRef: string;
    departmentRef: string;
    recipientName: string;
    recipientPhone: string;
    description: string;
    weight: number;
    cost: number;
  };
}

export async function savePendingOrder(
  orderRef: string,
  data: PendingOrderData
): Promise<void> {
  await ensureDir();
  const filePath = path.join(STORE_DIR, `${sanitizeRef(orderRef)}.json`);
  console.warn(`[pending-store] Saving orderRef=${orderRef} cwd=${process.cwd()} dir=${STORE_DIR} path=${filePath}`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  await fs.access(filePath);
  console.warn(`[pending-store] Saved pending order: ${orderRef} path=${filePath}`);
}

export async function getPendingOrder(
  orderRef: string
): Promise<PendingOrderData | null> {
  try {
    const filePath = path.join(STORE_DIR, `${sanitizeRef(orderRef)}.json`);
    console.warn(`[pending-store] Reading orderRef=${orderRef} cwd=${process.cwd()} dir=${STORE_DIR} path=${filePath}`);
    const content = await fs.readFile(filePath, "utf-8");
    console.warn(`[pending-store] Read pending order: ${orderRef} path=${filePath}`);
    return JSON.parse(content) as PendingOrderData;
  } catch (error) {
    console.warn(`[pending-store] Pending order not found: ${orderRef} dir=${STORE_DIR}`, error);
    return null;
  }
}

export async function deletePendingOrder(orderRef: string): Promise<void> {
  try {
    const filePath = path.join(STORE_DIR, `${sanitizeRef(orderRef)}.json`);
    console.warn(`[pending-store] Deleting orderRef=${orderRef} cwd=${process.cwd()} dir=${STORE_DIR} path=${filePath}`);
    await fs.unlink(filePath);
    console.warn(`[pending-store] Deleted pending order: ${orderRef} path=${filePath}`);
  } catch (error) {
    console.warn(`[pending-store] Delete skipped or failed for ${orderRef} dir=${STORE_DIR}`, error);
    // File may not exist, ignore
  }
}

function sanitizeRef(ref: string): string {
  return ref.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 100);
}
