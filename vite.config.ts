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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
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
        shortcuts: [
          {
            name: "New Gate Pass",
            url: "/app/gate-pass/visitor/create",
            icons: [{ src: "pwa-192x192.png", sizes: "96x96" }],
          },
          {
            name: "New Inspection",
            url: "/app/inspections/new",
            icons: [{ src: "pwa-192x192.png", sizes: "96x96" }],
          },
          {
            name: "Log Expense",
            url: "/app/expenses/create",
            icons: [{ src: "pwa-192x192.png", sizes: "96x96" }],
          },
        ],
      },
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "offline.html"],
    }),
  ],

  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
          // UI libraries
          if (id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/clsx') || 
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'vendor-ui';
          }
          // Data fetching
          if (id.includes('node_modules/@tanstack/react-query') || 
              id.includes('node_modules/axios')) {
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
          // i18n
          if (id.includes('node_modules/i18next') || 
              id.includes('node_modules/react-i18next') ||
              id.includes('node_modules/i18next-browser-languagedetector')) {
            return 'vendor-i18n';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
});
