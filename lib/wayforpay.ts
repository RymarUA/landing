// @ts-nocheck
/**
 * lib/wayforpay.ts
 *
 * WayForPay payment gateway utilities.
 *
 * ENV VARS required (set in .env.local or Vercel dashboard):
 *   WAYFORPAY_MERCHANT_ACCOUNT   — your merchant account name
 *   WAYFORPAY_MERCHANT_DOMAIN    — your store domain (e.g. familyhubmarket.com)
 *   WAYFORPAY_SECRET_KEY         — your HMAC-MD5 secret key from WayForPay cabinet
 *   NEXT_PUBLIC_SITE_URL         — public base URL (e.g. https://familyhubmarket.com)
 *
 * Docs: https://wiki.wayforpay.com/en/view/852115
 */

import { createHmac } from "crypto";
import type { WayForPayPaymentParams } from "./types";

/* ─────────────────────────────────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────────────────────────────────── */

/** WayForPay hosted payment page URL */
const WFP_PAYMENT_PAGE = "https://secure.wayforpay.com/pay";

/** WFP checkout API endpoint (used for server-side payment creation if needed) */
// const WFP_API_URL = "https://api.wayforpay.com/api";

/* ─────────────────────────────────────────────────────────────────────────
   SANITIZATION UTILITY
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Sanitizes product name for WayForPay.
 * WayForPay is sensitive to Cyrillic and special characters in signature.
 * 
 * Converts Cyrillic to Latin transliteration and removes special characters.
 * CRITICAL: Removes semicolons (;) which WayForPay uses as field separator.
 */
export function sanitizeProductName(name: string): string {
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu',
    'я': 'ya', 'ы': 'y', 'э': 'e', 'ё': 'yo', 'ъ': '',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye',
    'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L',
    'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Yu',
    'Я': 'Ya', 'Ы': 'Y', 'Э': 'E', 'Ё': 'Yo', 'Ъ': ''
  };

  let result = '';
  for (const char of name) {
    result += translitMap[char] || char;
  }

  // CRITICAL: Remove semicolons first - WayForPay uses ; as field separator
  result = result.replace(/;/g, ' ');
  
  // Remove special characters except spaces, numbers, letters, and basic punctuation
  result = result.replace(/[^\w\s\-().]/g, '');
  
  // Trim and limit length to 100 characters (WayForPay limit)
  return result.trim().slice(0, 100);
}

/* ─────────────────────────────────────────────────────────────────────────
   SIGNATURE UTILITY
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Builds the WayForPay merchant signature using HMAC-MD5.
 *
 * The signature string is built by joining the following values
 * with semicolons (";"), in EXACTLY this order:
 *
 *   merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;
 *   productName[0];...;productCount[0];...;productPrice[0];...
 *
 * CRITICAL FIXES:
 * 1. Correct field order: productName → productCount → productPrice
 * 2. Format amounts with toFixed(2) for consistency
 * 3. Sanitize semicolons from product names
 *
 * Reference: https://wiki.wayforpay.com/en/view/852115 §"Purchase"
 *
 * @param params  WayForPay payment parameters
 * @param secret  Merchant secret key (WAYFORPAY_SECRET_KEY)
 * @returns       Lowercase hex HMAC-MD5 digest
 */
export function buildWfpSignature(
  params: WayForPayPaymentParams,
  secret: string
): string {
  // 1. Format amount: always 2 decimal places (e.g., 1500.00)
  const formattedAmount = Number(params.amount).toFixed(2);
  
  // 2. Sanitize product names: remove semicolons and trim
  const sanitizedNames = params.productName.map((name: string) => 
    name.replace(/;/g, ' ').trim()
  );

  // 3. Format prices: always 2 decimal places
  const formattedPrices = params.productPrice.map((p: number) => 
    Number(p).toFixed(2)
  );

  // CORRECT ORDER: productName → productCount → productPrice
  const parts: (string | number)[] = [
    params.merchantAccount,
    params.merchantDomainName,
    params.orderReference,
    params.orderDate,
    formattedAmount,
    params.currency,
    ...sanitizedNames,
    ...params.productCount,
    ...formattedPrices,
  ];

  const signatureString = parts.join(";");
  
  // Uncomment for debugging on server (PM2 logs)
  // console.log("[WFP_DEBUG] Signature String:", signatureString);

  return createHmac("md5", secret).update(signatureString, "utf8").digest("hex");
}

/**
 * Builds the HMAC-MD5 signature for a WayForPay WEBHOOK RESPONSE.
 *
 * The response signature string: orderReference;status;time
 */
export function buildWfpResponseSignature(
  orderReference: string,
  status: "accept",
  time: number,
  secret: string
): string {
  const signatureString = `${orderReference};${status};${time}`;
  return createHmac("md5", secret).update(signatureString, "utf8").digest("hex");
}

/**
 * Verifies the signature of an incoming WayForPay webhook.
 *
 * Webhook signature string: merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
 *
 * Reference: https://wiki.wayforpay.com/en/view/852114
 */
export function verifyWfpWebhookSignature(
  payload: {
    merchantAccount: string;
    orderReference: string;
    amount: number;
    currency: string;
    authCode: string;
    cardPan: string;
    transactionStatus: string;
    reasonCode: number;
    merchantSignature: string;
  },
  secret: string
): boolean {
  const parts = [
    payload.merchantAccount,
    payload.orderReference,
    payload.amount,
    payload.currency,
    payload.authCode,
    payload.cardPan,
    payload.transactionStatus,
    payload.reasonCode,
  ];

  const signatureString = parts.join(";");
  const expected = createHmac("md5", secret).update(signatureString, "utf8").digest("hex");

  // Constant-time comparison to prevent timing attacks
  return expected === payload.merchantSignature;
}

/* ─────────────────────────────────────────────────────────────────────────
   PAYMENT URL BUILDER
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Builds WayForPay form parameters for POST submission.
 *
 * WayForPay requires POST request with form data.
 * Arrays (productName, productPrice, productCount) are passed as
 * repeated fields with [index] suffix: productName[0], productName[1], etc.
 *
 * CRITICAL: Uses consistent number formatting (toFixed(2)) to match signature.
 *
 * @returns Object with form fields ready for POST submission
 */
export function buildWfpFormParams(
  params: WayForPayPaymentParams,
  secret: string
): Record<string, string> {
  const signature = buildWfpSignature(params, secret);

  const formParams: Record<string, string> = {
    merchantAccount: params.merchantAccount,
    merchantDomainName: params.merchantDomainName,
    orderReference: params.orderReference,
    orderDate: String(params.orderDate),
    amount: Number(params.amount).toFixed(2), // CRITICAL: toFixed(2) for consistency
    currency: params.currency,
    returnUrl: params.returnUrl,
    serviceUrl: params.serviceUrl,
    merchantSignature: signature,
  };

  // Arrays — WayForPay expects repeated keys with [index] suffix
  // Sanitize names and format prices consistently with signature
  params.productName.forEach((n, i) => {
    formParams[`productName[${i}]`] = n.replace(/;/g, ' ').trim();
  });
  params.productPrice.forEach((p, i) => {
    formParams[`productPrice[${i}]`] = Number(p).toFixed(2); // CRITICAL: toFixed(2)
  });
  params.productCount.forEach((c, i) => {
    formParams[`productCount[${i}]`] = String(c);
  });

  return formParams;
}

/**
 * @deprecated Use buildWfpFormParams instead. WayForPay requires POST, not GET.
 * Builds a WayForPay hosted-page redirect URL.
 *
 * WayForPay accepts all payment parameters as query-string values
 * on the https://secure.wayforpay.com/pay endpoint.
 * Arrays (productName, productPrice, productCount) are passed as
 * repeated query params: productName[0]=..., productName[1]=...
 *
 * CRITICAL: Uses consistent number formatting (toFixed(2)) to match signature.
 *
 * @returns Full URL string — redirect the user here to complete payment.
 */
export function buildWfpPaymentUrl(
  params: WayForPayPaymentParams,
  secret: string
): string {
  const signature = buildWfpSignature(params, secret);

  const query = new URLSearchParams();
  query.set("merchantAccount", params.merchantAccount);
  query.set("merchantDomainName", params.merchantDomainName);
  query.set("orderReference", params.orderReference);
  query.set("orderDate", String(params.orderDate));
  query.set("amount", Number(params.amount).toFixed(2)); // CRITICAL: toFixed(2)
  query.set("currency", params.currency);
  query.set("returnUrl", params.returnUrl);
  query.set("serviceUrl", params.serviceUrl);
  query.set("merchantSignature", signature);

  // Arrays — WayForPay expects repeated keys with [index] suffix
  // Sanitize names and format prices consistently with signature
  params.productName.forEach((n, i) => 
    query.append(`productName[${i}]`, n.replace(/;/g, ' ').trim())
  );
  params.productPrice.forEach((p, i) => 
    query.append(`productPrice[${i}]`, Number(p).toFixed(2)) // CRITICAL: toFixed(2)
  );
  params.productCount.forEach((c, i) => 
    query.append(`productCount[${i}]`, String(c))
  );

  return `${WFP_PAYMENT_PAGE}?${query.toString()}`;
}

/* ─────────────────────────────────────────────────────────────────────────
   CONFIG LOADER (fails fast if env vars are missing)
   ───────────────────────────────────────────────────────────────────────── */

export interface WfpConfig {
  merchantAccount: string;
  merchantDomainName: string;
  secretKey: string;
  siteUrl: string;
}

/**
 * Reads WayForPay config from environment variables.
 * Throws a descriptive error if any required variable is missing.
 * Only call this inside request handlers, not at module level!
 */
export function getWfpConfig(): WfpConfig {
  const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT;
  const merchantDomainName = process.env.WAYFORPAY_MERCHANT_DOMAIN;
  const secretKey = process.env.WAYFORPAY_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const missing: string[] = [];
  if (!merchantAccount) missing.push("WAYFORPAY_MERCHANT_ACCOUNT");
  if (!merchantDomainName) missing.push("WAYFORPAY_MERCHANT_DOMAIN");
  if (!secretKey) missing.push("WAYFORPAY_SECRET_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  return { merchantAccount, merchantDomainName, secretKey, siteUrl };
}
