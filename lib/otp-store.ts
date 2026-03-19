/**
 * lib/otp-store.ts
 *
 * Persistent OTP storage using KV store (Redis/Vercel KV).
 * Replaces in-memory storage with persistent solution for serverless environments.
 */

import { getKVStore, type PersistentKVStore } from './persistent-kv-store';

// Store interface
export interface OtpEntry {
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export interface IpRateLimitEntry {
  count: number;
  resetTime: number;
}

export interface PhoneCooldownEntry {
  expiresAt: number;
}

// Key prefixes for KV store
const OTP_PREFIX = 'otp:';
const IP_RATE_LIMIT_PREFIX = 'ip_rate:';
const PHONE_COOLDOWN_PREFIX = 'phone_cooldown:';

// TTL constants (in seconds)
const OTP_TTL = 5 * 60; // 5 minutes
const IP_RATE_LIMIT_TTL = 15 * 60; // 15 minutes
const PHONE_COOLDOWN_TTL = 2 * 60; // 2 minutes

let kvStore: PersistentKVStore;

function getStore(): PersistentKVStore {
  if (!kvStore) {
    kvStore = getKVStore();
  }
  return kvStore;
}

// OTP operations
export async function setOtp(identifier: string, code: string): Promise<void> {
  const store = getStore();
  const key = `${OTP_PREFIX}${identifier}`;
  
  const entry: OtpEntry = {
    code,
    createdAt: Date.now(),
    expiresAt: Date.now() + OTP_TTL * 1000,
    attempts: 0,
  };

  await store.set(key, entry, OTP_TTL);
  
  // Log OTP in development only
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OTP] Code for ${identifier}: ${code}`);
  }
}

export async function getOtp(identifier: string): Promise<OtpEntry | null> {
  const store = getStore();
  const key = `${OTP_PREFIX}${identifier}`;
  
  return await store.get<OtpEntry>(key);
}

export async function deleteOtp(identifier: string): Promise<void> {
  const store = getStore();
  const key = `${OTP_PREFIX}${identifier}`;
  
  await store.delete(key);
}

export async function incrementOtpAttempts(identifier: string): Promise<OtpEntry | null> {
  const store = getStore();
  const key = `${OTP_PREFIX}${identifier}`;
  
  const entry = await store.get<OtpEntry>(key);
  if (!entry) return null;

  entry.attempts += 1;
  await store.set(key, entry, OTP_TTL);
  
  return entry;
}

// Phone cooldown operations
export async function setPhoneCooldown(phone: string): Promise<void> {
  const store = getStore();
  const key = `${PHONE_COOLDOWN_PREFIX}${phone}`;
  
  const entry: PhoneCooldownEntry = {
    expiresAt: Date.now() + PHONE_COOLDOWN_TTL * 1000,
  };

  await store.set(key, entry, PHONE_COOLDOWN_TTL);
}

export async function getPhoneCooldown(phone: string): Promise<PhoneCooldownEntry | null> {
  const store = getStore();
  const key = `${PHONE_COOLDOWN_PREFIX}${phone}`;
  
  return await store.get<PhoneCooldownEntry>(key);
}

export async function isPhoneInCooldown(phone: string): Promise<boolean> {
  const cooldown = await getPhoneCooldown(phone);
  if (!cooldown) return false;

  const now = Date.now();
  if (cooldown.expiresAt < now) {
    // Expired cooldown, clean it up
    await deletePhoneCooldown(phone);
    return false;
  }

  return true;
}

// Rate limiting functions for OTP sending
export async function canSendOtpByPhone(phone: string): Promise<boolean> {
  return !(await isPhoneInCooldown(phone));
}

export async function recordOtpSentByPhone(phone: string): Promise<void> {
  await setPhoneCooldown(phone);
}

export async function canSendOtpByIp(ip: string): Promise<boolean> {
  return !(await isIpRateLimited(ip));
}

export async function recordOtpSentByIp(ip: string): Promise<void> {
  await incrementIpRateLimit(ip);
}

export async function deletePhoneCooldown(phone: string): Promise<void> {
  const store = getStore();
  const key = `${PHONE_COOLDOWN_PREFIX}${phone}`;
  
  await store.delete(key);
}

// IP rate limiting operations
export async function setIpRateLimit(ip: string, count: number): Promise<void> {
  const store = getStore();
  const key = `${IP_RATE_LIMIT_PREFIX}${ip}`;
  
  const entry: IpRateLimitEntry = {
    count,
    resetTime: Date.now() + IP_RATE_LIMIT_TTL * 1000,
  };

  await store.set(key, entry, IP_RATE_LIMIT_TTL);
}

export async function getIpRateLimit(ip: string): Promise<IpRateLimitEntry | null> {
  const store = getStore();
  const key = `${IP_RATE_LIMIT_PREFIX}${ip}`;
  
  return await store.get<IpRateLimitEntry>(key);
}

export async function incrementIpRateLimit(ip: string): Promise<number> {
  const store = getStore();
  const key = `${IP_RATE_LIMIT_PREFIX}${ip}`;
  
  const current = await store.get<IpRateLimitEntry>(key);
  const newCount = (current?.count || 0) + 1;
  
  const entry: IpRateLimitEntry = {
    count: newCount,
    resetTime: Date.now() + IP_RATE_LIMIT_TTL * 1000,
  };

  await store.set(key, entry, IP_RATE_LIMIT_TTL);
  return newCount;
}

export async function isIpRateLimited(ip: string, maxAttempts = 5): Promise<boolean> {
  const rateLimit = await getIpRateLimit(ip);
  if (!rateLimit) return false;

  const now = Date.now();
  if (rateLimit.resetTime < now) {
    // Expired rate limit, clean it up
    await deleteIpRateLimit(ip);
    return false;
  }

  return rateLimit.count >= maxAttempts;
}

export async function deleteIpRateLimit(ip: string): Promise<void> {
  const store = getStore();
  const key = `${IP_RATE_LIMIT_PREFIX}${ip}`;
  
  await store.delete(key);
}

// Cleanup functions (for maintenance)
export async function cleanupExpiredEntries(): Promise<void> {
  // With TTL, entries auto-expire in Redis
  // For in-memory store, cleanup happens automatically
  console.log('[OTP Store] Cleanup completed (handled by TTL)');
}

// Stats and monitoring
export async function getOtpStoreStats(): Promise<{
  otpCount: number;
  phoneCooldownCount: number;
  ipRateLimitCount: number;
}> {
  // This would require Redis SCAN operation or maintaining counters
  // For now, return placeholder
  return {
    otpCount: 0,
    phoneCooldownCount: 0,
    ipRateLimitCount: 0,
  };
}

/**
 * Normalize Ukrainian phone to +380XXXXXXXXX.
 * @deprecated Use normalizePhone from @/lib/phone-utils instead
 */
export { normalizePhone as normalizePhoneForAuth } from "./phone-utils";
