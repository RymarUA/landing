/**
 * lib/otp-store.ts
 *
 * Module-level in-memory store for OTP codes (phone → { code, expires }).
 * Rate limiting: by phone (min interval) and by IP (max requests per window).
 *
 * MVP: process-scoped Map; restart clears all. For production use Redis or similar.
 */

export interface OtpEntry {
  code: string;
  expires: number; // Unix ms
}

const store = new Map<string, OtpEntry>();
const key = (phone: string) => `otp:${phone}`;

/** Rate limit: last send time per phone (min 60s between sends). */
const lastSentByPhone = new Map<string, number>();
const OTP_PHONE_COOLDOWN_MS = 60 * 1000;

/** Rate limit by IP: { count, windowStart } — max 5 per 15 min. */
const ipRateLimit = new Map<string, { count: number; windowStart: number }>();
const OTP_IP_MAX_REQUESTS = 5;
const OTP_IP_WINDOW_MS = 15 * 60 * 1000;

export function getOtp(phone: string): OtpEntry | undefined {
  return store.get(key(phone));
}

export function setOtp(phone: string, code: string, ttlMs: number): void {
  store.set(key(phone), { code, expires: Date.now() + ttlMs });
}

export function deleteOtp(phone: string): void {
  store.delete(key(phone));
}

/** Returns true if we're allowed to send OTP to this phone (cooldown elapsed). */
export function canSendOtpByPhone(phone: string): boolean {
  const last = lastSentByPhone.get(key(phone));
  if (!last) return true;
  return Date.now() - last >= OTP_PHONE_COOLDOWN_MS;
}

/** Call after sending OTP to this phone. */
export function recordOtpSentByPhone(phone: string): void {
  lastSentByPhone.set(key(phone), Date.now());
}

/** Returns true if IP is under limit (max 5 per 15 min). */
export function canSendOtpByIp(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimit.get(ip);
  if (!entry) return true;
  if (now - entry.windowStart >= OTP_IP_WINDOW_MS) return true;
  return entry.count < OTP_IP_MAX_REQUESTS;
}

/** Call after sending OTP from this IP. */
export function recordOtpSentByIp(ip: string): void {
  const now = Date.now();
  const entry = ipRateLimit.get(ip);
  if (!entry) {
    ipRateLimit.set(ip, { count: 1, windowStart: now });
    return;
  }
  if (now - entry.windowStart >= OTP_IP_WINDOW_MS) {
    ipRateLimit.set(ip, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
}

/** Normalize Ukrainian phone to +380XXXXXXXXX. */
export function normalizePhoneForAuth(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("380") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+38${digits}`;
  if (digits.length === 9) return `+380${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}
