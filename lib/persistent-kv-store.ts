/**
 * lib/persistent-kv-store.ts
 *
 * Persistent KV storage interface for OTP, rate limiting, and abandoned cart.
 * Compatible with Vercel KV (Redis), Upstash Redis, or any Redis-compatible store.
 */

export interface KVEntry<T = any> {
  value: T;
  expiresAt?: number; // Unix timestamp
}

export interface PersistentKVStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  increment(key: string, amount?: number): Promise<number>;
  clear(prefix?: string): Promise<void>;
}

/**
 * Minimal Vercel KV REST implementation (no external deps)
 */
class VercelKVStore implements PersistentKVStore {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  private async command<T>(args: (string | number)[]): Promise<T> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      // Remove cache: "no-store" to allow static generation
      next: { revalidate: 300 }, // 5 minutes cache
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`[KVStore] HTTP ${res.status}: ${text}`);
    }

    const data = (await res.json()) as { result: T; error?: string };
    if (data.error) {
      throw new Error(`[KVStore] Command error: ${data.error}`);
    }

    return data.result;
  }

  private serialize<T>(value: T): string {
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }

  private deserialize<T>(raw: string | null): T | null {
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.command<string | null>(["GET", key]);
      return this.deserialize<T>(result);
    } catch (error) {
      console.error("[KVStore] GET error:", error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = this.serialize(value);
    const command = ttlSeconds
      ? ["SETEX", key, ttlSeconds, serialized]
      : ["SET", key, serialized];

    await this.command(command);
  }

  async delete(key: string): Promise<void> {
    await this.command(["DEL", key]);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.command<number>(["EXISTS", key]);
    return result === 1;
  }

  async increment(key: string, amount = 1): Promise<number> {
    return await this.command<number>(["INCRBY", key, amount]);
  }

  async clear(prefix?: string): Promise<void> {
    if (!prefix) {
      console.warn("[KVStore] Clearing entire database");
      await this.command(["FLUSHDB"]);
      return;
    }

    let cursor = "0";
    const keys: string[] = [];

    do {
      const [nextCursor, batch] = await this.command<[string, string[]]>([
        "SCAN",
        cursor,
        "MATCH",
        `${prefix}*`,
        "COUNT",
        100,
      ]);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== "0");

    if (keys.length) {
      await this.command(["DEL", ...keys]);
    }
  }
}

/**
 * Fallback in-memory implementation for development
 * Note: This will lose data on serverless function restarts
 */
export class InMemoryKVStore implements PersistentKVStore {
  private store = new Map<string, KVEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const entry: KVEntry<T> = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    };
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  async increment(key: string, amount = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }

  async clear(prefix?: string): Promise<void> {
    if (prefix) {
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) {
          this.store.delete(key);
        }
      }
    } else {
      this.store.clear();
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Global KV store instance
 */
let kvStore: PersistentKVStore;

export function getKVStore(): PersistentKVStore {
  if (!kvStore) {
    // Try to initialize Redis store if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        kvStore = new VercelKVStore(
          process.env.KV_REST_API_URL,
          process.env.KV_REST_API_TOKEN,
        );
        console.log('[KVStore] Using Vercel KV via REST');
      } catch (error) {
        console.error('[KVStore] Failed to initialize Vercel KV:', error);
      }
    }

    // Fallback to in-memory store
    if (!kvStore) {
      kvStore = new InMemoryKVStore();
      console.warn('[KVStore] Using in-memory store (data will be lost on restart)');
    }
  }

  return kvStore;
}

// Helper functions for common patterns
export async function withTTL<T>(
  store: PersistentKVStore,
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await store.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fn();
  await store.set(key, value, ttlSeconds);
  return value;
}
