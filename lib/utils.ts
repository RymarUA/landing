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

