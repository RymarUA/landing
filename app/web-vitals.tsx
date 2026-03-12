"use client";

import { useReportWebVitals } from "next/web-vitals";
import type { Metric } from "web-vitals";
import { isDevelopmentEnv, isProductionEnv } from "@/lib/runtime-env";

export function WebVitals() {
  useReportWebVitals((metric: Metric) => {
    // Отправка в Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", metric.name, {
        value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value,
        ),
        event_label: metric.id,
        non_interaction: true,
      });
    }
    
    // Логирование в development
    if (isDevelopmentEnv()) {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }
    
    // Отправка в API для мониторинга (опционально)
    if (isProductionEnv()) {
      const data = JSON.stringify(metric);
      
      const sendViaFetch = () => {
        fetch("/api/vitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
          keepalive: true,
        }).catch(console.error);
      };

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          "/api/vitals",
          new Blob([data], { type: "application/json" }),
        );

        if (!success) {
          console.warn("[Web Vitals] sendBeacon failed, using fetch");
          sendViaFetch();
        }
      } else {
        sendViaFetch();
      }
    }
  });

  return null;
}

