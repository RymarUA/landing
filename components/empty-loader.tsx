/**
 * Empty loader for Vercel builds
 * This file replaces tailwind-cdn-loader.tsx via webpack alias
 * to completely remove CDN loading code from production bundles
 */

export function TailwindCDNLoader() {
  return null;
}
