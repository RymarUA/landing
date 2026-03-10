import { logger } from './logger';

/**
 * ENV Variables Validation
 * Checks if all required environment variables are set
 */

type EnvVar = {
  key: string;
  required: boolean;
  description: string;
};

const ENV_VARS: EnvVar[] = [
  // Payment - optional for basic functionality
  { key: 'WAYFORPAY_MERCHANT_ACCOUNT', required: false, description: 'WayForPay merchant account' },
  { key: 'WAYFORPAY_MERCHANT_DOMAIN', required: false, description: 'WayForPay merchant domain' },
  { key: 'WAYFORPAY_SECRET_KEY', required: false, description: 'WayForPay secret key' },
  
  // CRM - optional for basic functionality
  { key: 'SITNIKS_API_URL', required: false, description: 'Sitniks CRM API URL' },
  { key: 'SITNIKS_API_KEY', required: false, description: 'Sitniks CRM API key' },
  
  // Notifications - optional for basic functionality
  { key: 'TELEGRAM_BOT_TOKEN', required: false, description: 'Telegram bot token' },
  { key: 'TELEGRAM_CHAT_ID', required: false, description: 'Telegram chat ID' },
  
  // Email - optional for basic functionality
  { key: 'RESEND_API_KEY', required: false, description: 'Resend API key' },
  { key: 'EMAIL_FROM', required: false, description: 'Email sender address' },
  { key: 'EMAIL_ADMIN', required: false, description: 'Admin email address' },
  
  // Instagram (optional)
  { key: 'INSTAGRAM_ACCESS_TOKEN', required: false, description: 'Instagram access token' },
  { key: 'INSTAGRAM_USER_ID', required: false, description: 'Instagram user ID' },
  
  // Security - make optional for development
  { key: 'JWT_SECRET', required: false, description: 'JWT signing secret' },
  { key: 'ADMIN_SECRET', required: false, description: 'Admin API secret' },
  
  // Analytics (optional)
  { key: 'NEXT_PUBLIC_META_PIXEL_ID', required: false, description: 'Meta Pixel ID' },
  { key: 'NEXT_PUBLIC_GA4_ID', required: false, description: 'Google Analytics 4 ID' },
];

export function validateEnv() {
  // Skip validation in build time to prevent errors
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('⏭️  Skipping ENV validation during build');
    return;
  }

  const missing: string[] = [];
  const warnings: string[] = [];
  
  ENV_VARS.forEach(({ key, required, description }) => {
    const value = process.env[key];
    
    if (!value) {
      if (required) {
        missing.push(`${key} (${description})`);
      } else {
        warnings.push(`${key} (${description})`);
      }
    }
  });
  
  if (missing.length > 0) {
    logger.error('\n❌ CRITICAL: Missing required environment variables:\n');
    missing.forEach(item => logger.error(`  - ${item}`));
    logger.error('\n⚠️  Please check your .env.local file');
    logger.error('📄 Example: .env.local.example\n');

    // Don't throw error in production if all required vars are actually optional
    // Only throw if there are truly required vars missing
    if (process.env.NODE_ENV === 'production') {
      logger.error('🔄 Continuing with optional configuration...');
      return; // Don't throw, just continue
    }
  }
  
  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    logger.warn('\n⚠️  Optional environment variables not set:\n');
    warnings.forEach(item => logger.warn(`  - ${item}`));
    logger.warn('\n💡 Some features may not work correctly\n');
  }
  
  if (missing.length === 0 && warnings.length === 0) {
    logger.log('✅ All environment variables are configured\n');
  } else if (missing.length === 0) {
    logger.log('✅ All required environment variables are set\n');
  }
}

/**
 * Check if a specific feature is enabled based on ENV vars
 */
export const isFeatureEnabled = {
  instagram: () => !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID),
  sitniks: () => !!(process.env.SITNIKS_API_URL && process.env.SITNIKS_API_KEY),
  analytics: () => !!(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.NEXT_PUBLIC_GA4_ID),
  email: () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  telegram: () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
};

/**
 * Get safe ENV variable (with fallback for optional vars)
 */
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && fallback !== undefined) {
    return fallback;
  }
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

