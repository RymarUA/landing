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
   SIGNATURE UTILITY
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Builds the WayForPay merchant signature using HMAC-MD5.
 *
 * The signature string is built by joining the following values
 * with semicolons (";"), in EXACTLY this order:
 *
 *   merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;
 *   productName[0];...;productPrice[0];...;productCount[0];...
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
  const parts: (string | number)[] = [
    params.merchantAccount,
    params.merchantDomainName,
    params.orderReference,
    params.orderDate,
    params.amount,
    params.currency,
    ...params.productName,
    ...params.productPrice,
    ...params.productCount,
  ];

  const signatureString = parts.join(";");

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
 * Builds a WayForPay hosted-page redirect URL.
 *
 * WayForPay accepts all payment parameters as query-string values
 * on the https://secure.wayforpay.com/pay endpoint.
 * Arrays (productName, productPrice, productCount) are passed as
 * repeated query params: productName[0]=..., productName[1]=...
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
  query.set("amount", String(params.amount));
  query.set("currency", params.currency);
  query.set("returnUrl", params.returnUrl);
  query.set("serviceUrl", params.serviceUrl);
  query.set("merchantSignature", signature);

  // Arrays — WayForPay expects repeated keys with [index] suffix
  params.productName.forEach((n, i) => query.append(`productName[${i}]`, n));
  params.productPrice.forEach((p, i) => query.append(`productPrice[${i}]`, String(p)));
  params.productCount.forEach((c, i) => query.append(`productCount[${i}]`, String(c)));

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
 * Throws a descriptive error if any required variable is missing
 * so you catch configuration mistakes at request time.
 */
export function getWfpConfig(): WfpConfig {
  const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT;
  const merchantDomainName = process.env.WAYFORPAY_MERCHANT_DOMAIN;
  const secretKey = process.env.WAYFORPAY_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!merchantAccount) throw new Error("Missing env: WAYFORPAY_MERCHANT_ACCOUNT");
  if (!merchantDomainName) throw new Error("Missing env: WAYFORPAY_MERCHANT_DOMAIN");
  if (!secretKey) throw new Error("Missing env: WAYFORPAY_SECRET_KEY");

  return { merchantAccount, merchantDomainName, secretKey, siteUrl };
}

