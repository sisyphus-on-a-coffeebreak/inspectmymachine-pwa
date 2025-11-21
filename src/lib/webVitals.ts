import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals"
import type { Metric } from "web-vitals"

type VitalsReport = {
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
  delta: number
  id: string
}

function sendToAnalytics(metric: Metric) {
  const report: VitalsReport = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  }

  // Send to your analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/v1/analytics/vitals", JSON.stringify(report))
  } else {
    fetch("/api/v1/analytics/vitals", {
      method: "POST",
      body: JSON.stringify(report),
      keepalive: true,
    }).catch(() => {
      // Silently fail if analytics endpoint is not available
    })
  }

  // Console log in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating)
  }
}

export function initWebVitals() {
  onCLS(sendToAnalytics)
  onFCP(sendToAnalytics)
  onINP(sendToAnalytics) // Replaces deprecated onFID
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}

