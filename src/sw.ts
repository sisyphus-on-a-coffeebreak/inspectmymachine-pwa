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
    Promise.all([
      // Cache offline page
      caches.open("offline-fallback").then((cache) => cache.add(OFFLINE_PAGE)),
      // Cache app shell more aggressively
      caches.open(`app-shell-${CACHE_VERSION}`).then((cache) => {
        return cache.addAll([
          "/",
          "/index.html",
          "/offline.html",
          // Critical CSS and JS will be precached by Workbox
        ]);
      }),
    ])
  );
  self.skipWaiting();
});

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

// Wrap navigation route to provide offline fallback with better messaging
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
      let offlineResponse = await cache.match(OFFLINE_PAGE)
      
      if (!offlineResponse) {
        // Try app shell cache
        const appShellCache = await caches.open(`app-shell-${CACHE_VERSION}`)
        offlineResponse = await appShellCache.match(OFFLINE_PAGE) || 
                         await appShellCache.match("/index.html")
      }
      
      if (offlineResponse) {
        // Clone response to add custom headers
        const response = offlineResponse.clone()
        const headers = new Headers(response.headers)
        headers.set("X-Offline", "true")
        headers.set("X-Cached-At", new Date().toISOString())
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      }
      
      // Last resort: return a basic offline response
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - VOMS</title>
  <style>
    body { font-family: system-ui; text-align: center; padding: 2rem; }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>You're Offline</h1>
  <p>Please check your internet connection and try again.</p>
  <button onclick="window.location.reload()">Retry</button>
</body>
</html>`,
        {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "text/html", "X-Offline": "true" },
        }
      )
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

// Push notification event handler
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() || {};
  const title = data.title || "VOMS Notification";
  const options: NotificationOptions = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/pwa-192x192.png",
    badge: "/pwa-96x96.png",
    tag: data.tag || "voms-notification",
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || [],
    image: data.image,
    timestamp: data.timestamp || Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close handler
self.addEventListener("notificationclose", (event: NotificationEvent) => {
  // Track notification dismissal if needed
  const data = event.notification.data || {};
  if (data.trackDismissal) {
    // Send analytics event
    console.log("Notification dismissed:", data.tag);
  }
});
