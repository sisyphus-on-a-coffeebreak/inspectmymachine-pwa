# VOMS Production Deployment Guide
# Domain: inspectmymachine.in

## 🚀 Production Deployment Checklist

### Frontend (React PWA)
- [x] Updated API endpoints to `https://api.inspectmymachine.in`
- [x] Configured production build settings
- [x] Updated PWA manifest for production
- [x] Added production environment variables
- [x] Configured Vite for production builds

### Backend (Laravel)
- [x] Created production `.env.production` file
- [x] Updated database configuration for production
- [x] Configured Sanctum for production domain
- [x] Updated session and cookie settings
- [x] Configured Cloudflare R2 storage

## 📋 Deployment Steps

### 1. Frontend Deployment
```bash
# Build for production
npm run build:production

# Test production build locally
npm run preview:production

# Deploy to hosting service (Netlify, Vercel, etc.)
# Upload the `dist/` folder contents
```

### 2. Backend Deployment
```bash
# Copy production environment
cp .env.production .env

# Install dependencies
composer install --no-dev --optimize-autoloader

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper permissions
chmod -R 755 storage bootstrap/cache
```

### 3. Domain Configuration

#### DNS Settings
```
# Main domain
inspectmymachine.in → Frontend hosting (Netlify/Vercel)

# API subdomain  
api.inspectmymachine.in → Backend hosting (DigitalOcean/Linode)
```

#### SSL Certificates
- Frontend: Automatic SSL (Netlify/Vercel)
- Backend: Let's Encrypt or Cloudflare SSL

### 4. Environment Variables

#### Frontend (.env.production)
```
VITE_API_ORIGIN=https://api.inspectmymachine.in
VITE_API_BASE=https://api.inspectmymachine.in/api
VITE_APP_URL=https://inspectmymachine.in
```

#### Backend (.env.production)
```
APP_URL=https://api.inspectmymachine.in
FRONTEND_URL=https://inspectmymachine.in
SESSION_DOMAIN=.inspectmymachine.in
SANCTUM_STATEFUL_DOMAINS=inspectmymachine.in,www.inspectmymachine.in,api.inspectmymachine.in
```

## 🔧 Production Optimizations

### Frontend
- ✅ Code splitting and lazy loading
- ✅ PWA with offline capabilities
- ✅ Image optimization
- ✅ Minified and compressed assets
- ✅ Service worker for caching

### Backend
- ✅ Optimized autoloader
- ✅ Cached configurations
- ✅ Database query optimization
- ✅ Redis caching (optional)
- ✅ CDN for static assets

## 📊 Monitoring & Analytics

### Recommended Tools
- **Frontend**: Vercel Analytics, Google Analytics
- **Backend**: Laravel Telescope, Sentry
- **Database**: Laravel Debugbar (dev only)
- **Performance**: Lighthouse CI

## 🚨 Security Checklist

- [ ] HTTPS enabled on all domains
- [ ] CORS properly configured
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] Database credentials secured
- [ ] API keys stored securely
- [ ] Regular security updates

## 📱 PWA Features

- ✅ Installable on mobile devices
- ✅ Offline functionality
- ✅ Push notifications (ready)
- ✅ Background sync
- ✅ App-like experience

## 🔄 CI/CD Pipeline

### GitHub Actions (Recommended)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build:production
      - run: npm run deploy:check
```

## 📞 Support & Maintenance

### Contact Information
- **Domain**: inspectmymachine.in
- **Email**: admin@inspectmymachine.in
- **Support**: support@inspectmymachine.in

### Backup Strategy
- Database: Daily automated backups
- Files: Cloudflare R2 with versioning
- Code: Git repository with tags

---

## 🎯 Quick Start Commands

```bash
# Frontend
npm run deploy:prepare  # Build and check
npm run preview:production  # Test locally

# Backend  
php artisan migrate --force  # Deploy migrations
php artisan config:cache  # Cache config
```

**Ready for production deployment! 🚀**

