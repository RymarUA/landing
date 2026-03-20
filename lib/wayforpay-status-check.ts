/**
 * lib/wayforpay-status-check.ts
 * 
 * Alternative way to check payment status when webhooks don't work
 * This can be used as a fallback mechanism
 */

import { createHmac } from "crypto";
import { getWfpConfig } from "./wayforpay";

interface WfpStatusResponse {
  reasonCode: number;
  reason: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  orderReference: string;
  merchantSignature: string;
}

/**
 * Check payment status directly from WayForPay
 * This can be used as a fallback when webhooks don't work properly
 */
export async function checkWayForPayStatus(
  orderReference: string
): Promise<WfpStatusResponse | null> {
  try {
    const config = getWfpConfig();
    
    // Build signature for CHECK_STATUS: merchantAccount;orderReference
    const signatureString = `${config.merchantAccount};${orderReference}`;
    const merchantSignature = createHmac("md5", config.secretKey)
      .update(signatureString, "utf8")
      .digest("hex");
    
    // WayForPay API endpoint for status check
    const apiUrl = "https://api.wayforpay.com/api";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionType: "CHECK_STATUS",
        merchantAccount: config.merchantAccount,
        orderReference,
        merchantSignature,
        apiVersion: 1
      }),
    });
    
    if (!response.ok) {
      console.error(`[WFP Status Check] HTTP ${response.status}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log("[WFP Status Check] Response:", JSON.stringify(data, null, 2));
    
    // Verify response signature
    if (data.merchantSignature) {
      const expectedSignature = createHmac("md5", config.secretKey)
        .update(`${orderReference};${data.transactionStatus};${data.reasonCode}`, "utf8")
        .digest("hex");
      
      if (data.merchantSignature.toLowerCase() !== expectedSignature.toLowerCase()) {
        console.error("[WFP Status Check] Invalid response signature");
        return null;
      }
    }
    
    return data;
  } catch (error) {
    console.error("[WFP Status Check] Error:", error);
    return null;
  }
}

/**
 * Manual endpoint to trigger status check for an order
 * This can be called manually to update order status
 */
export async function updateOrderStatusManually(orderReference: string): Promise<boolean> {
  console.log(`[Manual Status Update] Checking status for order ${orderReference}`);
  
  const statusInfo = await checkWayForPayStatus(orderReference);
  if (!statusInfo) {
    console.error(`[Manual Status Update] Failed to get status for order ${orderReference}`);
    return false;
  }
  
  console.log(`[Manual Status Update] Order ${orderReference} status: ${statusInfo.transactionStatus}`);
  
  // Update Sitniks based on status
  const { updateSitniksOrder } = await import("./sitniks-consolidated");
  
  if (statusInfo.transactionStatus === "Approved") {
    const success = await updateSitniksOrder(orderReference, "paid");
    if (success) {
      console.log(`[Manual Status Update] Successfully updated order ${orderReference} to paid`);
      return true;
    } else {
      console.error(`[Manual Status Update] Failed to update Sitniks order ${orderReference}`);
      return false;
    }
  } else if (statusInfo.transactionStatus === "Declined" || statusInfo.transactionStatus === "Expired") {
    const success = await updateSitniksOrder(orderReference, "cancelled");
    if (success) {
      console.log(`[Manual Status Update] Successfully updated order ${orderReference} to cancelled`);
      return true;
    } else {
      console.error(`[Manual Status Update] Failed to update Sitniks order ${orderReference}`);
      return false;
    }
  } else {
    console.log(`[Manual Status Update] Order ${orderReference} status ${statusInfo.transactionStatus} doesn't require action`);
    return true;
  }
}
