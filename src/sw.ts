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

// Skip waiting and claim clients immediately
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", () => self.clients.claim())

// Precache app shell (Vite injects manifest)
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// Navigation fallback to index.html (SPA support)
const navigationHandler = createHandlerBoundToURL("/index.html")
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//, /^\/v1\//],
  })
)

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
