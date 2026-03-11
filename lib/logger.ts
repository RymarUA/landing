// @ts-nocheck
/**
 * Safe logger that only logs in development
 * Prevents console spam in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) console.log(...args);
  },
  info: (...args: any[]) => {
    if (isDevelopment) console.info(...args);
  },
  warn: (...args: any[]) => {
    if (isDevelopment) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Always log errors, but with less noise in production
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, only log essential errors
      const message = args[0];
      if (typeof message === 'string' && (
        message.includes('Missing required environment variables') ||
        message.includes('Database connection') ||
        message.includes('Authentication failed')
      )) {
        console.error('[PROD ERROR]', ...args);
      }
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) console.debug(...args);
  },
};

// Export individual methods for convenience
export const { log, info, warn, error, debug } = logger;

