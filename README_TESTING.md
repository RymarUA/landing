# Testing Guide

This document describes how to run tests for the FamilyHub Market application.

## Test Structure

```
landing/
├── lib/__tests__/          # Unit tests for library functions
│   └── wayforpay.test.ts   # WayForPay signature & verification tests
├── scripts/
│   ├── test-checkout-integration.sh   # Bash integration tests
│   └── test-checkout-integration.ps1  # PowerShell integration tests
├── jest.config.js          # Jest configuration
├── jest.setup.js           # Jest global setup
└── .env.test               # Test environment variables
```

## Prerequisites

Install testing dependencies:

```bash
npm install --save-dev jest ts-jest @types/jest @jest/globals
```

## Unit Tests

### Running Unit Tests

Run all unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Run specific test file:
```bash
npm test wayforpay.test.ts
```

### WayForPay Unit Tests

Location: `lib/__tests__/wayforpay.test.ts`

**Tests included:**
- ✅ Signature generation for payment params
- ✅ Different signatures for different params
- ✅ Same signature for identical params
- ✅ Multiple products handling
- ✅ Response signature generation
- ✅ Valid webhook verification
- ✅ Invalid webhook rejection (tampered signature)
- ✅ Invalid webhook rejection (tampered amount)
- ✅ Invalid webhook rejection (wrong secret key)
- ✅ Payment URL building with all parameters
- ✅ Signature inclusion in payment URL
- ✅ Multiple products in URL

**Example test:**
```typescript
it('generates correct signature', () => {
  const signature = buildWfpSignature(mockParams, secretKey);
  expect(signature).toBeDefined();
  expect(signature).toMatch(/^[a-f0-9]{32}$/);
});
```

## Integration Tests

Integration tests verify the `/api/checkout` endpoint with real HTTP requests.

### Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Ensure the server is running on `http://localhost:3000` (or set `API_URL` environment variable)

### Running Integration Tests (Bash)

For Linux/Mac or Windows with Git Bash:

```bash
# Make script executable
chmod +x scripts/test-checkout-integration.sh

# Run tests
./scripts/test-checkout-integration.sh

# Run against different URL
API_URL=https://your-domain.com ./scripts/test-checkout-integration.sh
```

### Running Integration Tests (PowerShell)

For Windows:

```powershell
# Run tests
.\scripts\test-checkout-integration.ps1

# Run against different URL
.\scripts\test-checkout-integration.ps1 -ApiUrl "https://your-domain.com"
```

### Integration Test Cases

**Valid Orders:**
1. ✅ COD (Cash on Delivery) order
2. ✅ Card payment order (with WayForPay URL)
3. ✅ Online payment order (with WayForPay URL)
4. ✅ Order with discount amount
5. ✅ Order with multiple items

**Invalid Orders:**
6. ✅ Missing required field (name)
7. ✅ Missing required field (phone)
8. ✅ Empty items array
9. ✅ Name too short (< 3 chars)
10. ✅ Phone too short (< 10 chars)

**Expected Response Format:**

Success (200):
```json
{
  "success": true,
  "orderId": 123,
  "orderNumber": 456,
  "paymentUrl": "https://secure.wayforpay.com/pay?..." // for card/online
}
```

Error (400):
```json
{
  "error": "Невірний формат замовлення"
}
```

## Test Configuration

### Environment Variables

Test environment variables are set in:
- `jest.setup.js` - for unit tests
- `.env.test` - for integration tests

**Required variables:**
```env
WAYFORPAY_MERCHANT_ACCOUNT=test_merchant
WAYFORPAY_MERCHANT_DOMAIN=test.example.com
WAYFORPAY_SECRET_KEY=test_secret_key_12345
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Jest Configuration

`jest.config.js` includes:
- TypeScript support via `ts-jest`
- Path mapping for `@/` imports
- Coverage collection from `lib/` and `app/`
- Test file pattern: `**/__tests__/**/*.test.ts`

## Adding New Tests

### Adding Unit Tests

1. Create test file in `lib/__tests__/` or `app/__tests__/`:
   ```typescript
   import { describe, it, expect } from '@jest/globals';
   import { yourFunction } from '../your-module';
   
   describe('YourModule', () => {
     it('should do something', () => {
       const result = yourFunction();
       expect(result).toBe(expected);
     });
   });
   ```

2. Run tests:
   ```bash
   npm test
   ```

### Adding Integration Tests

Edit `scripts/test-checkout-integration.sh` or `.ps1`:

```bash
run_test "Your test name" '{
  "name": "Test User",
  "phone": "0671234567",
  ...
}' 200 false
```

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: npm test -- --coverage

- name: Start dev server
  run: npm run dev &
  
- name: Wait for server
  run: sleep 5

- name: Run integration tests
  run: ./scripts/test-checkout-integration.sh
```

## Troubleshooting

**Jest not found:**
```bash
npm install --save-dev jest ts-jest @types/jest @jest/globals
```

**TypeScript errors:**
```bash
npm install --save-dev @types/node
```

**Integration tests fail:**
- Ensure dev server is running: `npm run dev`
- Check API_URL is correct
- Verify environment variables are set
- Check network connectivity

**WayForPay tests fail:**
- Verify secret key is set in test environment
- Check signature algorithm (HMAC-MD5)
- Ensure params are in correct order

## Coverage Reports

Generate coverage report:
```bash
npm test -- --coverage
```

View HTML report:
```bash
open coverage/lcov-report/index.html
```

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Mock external services** - Don't call real APIs in unit tests
3. **Use descriptive names** - Test names should explain what they verify
4. **Test edge cases** - Include invalid inputs, empty arrays, etc.
5. **Keep tests fast** - Unit tests should run in milliseconds
6. **Update tests with code** - When changing code, update tests too

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [WayForPay API Docs](https://wiki.wayforpay.com/en/view/852115)
- [Testing Best Practices](https://testingjavascript.com/)
