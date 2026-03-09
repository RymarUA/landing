/**
 * useIsomorphic - provides safe access to browser APIs
 * Prevents SSR mismatches and hydration errors
 */

import { useEffect, useState } from 'react';

export function useIsomorphic<T>(value: T) {
  const [state, setState] = useState<T>(value);

  useEffect(() => {
    setState(value);
  }, [value]);

  return state;
}

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
