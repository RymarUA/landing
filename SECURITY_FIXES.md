# Security Vulnerabilities Fixed

This document outlines the 5 critical security vulnerabilities that were identified and fixed in the application.

## Summary

All 5 critical security vulnerabilities have been resolved:

1. ✅ **Dev-login endpoint** - Now disabled in production
2. ✅ **Admin API routes** - Protected with JWT authentication
3. ✅ **Admin password exposure** - Moved from NEXT_PUBLIC_ to server-only JWT auth
4. ✅ **OTP brute-force** - Implemented attempt limiting
5. ✅ **Middleware optimization** - Removed duplicate cleanup logic

---

## 1. Dev-Login Endpoint Security

### Problem
`POST /api/auth/dev-login` was accessible in production, allowing anyone to create JWT tokens without OTP verification by simply sending any email address.

### Solution
Added `NODE_ENV` check to disable the endpoint in non-development environments:

```typescript
export async function POST(req: NextRequest) {
  // SECURITY: Only allow dev-login in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }
  // ... rest of handler
}
```

**File:** `app/api/auth/dev-login/route.ts`

---

## 2. Admin API Routes Authentication

### Problem
9 admin API routes had no authentication checks, allowing anonymous access to sensitive operations:
- `/api/admin/dashboard`
- `/api/admin/analytics`
- `/api/admin/customers`
- `/api/admin/settings`
- `/api/admin/export`
- `/api/admin/check-payment`
- `/api/admin/clean-cart`
- `/api/admin/force-clear-cart`
- `/api/admin/migrate-cart`

### Solution
Created a centralized admin authentication system using JWT tokens:

#### New Authentication Helper (`lib/admin-auth.ts`)
```typescript
export async function requireAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, admin: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const admin = await verifyAdminAuth(req);
  
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    );
  }

  return handler(req, admin);
}
```

#### Admin Whitelist
Admins are identified by email addresses in the `ADMIN_EMAILS` environment variable:
```bash
ADMIN_EMAILS=admin@example.com,manager@example.com
```

#### Protected Route Example
```typescript
export async function GET(req: NextRequest) {
  return requireAdminAuth(req, async (_req, admin) => {
    console.log(`[api/admin/dashboard] Request from admin: ${admin.email}`);
    // ... handler logic
  });
}
```

**Files Modified:**
- Created: `lib/admin-auth.ts`
- Updated: All 9 admin API routes

---

## 3. Admin Password Exposure

### Problem
`NEXT_PUBLIC_ADMIN_PASSWORD` was used for authentication, but `NEXT_PUBLIC_*` variables are embedded in the client-side JavaScript bundle, making the password publicly accessible in browser DevTools.

### Solution
Completely removed password-based authentication in favor of JWT-based admin authentication:

**Before (Insecure):**
```typescript
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
const authHeader = req.headers.get("Authorization");

if (!adminPassword || !authHeader || !authHeader.includes(`Bearer ${adminPassword}`)) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**After (Secure):**
```typescript
return requireAdminAuth(req, async (_req, admin) => {
  // Only authenticated admins with JWT tokens and whitelisted emails can access
});
```

**Environment Variable Changes:**
- ❌ Removed: `NEXT_PUBLIC_ADMIN_PASSWORD`
- ✅ Added: `ADMIN_EMAILS` (server-only, comma-separated list)

---

## 4. OTP Brute-Force Protection

### Problem
The OTP verification endpoint had no attempt limiting. An attacker could try all 900,000 possible 6-digit codes without being blocked.

### Solution
Implemented attempt counter with automatic blocking:

```typescript
// Maximum OTP verification attempts before blocking
const MAX_OTP_ATTEMPTS = 5;

// Check if too many attempts
if (entry.attempts >= MAX_OTP_ATTEMPTS) {
  await deleteOtp(identifier);
  return NextResponse.json(
    { error: "Занадто багато невірних спроб. Запросіть новий код" },
    { status: 429 }
  );
}

if (entry.code !== otp) {
  // Increment attempt counter on failed verification
  const updatedEntry = await incrementOtpAttempts(identifier);
  
  const remainingAttempts = updatedEntry 
    ? MAX_OTP_ATTEMPTS - updatedEntry.attempts 
    : 0;
  
  if (remainingAttempts <= 0) {
    await deleteOtp(identifier);
    return NextResponse.json(
      { error: "Занадто багато невірних спроб. Запросіть новий код" },
      { status: 429 }
    );
  }
  
  return NextResponse.json(
    { 
      error: "Невірний код",
      remainingAttempts 
    },
    { status: 400 }
  );
}
```

**Features:**
- Maximum 5 attempts per OTP code
- Automatic deletion of OTP after max attempts
- Returns remaining attempts to user
- Uses existing `incrementOtpAttempts()` function from `lib/otp-store.ts`

**File:** `app/api/auth/verify-otp/route.ts`

---

## 5. Middleware Rate Limit Optimization

### Problem
The middleware had duplicate cleanup logic:
1. Periodic cleanup via `setInterval` (every 60 seconds)
2. Inline cleanup on **every request**

The inline cleanup created unnecessary overhead, especially with many rate limit entries.

### Solution
Removed the duplicate inline cleanup loop, keeping only the efficient periodic cleanup:

**Before (Inefficient):**
```typescript
const key = `${ip}:${request.nextUrl.pathname}`;

// Runs on EVERY request - unnecessary overhead
for (const [k, v] of rateLimitMap.entries()) {
  if (v.resetTime < now) {
    rateLimitMap.delete(k);
  }
}

const limit = rateLimitMap.get(key);
```

**After (Optimized):**
```typescript
const key = `${ip}:${request.nextUrl.pathname}`;

const limit = rateLimitMap.get(key);
```

The periodic cleanup (running every 60 seconds) is sufficient for maintaining the rate limit map.

**File:** `middleware.ts`

---

## Configuration Required

### Environment Variables

Add to your `.env.local`:

```bash
# Admin Panel Authentication
# Comma-separated list of admin email addresses
ADMIN_EMAILS=admin@example.com,manager@example.com

# JWT Secret (if not already set)
JWT_SECRET=your-secret-key-here
```

### Admin Access Flow

1. User logs in via OTP (email or phone)
2. JWT token is issued with email claim
3. User navigates to `/admin` routes
4. `requireAdminAuth` middleware checks:
   - JWT token exists and is valid
   - Email from JWT is in `ADMIN_EMAILS` whitelist
5. Access granted or 401 Unauthorized returned

---

## Testing Recommendations

### 1. Test Dev-Login Protection
```bash
# Should fail in production
curl -X POST https://your-domain.com/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected: 403 Forbidden
```

### 2. Test Admin Route Protection
```bash
# Without authentication - should fail
curl https://your-domain.com/api/admin/dashboard

# Expected: 401 Unauthorized
```

### 3. Test OTP Brute-Force Protection
```bash
# Try 6 wrong OTP codes in a row
for i in {1..6}; do
  curl -X POST https://your-domain.com/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","otp":"000000"}'
done

# Expected: After 5 attempts, 429 Too Many Requests
```

### 4. Test Admin Access
```bash
# 1. Login with admin email via OTP
# 2. Use the JWT cookie to access admin routes
curl https://your-domain.com/api/admin/dashboard \
  -H "Cookie: fhm_auth=your-jwt-token"

# Expected: 200 OK with dashboard data
```

---

## Security Best Practices Implemented

1. ✅ **Principle of Least Privilege** - Only whitelisted emails can access admin routes
2. ✅ **Defense in Depth** - Multiple layers: JWT validation + email whitelist
3. ✅ **Rate Limiting** - OTP attempts limited to prevent brute-force
4. ✅ **Secure Secrets** - No secrets in client-side code
5. ✅ **Environment-Specific Controls** - Dev endpoints disabled in production
6. ✅ **Audit Logging** - All admin actions log the admin's email

---

## Migration Notes

### Removing Old Admin Password

If you had `NEXT_PUBLIC_ADMIN_PASSWORD` in your environment:

1. Remove it from `.env.local`
2. Remove it from Vercel/hosting environment variables
3. Add `ADMIN_EMAILS` instead
4. Redeploy the application

### Granting Admin Access

To grant admin access to a user:

1. Add their email to `ADMIN_EMAILS` environment variable
2. Ensure they can log in via OTP with that email
3. Redeploy (or restart) the application
4. User can now access `/admin` routes after logging in

---

## Additional Security Recommendations

### Future Enhancements

1. **Admin Activity Logging** - Log all admin actions to a database
2. **Two-Factor Authentication** - Require additional verification for admin access
3. **Session Management** - Implement session revocation and timeout
4. **IP Whitelisting** - Restrict admin access to specific IP ranges
5. **Audit Trail** - Track all data modifications with timestamps and user info

### Monitoring

Monitor these metrics:
- Failed OTP attempts (potential brute-force attacks)
- Unauthorized admin access attempts (401 responses)
- Rate limit violations (429 responses)
- Dev-login attempts in production (403 responses)

---

## Support

For security concerns or questions, contact the development team.

**Last Updated:** 2026-03-23
