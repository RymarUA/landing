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
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log all errors but with structured format
      const message = args[0];
      const errorInfo = {
        timestamp: new Date().toISOString(),
        message: typeof message === 'string' ? message : String(message),
        args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)),
        stack: new Error().stack
      };
      
      // Log critical errors immediately
      if (typeof message === 'string' && (
        message.includes('Missing required environment variables') ||
        message.includes('Database connection') ||
        message.includes('Authentication failed') ||
        message.includes('JWT_SECRET') ||
        message.includes('API') ||
        message.includes('timeout') ||
        message.includes('Unauthorized')
      )) {
        console.error('[PROD CRITICAL]', JSON.stringify(errorInfo, null, 2));
      } else {
        // Log all other errors with standard format
        console.error('[PROD ERROR]', JSON.stringify(errorInfo, null, 2));
      }
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) console.debug(...args);
  },
};

// Export individual methods for convenience
export const { log, info, warn, error, debug } = logger;

