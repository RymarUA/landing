// @ts-nocheck
/**
 * lib/sms.ts
 *
 * SMS service for sending OTP codes to customers via TurboSMS.
 * Supports multiple providers (TurboSMS, Twilio, etc.)
 *
 * ENV VARS:
 *   SMS_PROVIDER=turbosms | twilio
 *   TURBOSMS_TOKEN - API token from TurboSMS
 *   TURBOSMS_SENDER - Sender name from TurboSMS cabinet
 *   TWILIO_ACCOUNT_SID - Twilio account SID
 *   TWILIO_AUTH_TOKEN - Twilio auth token
 *   TWILIO_PHONE_NUMBER - Twilio phone number
 */

const SEND_TIMEOUT_MS = 10000;

type SmsProvider = 'turbosms' | 'twilio';

interface SmsResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const provider = (process.env.SMS_PROVIDER as SmsProvider) || 'turbosms';

  switch (provider) {
    case 'turbosms':
      return sendTurboSms(phone, message);
    case 'twilio':
      return sendTwilioSms(phone, message);
    default:
      return { success: false, error: `Unsupported SMS provider: ${provider}` };
  }
}

/**
 * TurboSMS (Ukrainian provider)
 * https://turbosms.ua/api.html
 */
async function sendTurboSms(phone: string, message: string): Promise<SmsResult> {
  const token = process.env.TURBOSMS_TOKEN;
  const sender = process.env.TURBOSMS_SENDER;

  if (!token || !sender) {
    console.warn("[sms] TURBOSMS_TOKEN or TURBOSMS_SENDER not set");
    return { success: false, error: "SMS provider not configured" };
  }

  // Normalize phone for TurboSMS (remove +, keep only digits)
  const normalizedPhone = phone.replace(/\D/g, '');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.turbosms.ua/message/send.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        sms: {
          sender: sender,
          destination: normalizedPhone,
          text: message,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      console.error('[sms] TurboSMS API error', response.status, error);
      return { success: false, error: `SMS provider error: ${response.status}` };
    }

    const data = await response.json();
    
    if (data.response_code === '200' || data.response_code === 200) {
      return { 
        success: true, 
        messageId: data.result?.[0]?.message_id || 'unknown'
      };
    } else {
      console.error('[sms] TurboSMS error response', data);
      return { success: false, error: data.response_status || 'SMS send failed' };
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error('[sms] TurboSMS request failed', err);
    return { success: false, error: 'SMS service unavailable' };
  }
}

/**
 * Twilio (International provider)
 * https://www.twilio.com/docs/sms/api
 */
async function sendTwilioSms(phone: string, message: string): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[sms] Twilio credentials not set");
    return { success: false, error: "SMS provider not configured" };
  }

  // Normalize phone for Twilio (E.164 format)
  const normalizedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: normalizedPhone,
          From: fromNumber,
          Body: message,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      console.error('[sms] Twilio API error', response.status, error);
      return { success: false, error: `SMS provider error: ${response.status}` };
    }

    const data = await response.json();
    
    return { 
      success: true, 
      messageId: data.sid || 'unknown'
    };
  } catch (err) {
    clearTimeout(timeout);
    console.error('[sms] Twilio request failed', err);
    return { success: false, error: 'SMS service unavailable' };
  }
}

/**
 * Send OTP code via SMS
 */
export async function sendOtpSms(phone: string, otp: string): Promise<SmsResult> {
  const message = `FamilyHub Market: ваш код підтвердження ${otp}. Дійсний 5 хвилин.`;
  
  const result = await sendSms(phone, message);
  
  if (result.success) {
    console.log(`[sms] OTP sent to ${phone}, message ID: ${result.messageId}`);
  } else {
    console.error(`[sms] Failed to send OTP to ${phone}:`, result.error);
  }
  
  return result;
}
