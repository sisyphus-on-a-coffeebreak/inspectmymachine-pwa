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

  // Log web vitals in development (using logger would be overkill here)
  // This is intentionally kept as console.log for web vitals debugging
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating)
  }

  // Check if already disabled (endpoint doesn't exist)
  if (typeof window !== "undefined" && (window as any).__webVitalsDisabled) {
    return
  }

  // Only send to analytics if endpoint is available (check on first call)
  // Silently skip if endpoint doesn't exist to avoid console errors
  if (navigator.sendBeacon) {
    try {
      const sent = navigator.sendBeacon("/api/v1/analytics/vitals", JSON.stringify(report))
      if (!sent) {
        // sendBeacon failed, disable future calls
        if (typeof window !== "undefined") {
          ;(window as any).__webVitalsDisabled = true
        }
      }
    } catch (e) {
      // Silently fail - endpoint may not exist, disable future calls
      if (typeof window !== "undefined") {
        ;(window as any).__webVitalsDisabled = true
      }
    }
  } else {
    fetch("/api/v1/analytics/vitals", {
      method: "POST",
      body: JSON.stringify(report),
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        // Check if endpoint exists (405 = method not allowed, 404 = not found)
        if (!response.ok || response.status === 404 || response.status === 405) {
          // Endpoint doesn't exist, disable future calls
          if (typeof window !== "undefined") {
            ;(window as any).__webVitalsDisabled = true
          }
        }
      })
      .catch(() => {
        // Network error or other issue - silently ignore
        // Don't disable on network errors, only on 404/405
      })
  }
}

export function initWebVitals() {
  // Skip if disabled (endpoint doesn't exist)
  if (typeof window !== "undefined" && (window as any).__webVitalsDisabled) {
    return
  }

  // Wrap sendToAnalytics to check if disabled after first call
  const wrappedSend = (metric: Metric) => {
    if (typeof window !== "undefined" && (window as any).__webVitalsDisabled) {
      return
    }
    sendToAnalytics(metric)
  }

  onCLS(wrappedSend)
  onFCP(wrappedSend)
  onINP(wrappedSend) // Replaces deprecated onFID
  onLCP(wrappedSend)
  onTTFB(wrappedSend)
}

