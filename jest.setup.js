// jest.setup.js
// Global test setup and configuration

// Set test environment variables
process.env.WAYFORPAY_MERCHANT_ACCOUNT = 'test_merchant';
process.env.WAYFORPAY_MERCHANT_DOMAIN = 'test.example.com';
process.env.WAYFORPAY_SECRET_KEY = 'test_secret_key';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
