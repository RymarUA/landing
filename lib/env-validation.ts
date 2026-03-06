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
  // Payment
  { key: 'WAYFORPAY_MERCHANT_ACCOUNT', required: true, description: 'WayForPay merchant account' },
  { key: 'WAYFORPAY_MERCHANT_DOMAIN', required: true, description: 'WayForPay merchant domain' },
  { key: 'WAYFORPAY_SECRET_KEY', required: true, description: 'WayForPay secret key' },
  
  // CRM
  { key: 'SITNIKS_API_URL', required: false, description: 'Sitniks CRM API URL' },
  { key: 'SITNIKS_API_KEY', required: false, description: 'Sitniks CRM API key' },
  
  // Notifications
  { key: 'TELEGRAM_BOT_TOKEN', required: true, description: 'Telegram bot token' },
  { key: 'TELEGRAM_CHAT_ID', required: true, description: 'Telegram chat ID' },
  
  // Email
  { key: 'RESEND_API_KEY', required: true, description: 'Resend API key' },
  { key: 'EMAIL_FROM', required: true, description: 'Email sender address' },
  { key: 'EMAIL_ADMIN', required: true, description: 'Admin email address' },
  
  // Instagram (optional)
  { key: 'INSTAGRAM_ACCESS_TOKEN', required: false, description: 'Instagram access token' },
  { key: 'INSTAGRAM_USER_ID', required: false, description: 'Instagram user ID' },
  
  // Security
  { key: 'JWT_SECRET', required: true, description: 'JWT signing secret' },
  { key: 'ADMIN_SECRET', required: true, description: 'Admin API secret' },
  
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
    console.error('\n❌ CRITICAL: Missing required environment variables:\n');
    missing.forEach(item => console.error(`  - ${item}`));
    console.error('\n⚠️  Please check your .env.local file');
    console.error('📄 Example: .env.local.example\n');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables');
    }
  }
  
  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('\n⚠️  Optional environment variables not set:\n');
    warnings.forEach(item => console.warn(`  - ${item}`));
    console.warn('\n💡 Some features may not work correctly\n');
  }
  
  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables are configured\n');
  } else if (missing.length === 0) {
    console.log('✅ All required environment variables are set\n');
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
