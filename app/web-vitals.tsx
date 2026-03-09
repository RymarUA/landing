'use client';

import { useReportWebVitals } from 'next/web-vitals';
import type { Metric } from 'web-vitals';

export function WebVitals() {
  useReportWebVitals((metric: Metric) => {
    // Отправка в Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value
        ),
        event_label: metric.id,
        non_interaction: true,
      });
    }
    
    // Логирование в development
    const nodeEnv = (typeof globalThis !== 'undefined' ? (globalThis as any).process?.env?.NODE_ENV : undefined) as string | undefined;
    const isDev = nodeEnv === 'development';
    if (isDev) {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }
    
    // Отправка в API для мониторинга (опционально)
    const isProd = nodeEnv === 'production';
    if (isProd) {
      const data = JSON.stringify(metric);

      if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          '/api/vitals',
          new Blob([data], { type: 'application/json' }),
        );

        if (!success) {
          console.warn('[Web Vitals] sendBeacon failed, using fetch');
          fetch('/api/vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true,
          }).catch(console.error);
        }
      } else {
        // Fallback для старых браузеров
        fetch('/api/vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(console.error);
      }
    }
  });

  return null;
}
