import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A tiny 1×1 orange shimmer in base64 — used as blurDataURL for Next.js <Image>.
 * Gives a branded shimmer while the real image loads.
 */
export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/**
 * Returns Next.js Image blur props for external images (no static import required).
 */
export function blurProps() {
  return {
    placeholder: "blur" as const,
    blurDataURL: BLUR_DATA_URL,
  };
}


/**
 * Normalizes product image paths.
 * Fixes legacy records like /images/sneakers-hero (without extension).
 */
export function normalizeImageSrc(src?: string | null): string {
  if (!src) return "/images/sneakers-hero.jpg";

  // Keep external/data/blob URLs untouched.
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  // Add .jpg for local /images/* values that have no extension.
  if (src.startsWith("/images/") && !/\.[a-zA-Z0-9]+($|\?)/.test(src)) {
    return `${src}.jpg`;
  }

  return src;
}
