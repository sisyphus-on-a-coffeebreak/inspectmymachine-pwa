// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
import type { Plugin } from "vite";

// Plugin to ensure React loads before other vendor chunks
function reactFirstPlugin(): Plugin {
  return {
    name: 'react-first',
    transformIndexHtml(html) {
      // Collect all modulepreload links
      const preloadRegex = /<link[^>]*rel=["']modulepreload["'][^>]*>/gi;
      const allPreloads = html.match(preloadRegex) || [];
      
      // Separate vendor-react from others
      const reactPreloads: string[] = [];
      const otherPreloads: string[] = [];
      
      allPreloads.forEach(preload => {
        if (preload.includes('vendor-react')) {
          reactPreloads.push(preload);
        } else {
          otherPreloads.push(preload);
        }
      });
      
      // Remove all preloads from HTML
      html = html.replace(preloadRegex, '');
      
      // Find insertion point (before first script tag or first existing preload)
      const scriptRegex = /(<script[^>]*type=["']module["'][^>]*>)/i;
      const scriptMatch = html.match(scriptRegex);
      
      if (scriptMatch && reactPreloads.length > 0) {
        // Insert React preloads first, then other preloads, then the script
        const allPreloadsOrdered = [...reactPreloads, ...otherPreloads].join('\n    ');
        html = html.replace(scriptRegex, allPreloadsOrdered + '\n    ' + scriptMatch[1]);
      } else if (otherPreloads.length > 0) {
        // If no script tag, insert React first, then others
        const firstOtherPreload = otherPreloads[0];
        const restPreloads = otherPreloads.slice(1);
        const allPreloadsOrdered = [...reactPreloads, firstOtherPreload, ...restPreloads].join('\n    ');
        html = html.replace(firstOtherPreload, allPreloadsOrdered);
      } else if (reactPreloads.length > 0) {
        // Only React preloads, insert before closing head tag
        const headCloseRegex = /(<\/head>)/i;
        html = html.replace(headCloseRegex, reactPreloads.join('\n    ') + '\n    $1');
      }
      
      return html;
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    reactFirstPlugin(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false }, // no SW in dev

      // Workbox (generateSW) — use RegExp + method for TS-friendly config
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,avif,woff2}"],
        runtimeCaching: [
          // 1) Background Sync specifically for POST /api/v1/files/upload
          {
            urlPattern: /\/api\/v1\/files\/upload$/,
            method: "POST",
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "photo-uploads",
                options: { maxRetentionTime: 24 * 60 }, // minutes
              },
            },
          },
          // 2) All other API GETs are network-only (no caching)
          {
            urlPattern: /\/api\//,
            method: "GET",
            handler: "NetworkOnly",
          },
          // 3) Static assets: JS/CSS/WOFF2 — fast updates
          {
            urlPattern: /\.(?:js|css|woff2)$/,
            handler: "StaleWhileRevalidate",
          },
          // 4) Images (including signed URLs): safe to cache; they’ll rotate
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg|ico)$/,
            handler: "StaleWhileRevalidate",
          },
        ],
      },

      manifest: {
        id: "/",
        name: "VOMS - Vehicle Operations Management System",
        short_name: "VOMS",
        description: "Professional vehicle inspection and operations management",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        scope: "/",
        orientation: "portrait-primary",
        categories: ["productivity", "business"],
        lang: "en",
        icons: [
          { src: "logo-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "logo-256x256.png", sizes: "256x256", type: "image/png" },
          { src: "logo-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "logo-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          // Fallback to PWA icons if logo not generated
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          // WebP versions (preferred, smaller file size)
          {
            src: "screenshot-dashboard.webp",
            sizes: "1280x720",
            type: "image/webp",
            form_factor: "wide",
          },
          {
            src: "screenshot-mobile.webp",
            sizes: "750x1334",
            type: "image/webp",
            form_factor: "narrow",
          },
          // PNG fallbacks (for browsers that don't support WebP)
          {
            src: "screenshot-dashboard.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "screenshot-mobile.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
        shortcuts: [
          {
            name: "New Gate Pass",
            url: "/app/gate-pass/create-visitor",
            icons: [{ src: "logo-96x96.png", sizes: "96x96", type: "image/png" }],
          },
          {
            name: "New Inspection",
            url: "/app/inspections/new",
            icons: [{ src: "logo-96x96.png", sizes: "96x96", type: "image/png" }],
          },
          {
            name: "Log Expense",
            url: "/app/expenses/create",
            icons: [{ src: "logo-96x96.png", sizes: "96x96", type: "image/png" }],
          },
        ],
      },
      includeAssets: [
        "favicon.svg",
        "logo-16x16.png",
        "logo-32x32.png",
        "logo-96x96.png",
        "logo-152x152.png",
        "logo-167x167.png",
        "logo-180x180.png",
        "logo-192x192.png",
        "logo-256x256.png",
        "logo-512x512.png",
        "pwa-96x96.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "apple-touch-icon.png",
        "screenshot-dashboard.png",
        "screenshot-dashboard.webp",
        "screenshot-mobile.png",
        "screenshot-mobile.webp",
      ],
    }),
  ],

  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },

  // Optimize dependencies to reduce unnecessary preloading
  optimizeDeps: {
    // Only preload critical dependencies
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router-dom',
      'qrcode', // Include qrcode so Vite can pre-bundle it for browser compatibility
    ],
    // Exclude heavy dependencies from preloading (they'll load on demand)
    exclude: [
      'jspdf',
      'html2canvas',
    ],
  },

  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.NODE_ENV === 'production' 
          ? "https://api.inspectmymachine.in/api" 
          : "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
        rewrite: (path) => process.env.NODE_ENV === 'production' ? path.replace(/^\/api/, '') : path,
        configure: (proxy) => {
          // Only log proxy requests in development
          if (process.env.NODE_ENV !== 'production') {
            proxy.on("proxyReq", (_proxyReq, req) => {
              console.log("[proxy] →", req.method, req.url);
            });
            proxy.on("proxyRes", (res, req) => {
              console.log("[proxy] ←", res.statusCode, req.url);
            });
            proxy.on("error", (err) => {
              console.error("[proxy] error:", err.message);
            });
          }
        },
      },
      // Proxy storage paths to avoid CORS issues in development
      "/storage": {
        target: process.env.NODE_ENV === 'production' 
          ? "https://api.inspectmymachine.in" 
          : "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
        cookieDomainRewrite: '',
        cookiePathRewrite: '/',
        configure: (proxy) => {
          // Forward cookies and authentication
          proxy.on("proxyReq", (proxyReq, req) => {
            // Forward cookies from the original request
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            // Forward other auth headers
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            // Set referer to help with CSRF
            const referer = req.headers.referer || req.url || '';
            proxyReq.setHeader('Referer', referer);
            // Log in development for debugging
            if (process.env.NODE_ENV !== 'production') {
              console.log("[storage-proxy] →", req.method, req.url, {
                hasCookies: !!req.headers.cookie,
                cookies: req.headers.cookie ? 'present' : 'missing'
              });
            }
          });
          // Set CORS headers for storage files
          proxy.on("proxyRes", (proxyRes, req) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            // Log in development for debugging
            if (process.env.NODE_ENV !== 'production') {
              console.log("[storage-proxy] ←", proxyRes.statusCode, req.url);
            }
          });
          proxy.on("error", (err, req) => {
            console.error("[storage-proxy] error:", err.message, req.url);
          });
        },
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    terserOptions: process.env.NODE_ENV === 'production' ? {
      compress: {
        drop_console: true, // Remove all console.* calls in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
    } : undefined,
    cssCodeSplit: true, // Enable CSS code splitting by route/chunk
    cssMinify: 'lightningcss', // Use lightningcss for faster CSS minification (if available)
    // Ensure proper chunk ordering - React must be available before other chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Preserve entry signatures to maintain proper dependency order
      preserveEntrySignatures: 'strict',
      output: {
        // Chunk file naming - ensure vendor-react loads first
        chunkFileNames: (chunkInfo) => {
          // Ensure vendor-react has a predictable name and loads first
          if (chunkInfo.name === 'vendor-react') {
            return 'assets/js/vendor/vendor-react-[hash].js';
          }
          // Group chunks by type
          if (chunkInfo.name?.includes('vendor')) {
            return 'assets/js/vendor/[name]-[hash].js';
          }
          if (chunkInfo.name?.includes('route-')) {
            return 'assets/js/routes/[name]-[hash].js';
          }
          return 'assets/js/[name]-[hash].js';
        },
        manualChunks: (id) => {
          // Core React - MUST be first priority to ensure React is always available
          // Include react/jsx-runtime to ensure all React exports are available
          // Also include lucide-react and class-variance-authority since they use React.forwardRef
          // Include use-sync-external-store as it's a React dependency
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('react/jsx-runtime') ||
              id.includes('react/jsx-dev-runtime') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/@dnd-kit') ||
              id.includes('node_modules/use-sync-external-store')) {
            return 'vendor-react';
          }
          // React Query - MUST be in vendor-react since it depends on React
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-react';
          }
          // Router (depends on React) - move to vendor-react to ensure React loads first
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          // Pure utility libraries (don't depend on React)
          if (id.includes('node_modules/clsx') || 
              id.includes('node_modules/tailwind-merge')) {
            return 'vendor-ui';
          }
          // Data fetching (axios doesn't depend on React, so it can be separate)
          if (id.includes('node_modules/axios')) {
            return 'vendor-query';
          }
          // Heavy utilities (lazy load)
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/qrcode') || id.includes('node_modules/jsqr')) {
            return 'vendor-qr';
          }
          if (id.includes('node_modules/jszip')) {
            return 'vendor-zip';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          // i18n (react-i18next depends on React, so include it in vendor-react)
          if (id.includes('node_modules/react-i18next')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/i18next') || 
              id.includes('node_modules/i18next-browser-languagedetector')) {
            return 'vendor-i18n';
          }
          // React Query (depends on React, already handled above but ensure it's not in misc)
          // @tanstack/react-query is already in vendor-query above
          // Other node_modules (but exclude anything that might use React)
          if (id.includes('node_modules')) {
            // AGGRESSIVE check: if it's ANY React-dependent library, put it in vendor-react
            // This catches any libraries that might have been missed
            // Check for common React dependency patterns
            if (id.includes('/react') || 
                id.includes('react-') ||
                id.includes('use-sync-external-store') ||
                id.includes('react-redux') ||
                id.includes('@reduxjs/toolkit') ||
                id.includes('@tanstack') ||
                id.includes('react-router') ||
                id.includes('react-dom') ||
                id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor-misc';
          }
          
          // Route-based code splitting for pages
          // Gate Pass routes
          if (id.includes('/pages/gatepass/') || id.includes('/pages/gate-pass/')) {
            return 'route-gatepass';
          }
          // Inspection routes
          if (id.includes('/pages/inspections/')) {
            return 'route-inspections';
          }
          // Expense routes
          if (id.includes('/pages/expenses/')) {
            return 'route-expenses';
          }
          // Stockyard routes
          if (id.includes('/pages/stockyard/')) {
            return 'route-stockyard';
          }
          // Admin routes
          if (id.includes('/pages/admin/')) {
            return 'route-admin';
          }
        },
        // CSS chunk naming strategy - split by route
        assetFileNames: (assetInfo) => {
          // Group CSS by route/module
          if (assetInfo.name?.endsWith('.css')) {
            // Extract route name from chunk if possible
            const chunkName = assetInfo.name.replace('.css', '');
            if (chunkName.includes('gate-pass')) return 'assets/css/gate-pass-[hash][extname]';
            if (chunkName.includes('inspection')) return 'assets/css/inspection-[hash][extname]';
            if (chunkName.includes('expense')) return 'assets/css/expense-[hash][extname]';
            if (chunkName.includes('stockyard')) return 'assets/css/stockyard-[hash][extname]';
            if (chunkName.includes('admin')) return 'assets/css/admin-[hash][extname]';
            if (chunkName.includes('vendor')) return 'assets/css/vendor-[hash][extname]';
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
