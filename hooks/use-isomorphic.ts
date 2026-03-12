// @ts-nocheck
/**
 * hooks/use-isomorphic.ts
 * 
 * SSR-safe hooks for browser APIs and localStorage.
 * Prevents hydration mismatches in Next.js.
 */

import { useEffect, useState } from 'react';

/**
 * useIsomorphic - Safely syncs a value after hydration
 * Prevents SSR mismatches by deferring state updates to client-side
 * 
 * @param value - Initial value to sync
 * @returns Synced state value
 */
export function useIsomorphic<T>(value: T) {
  const [state, setState] = useState<T>(value);

  useEffect(() => {
    setState(value);
  }, [value]);

  return state;
}

/**
 * useLocalStorage - Persistent state in localStorage with SSR safety
 * 
 * @param key - localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [state, setValue] tuple
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * setTheme('dark'); // Persists to localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setState(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setState(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [state, setValue] as const;
}

/**
 * useWindow - Safe access to window and document objects
 * Returns null during SSR, actual objects after hydration
 * 
 * @returns Object with isClient flag, window, and document
 * 
 * @example
 * const { isClient, window, document } = useWindow();
 * if (isClient) {
 *   window.scrollTo(0, 0);
 * }
 */
export function useWindow() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return {
    isClient,
    window: isClient ? window : null,
    document: isClient ? document : null,
  };
}

