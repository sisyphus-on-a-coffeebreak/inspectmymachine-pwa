/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core"
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { NetworkOnly, StaleWhileRevalidate } from "workbox-strategies"
import { BackgroundSyncPlugin } from "workbox-background-sync"

// Make TS happy
declare const self: ServiceWorkerGlobalScope

// Precache built assets
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

self.skipWaiting()
clientsClaim()

// Background Sync for uploads
const uploadBgSync = new BackgroundSyncPlugin("photo-uploads", {
  maxRetentionTime: 24 * 60, // minutes
})

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/v1/files/upload") && request.method === "POST",
  new NetworkOnly({ plugins: [uploadBgSync] }),
  "POST"
)

// Never cache any other API request
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly()
)

// Static assets: fast updates
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font",
  new StaleWhileRevalidate()
)

// Images: okay to cache (your signed URLs will rotate anyway)
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate()
)
