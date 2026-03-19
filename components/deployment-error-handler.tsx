'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function DeploymentErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message;
      const errorMessage = error?.toString() || '';

      const isChunkLoadError = 
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('dynamically imported module');

      if (isChunkLoadError) {
        console.warn('🔄 Виявлено помилку завантаження чанків після деплою. Оновлюємо сторінку...');
        
        event.preventDefault();
        
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        const reloadKey = 'deployment-reload-attempted';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload) > 5000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.href = currentPath;
        } else {
          console.error('❌ Повторна помилка після оновлення. Можливо, проблема з сервером.');
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';

      const isChunkLoadError = 
        reason.includes('ChunkLoadError') ||
        reason.includes('Loading chunk') ||
        reason.includes('Failed to fetch dynamically imported module') ||
        reason.includes('Importing a module script failed') ||
        reason.includes('dynamically imported module');

      if (isChunkLoadError) {
        console.warn('🔄 Виявлено помилку завантаження модулів після деплою. Оновлюємо сторінку...');
        
        event.preventDefault();
        
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        const reloadKey = 'deployment-reload-attempted';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload) > 5000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.href = currentPath;
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [router]);

  return null;
}
