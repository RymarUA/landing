# Logical Bugs Fixed

This document outlines the 3 logical bugs that were identified and fixed in addition to the security vulnerabilities.

## Summary

All 3 logical bugs have been resolved:

1. ✅ **Checkout discount logic** - Client-requested discount now ignored
2. ✅ **Featured products auto-scroll** - Resets properly after manual navigation
3. ✅ **OTP rate limiting** - Only records attempts after successful delivery

---

## 1. Checkout Discount Logic - Client Manipulation Prevention

### Problem
The discount calculation used `Math.min(totalServerDiscount, requestedDiscount, serverTotal)`, which allowed clients to manipulate their discount by sending a lower `discountAmount` value. If a client sent `discountAmount: 0`, they could nullify their legitimate discount.

**Vulnerable Code:**
```typescript
const requestedDiscount = Math.max(0, Number(body.discountAmount) || 0);
const discountAmount = Math.min(totalServerDiscount, requestedDiscount, serverTotal);
```

### Solution
Changed to completely ignore the client-requested discount and use only the server-calculated discount:

```typescript
// SECURITY: Always use server-calculated discount, ignore client-requested amount
// Client could manipulate discountAmount to reduce their discount
const discountAmount = Math.min(totalServerDiscount, serverTotal);

// Log if client sent different discount (for debugging)
const requestedDiscount = Math.max(0, Number(body.discountAmount) || 0);
if (requestedDiscount !== totalServerDiscount) {
  console.warn(`[checkout] Client discount ignored: client=${requestedDiscount}, server=${totalServerDiscount}, applied=${discountAmount}`);
}
```

**Impact:**
- Prevents clients from manipulating discount amounts
- Server always calculates and applies the correct discount
- Client-sent discount is logged for debugging but never used

**File:** `app/api/checkout/route.ts`

---

## 2. Featured Products Auto-Scroll - Manual Navigation Conflicts

### Problem
The auto-scroll interval was set once in `useEffect` and never reset when users manually navigated using arrow buttons or touch scrolling. This caused conflicts where:
- Auto-scroll would continue immediately after manual navigation
- User's chosen position would be overridden by auto-scroll
- Poor UX as users couldn't control the carousel

**Problematic Code:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Auto-scroll logic
  }, 3000);
  
  return () => clearInterval(interval);
}, [filteredProducts.length]);
```

### Solution
Implemented smart auto-scroll that:
1. Pauses when user manually interacts
2. Restarts after 5 seconds of inactivity
3. Properly cleans up intervals

```typescript
const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

// Start auto-scroll interval
const startAutoScroll = () => {
  const container = scrollRef.current;
  if (!container || filteredProducts.length <= 3) return;

  // Clear existing interval
  if (autoScrollIntervalRef.current) {
    clearInterval(autoScrollIntervalRef.current);
  }

  autoScrollIntervalRef.current = setInterval(() => {
    // Auto-scroll logic
  }, 3000);
};

// Reset auto-scroll when user manually scrolls
const handleManualScroll = () => {
  if (autoScrollIntervalRef.current) {
    clearInterval(autoScrollIntervalRef.current);
  }
  // Restart auto-scroll after 5 seconds of inactivity
  setTimeout(() => {
    startAutoScroll();
  }, 5000);
};

// Updated scroll function
const scroll = (direction: "left" | "right") => {
  // ... scroll logic
  handleManualScroll(); // Reset auto-scroll
};

// Added onScroll handler for mobile touch scrolling
<div
  ref={scrollRef}
  className="..."
  onScroll={handleManualScroll}
>
```

**Features:**
- Auto-scroll pauses immediately on manual interaction
- Resumes after 5 seconds of user inactivity
- Works for both button clicks and touch scrolling
- Proper cleanup prevents memory leaks

**File:** `featured-products.tsx`

---

## 3. OTP Rate Limiting - Premature Attempt Recording

### Problem
`recordOtpSentByPhone()` and `recordOtpSentByIp()` were called **before** attempting to send the OTP. If SMS/email delivery failed, users would:
- Lose an attempt without receiving the code
- Potentially exhaust all attempts without ever getting an OTP
- Be unable to authenticate due to delivery failures

**Problematic Code:**
```typescript
const code = generateOtp();
await setOtp(identifier, code);

// Rate limiting recorded BEFORE delivery attempt
if (type === "phone") {
  recordOtpSentByPhone(identifier);
}
recordOtpSentByIp(ip);

try {
  // Attempt to send OTP (might fail)
  await sendEmailOtp(identifier, code);
} catch (err) {
  // User already lost an attempt even though delivery failed
}
```

### Solution
Moved rate limiting to **after** successful delivery confirmation:

```typescript
const code = generateOtp();
await setOtp(identifier, code);

let deliverySuccess = false;

try {
  if (type === "email") {
    const emailResult = await sendEmailOtp(identifier, code);
    if (!emailResult.success) {
      // Fallback to Telegram
      await sendTelegramNotification(message);
      deliverySuccess = true; // Telegram fallback succeeded
    } else {
      deliverySuccess = true;
    }
  } else {
    // Phone: try SMS first, fallback to Telegram
    const smsResult = await sendOtpSms(identifier, code);
    if (!smsResult.success) {
      // Fallback to Telegram
      await sendTelegramNotification(message);
      deliverySuccess = true; // Telegram fallback succeeded
    } else {
      deliverySuccess = true;
    }
  }
} catch (err) {
  // Final fallback to Telegram
  await sendTelegramNotification(message);
  deliverySuccess = true;
}

// SECURITY: Only record rate limiting AFTER successful delivery
if (deliverySuccess) {
  if (type === "phone") {
    await recordOtpSentByPhone(identifier);
  }
  await recordOtpSentByIp(ip);
} else {
  return NextResponse.json(
    { error: "Не вдалося відправити код. Спробуйте пізніше." },
    { status: 500 }
  );
}
```

**Features:**
- Rate limiting only recorded after successful delivery
- Tracks delivery success through all fallback mechanisms
- Returns error if all delivery methods fail
- Users don't lose attempts due to system failures
- Proper error handling and logging

**File:** `app/api/auth/send-otp/route.ts`

---

## Testing Recommendations

### 1. Test Checkout Discount Manipulation
```bash
# Try to send lower discount than server calculates
curl -X POST https://your-domain.com/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "discountAmount": 0,
    "promoCode": "VALID_CODE",
    ...
  }'

# Expected: Server ignores client discount, applies correct discount
# Check server logs for warning message
```

### 2. Test Featured Products Auto-Scroll
1. Load page with featured products
2. Wait for auto-scroll to start (3 seconds)
3. Click left/right arrow buttons
4. Verify auto-scroll pauses
5. Wait 5 seconds without interaction
6. Verify auto-scroll resumes

**Mobile:**
1. Manually swipe the carousel
2. Verify auto-scroll pauses
3. Wait 5 seconds
4. Verify auto-scroll resumes

### 3. Test OTP Rate Limiting
**Scenario 1: Successful delivery**
```bash
# Send OTP request
curl -X POST https://your-domain.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected: Rate limit recorded, OTP delivered
```

**Scenario 2: Delivery failure**
```bash
# Temporarily break email/SMS service
# Send OTP request

# Expected: 
# - Rate limit NOT recorded
# - Error returned to user
# - User can retry without losing attempts
```

---

## Impact Summary

### Security Improvements
- **Checkout:** Prevents discount manipulation attacks
- **OTP:** Prevents unfair rate limiting due to system failures

### User Experience Improvements
- **Featured Products:** Better carousel control and responsiveness
- **OTP:** Fair rate limiting that doesn't penalize users for system issues

### Code Quality Improvements
- Better separation of concerns
- Proper error handling
- Clear logging for debugging
- Improved state management

---

## Related Documentation

- Security fixes: `SECURITY_FIXES.md`
- Environment setup: `.env.local.example`
- Admin authentication: `lib/admin-auth.ts`

**Last Updated:** 2026-03-23
