'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }
    
    // Отправка в API для мониторинга (опционально)
    if (process.env.NODE_ENV === 'production') {
      // Используем sendBeacon для надежной отправки
      const blob = new Blob(
        [JSON.stringify(metric)],
        { type: 'application/json' }
      );
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/vitals', blob);
      } else {
        // Fallback для старых браузеров
        fetch('/api/vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric),
          keepalive: true,
        }).catch(console.error);
      }
    }
  });

  return null;
}
