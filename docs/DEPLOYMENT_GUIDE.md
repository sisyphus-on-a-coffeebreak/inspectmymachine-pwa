# VOMS PWA Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Development Setup](#development-setup)
5. [Production Build](#production-build)
6. [Deployment Options](#deployment-options)
7. [PWA Configuration](#pwa-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

VOMS PWA is a Progressive Web Application built with Vite and React. This guide covers deployment to various environments.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   VOMS PWA      │────▶│   API Server    │────▶│   Database      │
│   (Frontend)    │     │   (Laravel)     │     │   (MySQL)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│   CDN/Hosting   │
│   (Static)      │
└─────────────────┘
```

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| Memory | 2GB | 4GB+ |
| Disk | 500MB | 1GB+ |

### Required Tools

```bash
# Check Node.js version
node --version  # Should be 18+

# Check npm version
npm --version  # Should be 9+

# Install if needed (using nvm)
nvm install 20
nvm use 20
```

---

## Environment Configuration

### Environment Files

Create environment files for different stages:

```bash
.env                 # Default/development
.env.local           # Local overrides (gitignored)
.env.production      # Production settings
.env.staging         # Staging settings
```

### Required Variables

```env
# API Configuration
VITE_API_BASE_URL=https://api.example.com/api
VITE_API_ORIGIN=https://api.example.com

# App Configuration
VITE_APP_NAME=VOMS
VITE_APP_VERSION=1.0.0

# Feature Flags (optional)
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false

# Debug (development only)
VITE_DEBUG=false
```

### Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Full API URL with path | `https://api.voms.com/api` |
| `VITE_API_ORIGIN` | API origin for CORS | `https://api.voms.com` |
| `VITE_APP_NAME` | Application name | `VOMS` |
| `VITE_ENABLE_PWA` | Enable PWA features | `true` |

---

## Development Setup

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/voms-pwa.git
cd voms-pwa

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local

# Start development server
npm run dev
```

### Development Server

```bash
# Start with default settings
npm run dev

# Start on specific port
npm run dev -- --port 3000

# Start with host exposure (for mobile testing)
npm run dev -- --host
```

Access at `http://localhost:5173` (or configured port)

### Hot Module Replacement

Vite provides HMR out of the box:
- Component changes reflect instantly
- Style changes apply without reload
- State is preserved when possible

---

## Production Build

### Build Process

```bash
# Install production dependencies
npm ci

# Build for production
npm run build
```

### Build Output

```
dist/
├── index.html              # Entry point
├── assets/
│   ├── index-[hash].js    # Main bundle
│   ├── index-[hash].css   # Styles
│   └── [chunk]-[hash].js  # Code-split chunks
├── manifest.json          # PWA manifest
└── sw.js                  # Service worker
```

### Build Optimization

The build automatically:
- Minifies JavaScript and CSS
- Code-splits by route
- Generates source maps
- Optimizes images
- Tree-shakes unused code

### Analyzing Bundle Size

```bash
# Build with stats
npm run build -- --stats

# Use vite-bundle-visualizer (if installed)
npx vite-bundle-visualizer
```

---

## Deployment Options

### Option 1: Static Hosting (Recommended)

Best for: Netlify, Vercel, Cloudflare Pages

**Netlify:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel:**
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Option 2: Nginx

```nginx
# /etc/nginx/sites-available/voms
server {
    listen 80;
    server_name voms.example.com;
    root /var/www/voms/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker - no cache
    location /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  voms-pwa:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
```

### Option 4: AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

## PWA Configuration

### Manifest Configuration

```json
// public/manifest.json
{
  "name": "VOMS - Vehicle Operations Management",
  "short_name": "VOMS",
  "description": "Vehicle Operations Management System",
  "theme_color": "#1a56db",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker

The service worker handles:
- Offline caching
- Background sync
- Push notifications (if enabled)

### Testing PWA

1. Build for production: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome DevTools → Application
4. Check "Service Workers" and "Manifest"

### Lighthouse Audit

```bash
# Run Lighthouse audit
npx lighthouse https://your-app-url --view
```

Target scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: ✓

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## Security Considerations

### Content Security Policy

```html
<!-- In index.html or server config -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  font-src 'self';
">
```

### HTTPS

Always use HTTPS in production:
- Required for service workers
- Required for many PWA features
- Essential for security

### API Security

- Use CORS properly
- Validate all inputs
- Implement rate limiting
- Use secure cookies

---

## Troubleshooting

### Common Issues

**Build fails with memory error:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Assets not loading:**
- Check `base` in `vite.config.ts`
- Verify asset paths are relative
- Check CORS configuration

**Service worker issues:**
- Clear browser cache
- Unregister old service workers
- Check console for errors

**API connection fails:**
- Verify `VITE_API_BASE_URL`
- Check CORS headers
- Test API directly

### Debug Mode

```bash
# Enable Vite debug logging
DEBUG=vite:* npm run build
```

### Performance Issues

1. Check bundle size with analyzer
2. Verify code splitting is working
3. Check for unnecessary dependencies
4. Optimize images

### Health Check

After deployment, verify:
- [ ] App loads correctly
- [ ] Login works
- [ ] API calls succeed
- [ ] PWA manifest is detected
- [ ] Service worker is registered
- [ ] HTTPS is working
- [ ] No console errors

---

## Monitoring

### Recommended Tools

- **Error Tracking:** Sentry
- **Analytics:** Google Analytics, Plausible
- **Performance:** Lighthouse CI, Web Vitals
- **Uptime:** UptimeRobot, Pingdom

### Key Metrics

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.8s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.8s |
| Cumulative Layout Shift | < 0.1 |

---

## Rollback Procedure

### Quick Rollback

```bash
# If using versioned deployments
# Revert to previous version
git revert HEAD
npm run build
# Deploy

# If using Netlify/Vercel
# Use dashboard to rollback to previous deploy
```

### Blue-Green Deployment

1. Deploy new version to staging
2. Run smoke tests
3. Switch traffic to new version
4. Keep old version available for quick rollback

---

## Support

For deployment issues:
1. Check this guide
2. Review error logs
3. Search existing issues
4. Contact DevOps team







