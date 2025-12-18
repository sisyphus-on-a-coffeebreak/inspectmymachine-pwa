import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals"
import type { Metric } from "web-vitals"
import { getApiUrl } from "./apiConfig"

type VitalsReport = {
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
  delta: number
  id: string
}

// Check endpoint availability once on initialization
let endpointCheckPromise: Promise<boolean> | null = null

/**
 * Check if the analytics endpoint is available
 * This prevents making requests to a non-existent endpoint
 */
async function checkEndpointAvailability(): Promise<boolean> {
  if (endpointCheckPromise) {
    return endpointCheckPromise
  }

  endpointCheckPromise = (async () => {
    try {
      // Use OPTIONS request to check if endpoint exists (CORS preflight)
      // If OPTIONS isn't supported, try a minimal POST request
      let response: Response
      
      try {
        response = await fetch(getApiUrl("/v1/analytics/vitals"), {
          method: "OPTIONS",
          cache: "no-store",
          credentials: "include",
        })
      } catch {
        // OPTIONS failed, try a minimal POST request
        response = await fetch(getApiUrl("/v1/analytics/vitals"), {
          method: "POST",
          body: JSON.stringify({ test: true }),
          headers: {
            'Content-Type': 'application/json',
          },
          cache: "no-store",
          credentials: "include",
        })
      }
      
      // 405 (Method Not Allowed) means the endpoint exists but method isn't supported
      // 404 means it doesn't exist, 200/204/400 means it exists (400 is OK, means endpoint processed it)
      const isAvailable = response.status !== 404
      
      if (!isAvailable) {
        if (typeof window !== "undefined") {
          ;(window as any).__webVitalsDisabled = true
        }
      }
      
      return isAvailable
    } catch (error) {
      // Network error - don't disable, might be temporary
      // But don't make requests either until we can verify
      return false
    }
  })()

  return endpointCheckPromise
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

  // Only send to analytics if endpoint is available
  // Silently skip if endpoint doesn't exist to avoid console errors
  const analyticsUrl = getApiUrl("/v1/analytics/vitals");
  
  if (navigator.sendBeacon) {
    try {
      // sendBeacon requires Blob for JSON
      const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
      const sent = navigator.sendBeacon(analyticsUrl, blob);
      if (!sent) {
        // sendBeacon failed, but don't disable - might be temporary
        return
      }
    } catch (e) {
      // Silently fail - might be temporary issue
      return
    }
  } else {
    fetch(analyticsUrl, {
      method: "POST",
      body: JSON.stringify(report),
      keepalive: true,
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        // Check if endpoint exists (405 = method not allowed, 404 = not found)
        if (response.status === 404 || response.status === 405) {
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

export async function initWebVitals() {
  // Skip if disabled (endpoint doesn't exist)
  if (typeof window !== "undefined" && (window as any).__webVitalsDisabled) {
    return
  }

  // Check endpoint availability before initializing
  const isAvailable = await checkEndpointAvailability()
  if (!isAvailable) {
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

