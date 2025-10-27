// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
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
        name: "VOMS - Vehicle Operations Management System",
        short_name: "VOMS",
        description: "Professional vehicle inspection and operations management system",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        scope: "/",
        orientation: "portrait-primary",
        categories: ["productivity", "business", "utilities"],
        lang: "en",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
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
          ? "https://api.inspectmymachine.in" 
          : "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
        configure: (proxy) => {
          proxy.on("proxyReq", (_proxyReq, req) => {
            console.log("[proxy] →", req.method, req.url);
          });
          proxy.on("proxyRes", (res, req) => {
            console.log("[proxy] ←", res.statusCode, req.url);
          });
          proxy.on("error", (err) => {
            console.error("[proxy] error:", err.message);
          });
        },
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});
