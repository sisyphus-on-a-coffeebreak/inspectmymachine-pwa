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
      // Find all script tags
      const scriptRegex = /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/gi;
      const scripts: Array<{ full: string; src: string }> = [];
      let match;
      
      while ((match = scriptRegex.exec(html)) !== null) {
        scripts.push({ full: match[0], src: match[1] });
      }
      
      // Find all modulepreload links
      const preloadRegex = /<link[^>]*rel=["']modulepreload["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
      const preloads: Array<{ full: string; href: string }> = [];
      
      while ((match = preloadRegex.exec(html)) !== null) {
        preloads.push({ full: match[0], href: match[1] });
      }
      
      // Separate chunks by priority: vendor-react first, then others
      const reactPreloads = preloads.filter(p => p.href.includes('vendor-react'));
      const otherPreloads = preloads.filter(p => !p.href.includes('vendor-react') && !p.href.includes('vendor-misc'));
      const vendorMiscPreloads = preloads.filter(p => p.href.includes('vendor-misc'));
      
      // Remove all preloads
      preloads.forEach(p => {
        html = html.replace(p.full, '');
      });
      
      // Insert in correct order: vendor-react first, then others, then vendor-misc last
      const orderedPreloads = [
        ...reactPreloads.map(p => p.full),
        ...otherPreloads.map(p => p.full),
        ...vendorMiscPreloads.map(p => p.full)
      ];
      
      // Find the first script tag to insert before it
      if (scripts.length > 0 && orderedPreloads.length > 0) {
        const firstScript = scripts[0].full;
        html = html.replace(firstScript, orderedPreloads.join('\n    ') + '\n    ' + firstScript);
      } else if (orderedPreloads.length > 0) {
        // Insert before closing head tag if no scripts found
        html = html.replace('</head>', orderedPreloads.join('\n    ') + '\n    </head>');
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
      // Disable auto-injection of manifest link so we can control it manually
      injectManifest: false,
      // Use manifest.json instead of manifest.webmanifest
      manifestFilename: "manifest.json",

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
        // Required fields
        name: "VOMS - Vehicle Operations Management System",
        short_name: "VOMS",
        start_url: "https://inspectmymachine.in/login",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-256x256.png", sizes: "256x256", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        
        // Recommended fields
        description: "Professional vehicle inspection and operations management",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        display: "standalone",
        orientation: "portrait-primary",
        id: "/",
        
        // Optional but useful fields
        scope: "/",
        lang: "en",
        categories: ["productivity", "business"],
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
        
        // Use manifest.json for PWABuilder compatibility
        filename: "manifest.json",
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
      },
      includeAssets: [
        "favicon.svg",
        "manifest.json",
        "pwa-96x96.png",
        "pwa-192x192.png",
        "pwa-256x256.png",
        "pwa-512x512.png",
        "pwa-512x512-maskable.png",
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
    // Use terser for more reliable minification with better circular dependency handling
    minify: 'terser',
    terserOptions: process.env.NODE_ENV === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // Disable optimizations that might break circular dependencies
        passes: 1, // Reduce passes to avoid breaking module structure
        unsafe: false,
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_methods: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false,
      },
      mangle: {
        // Keep module exports unmangled to preserve module boundaries
        reserved: ['React', 'ReactDOM', 'createContext', 'useState', 'useEffect'],
        properties: false,
      },
      format: {
        comments: false,
      },
    } : undefined,
    cssCodeSplit: true, // Enable CSS code splitting by route/chunk
    cssMinify: 'lightningcss', // Use lightningcss for faster CSS minification (if available)
    // Ensure proper chunk ordering - React must be available before other chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // Use 'allow-extension' to allow better module resolution while preserving boundaries
      preserveEntrySignatures: 'allow-extension',
      output: {
        // Ensure proper module format to avoid initialization issues
        format: 'es',
        // Ensure proper dependency resolution
        externalLiveBindings: true,
        // Preserve module structure
        generatedCode: {
          constBindings: true,
        },
        // Chunk file naming - ensure proper loading order
        chunkFileNames: (chunkInfo) => {
          // Ensure vendor-react loads FIRST (all React code together)
          if (chunkInfo.name === 'vendor-react') {
            return 'assets/js/vendor/vendor-react-[hash].js';
          }
          // Group other chunks by type
          if (chunkInfo.name?.includes('vendor')) {
            return 'assets/js/vendor/[name]-[hash].js';
          }
          if (chunkInfo.name?.includes('route-')) {
            return 'assets/js/routes/[name]-[hash].js';
          }
          return 'assets/js/[name]-[hash].js';
        },
        manualChunks: (id, { getModuleInfo }) => {
          // CRITICAL: Check for React dependencies FIRST, before any other chunking logic
          // This ensures React-dependent code never ends up in vendor-misc
          // IMPORTANT: Put ALL React code in ONE chunk to avoid initialization order issues
          if (id.includes('node_modules')) {
            // Check if this is a React-related module
            const isReact = 
              // Core React packages (exact matches first)
              id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('/react/jsx-runtime') ||
              id.includes('/react/jsx-dev-runtime') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/use-sync-external-store/') ||
              // React UI libraries
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/@dnd-kit') ||
              // React routing
              id.includes('node_modules/react-router') ||
              // React query/data fetching
              id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/@tanstack/react-query-devtools') ||
              // React i18n
              id.includes('node_modules/react-i18next') ||
              // React state management
              id.includes('node_modules/react-redux') ||
              id.includes('node_modules/@reduxjs/toolkit');
            
            // Also check for React in path (but exclude false positives)
            const lowerId = id.toLowerCase();
            const hasReactInPath = (lowerId.includes('/react') || lowerId.includes('react-')) &&
              !lowerId.includes('preact') &&
              !lowerId.includes('reactivate');
            
            if (isReact || hasReactInPath) {
              return 'vendor-react';
            }
          }
          
          // Now handle non-React node_modules
          if (id.includes('node_modules')) {
            // Pure utility libraries (don't depend on React)
            if (id.includes('node_modules/clsx') || 
                id.includes('node_modules/tailwind-merge')) {
              return 'vendor-ui';
            }
            // Data fetching (axios doesn't depend on React)
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
            // i18n (non-React parts)
            if (id.includes('node_modules/i18next') || 
                id.includes('node_modules/i18next-browser-languagedetector')) {
              return 'vendor-i18n';
            }
            // Everything else goes to vendor-misc (but React deps already caught above)
            return 'vendor-misc';
          }
          
          // Route-based code splitting for pages (only for source files, not node_modules)
          if (!id.includes('node_modules')) {
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
          }
          
          // Return undefined to let Vite handle it (shouldn't reach here for node_modules)
          return undefined;
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
