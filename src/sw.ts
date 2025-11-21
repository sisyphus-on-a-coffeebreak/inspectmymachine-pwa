/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core"
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching"
import { registerRoute, NavigationRoute } from "workbox-routing"
import { NetworkOnly, StaleWhileRevalidate, CacheFirst } from "workbox-strategies"
import { BackgroundSyncPlugin } from "workbox-background-sync"
import { ExpirationPlugin } from "workbox-expiration"
import { CacheableResponsePlugin } from "workbox-cacheable-response"

// Make TS happy
declare const self: ServiceWorkerGlobalScope

const CACHE_VERSION = "v1.0.0"

// Offline fallback page to cache during install
const OFFLINE_PAGE = "/offline.html"

// Skip waiting and cache offline page during install
self.addEventListener("install", async (event) => {
  event.waitUntil(
    caches.open("offline-fallback").then((cache) => cache.add(OFFLINE_PAGE))
  )
  self.skipWaiting()
})

// Claim clients immediately on activation
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// Precache app shell (Vite injects manifest)
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// Navigation fallback to index.html (SPA support) with offline fallback
const navigationHandler = createHandlerBoundToURL("/index.html")
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [/^\/api\//, /^\/v1\//],
})

// Wrap navigation route to provide offline fallback
registerRoute(
  ({ request }) => request.mode === "navigate",
  async ({ event }) => {
    try {
      // Try the navigation handler first (serves index.html)
      const response = await navigationHandler.handle(event as FetchEvent)
      return response
    } catch (error) {
      // If navigation fails (offline, network error), serve offline page
      const cache = await caches.open("offline-fallback")
      const offlineResponse = await cache.match(OFFLINE_PAGE)
      if (offlineResponse) {
        return offlineResponse
      }
      // Last resort: try to fetch offline.html directly
      return fetch(OFFLINE_PAGE)
    }
  }
)

// Also register the standard navigation route for API denylist
registerRoute(navigationRoute)

// API calls - Network only (never cache API responses)
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/v1/"),
  new NetworkOnly()
)

// File uploads - Network only with background sync
const uploadBgSync = new BackgroundSyncPlugin("photo-uploads", {
  maxRetentionTime: 24 * 60, // 24 hours
})

registerRoute(
  ({ url, request }) =>
    (url.pathname.includes("/files/upload") || url.pathname.startsWith("/v1/files/upload")) &&
    request.method === "POST",
  new NetworkOnly({ plugins: [uploadBgSync] }),
  "POST"
)

// Static assets (JS/CSS) - Stale while revalidate
registerRoute(
  ({ request }) => request.destination === "script" || request.destination === "style",
  new StaleWhileRevalidate({
    cacheName: `static-assets-${CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 days
    ],
  })
)

// Fonts - Cache first (rarely change)
registerRoute(
  ({ request }) => request.destination === "font",
  new CacheFirst({
    cacheName: `fonts-${CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }), // 1 year
    ],
  })
)

// Images - Stale while revalidate with size limit
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: `images-${CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }), // 7 days
    ],
  })
)

// External CDN assets (if any)
registerRoute(
  ({ url }) =>
    url.origin !== self.location.origin &&
    (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")),
  new StaleWhileRevalidate({
    cacheName: `external-assets-${CACHE_VERSION}`,
    plugins: [new ExpirationPlugin({ maxEntries: 20 })],
  })
)
