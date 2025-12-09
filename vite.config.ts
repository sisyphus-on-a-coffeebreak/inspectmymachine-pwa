// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
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
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-256x256.png", sizes: "256x256", type: "image/png" },
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
            icons: [{ src: "pwa-96x96.png", sizes: "96x96", type: "image/png" }],
          },
          {
            name: "New Inspection",
            url: "/app/inspections/new",
            icons: [{ src: "pwa-96x96.png", sizes: "96x96", type: "image/png" }],
          },
          {
            name: "Log Expense",
            url: "/app/expenses/create",
            icons: [{ src: "pwa-96x96.png", sizes: "96x96", type: "image/png" }],
          },
        ],
      },
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "pwa-96x96.png",
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
            proxyReq.setHeader('Referer', req.headers.referer || req.url);
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
    rollupOptions: {
      output: {
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
        // Chunk file naming
        chunkFileNames: (chunkInfo) => {
          // Group chunks by type
          if (chunkInfo.name?.includes('vendor')) {
            return 'assets/js/vendor/[name]-[hash].js';
          }
          if (chunkInfo.name?.includes('route-')) {
            return 'assets/js/routes/[name]-[hash].js';
          }
          return 'assets/js/[name]-[hash].js';
        },
      },
    },
  },
});
