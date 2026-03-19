/**
 * lib/phone-utils.ts
 *
 * Unified phone number normalization utilities for Ukrainian phone numbers.
 * All phone handling across the app should use these functions.
 */

/**
 * Normalizes a Ukrainian phone number to +380XXXXXXXXX format.
 * 
 * Accepts various input formats:
 * - "0671234567" → "+380671234567"
 * - "+380671234567" → "+380671234567"
 * - "380671234567" → "+380671234567"
 * - "80671234567" → "+380671234567"
 * 
 * @param raw - Raw phone number input
 * @returns Normalized phone in +380XXXXXXXXX format
 * @throws Error if phone format is invalid
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  
  // Already in correct format: 380XXXXXXXXX (12 digits)
  if (digits.startsWith("380") && digits.length === 12) {
    return `+${digits}`;
  }
  
  // Ukrainian mobile: 0XXXXXXXXX (10 digits)
  if (digits.startsWith("0") && digits.length === 10) {
    return `+38${digits}`;
  }
  
  // Alternative format: 80XXXXXXXXX (11 digits)
  if (digits.startsWith("80") && digits.length === 11) {
    return `+3${digits}`;
  }
  
  // 9 digits without prefix
  if (digits.length === 9) {
    return `+380${digits}`;
  }
  
  throw new Error("Invalid phone format. Expected Ukrainian number");
}

/**
 * Validates if a string looks like a Ukrainian phone number.
 * Does not normalize, just checks format.
 * 
 * @param phone - Phone number to validate
 * @returns true if valid Ukrainian phone format
 */
export function isValidUkrainianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  
  // Check various valid formats
  if (digits.length === 10 && digits.startsWith("0")) return true;
  if (digits.length === 12 && digits.startsWith("380")) return true;
  if (digits.length === 11 && digits.startsWith("80")) return true;
  if (digits.length === 9) return true;
  
  return false;
}

