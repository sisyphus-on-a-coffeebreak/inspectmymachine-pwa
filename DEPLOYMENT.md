# Deployment Guide

## Frontend Deployment (VOMS PWA)

### Option 1: Netlify

1. **Connect Repository**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

2. **Build Settings**
   - Build command: `npm run build:production`
   - Publish directory: `dist`
   - Environment variables (if needed):
     - `VITE_API_ORIGIN=https://api.inspectmymachine.in/api`
     - `VITE_APP_URL=https://inspectmymachine.in`

3. **Custom Domain**
   - Add custom domain: `inspectmymachine.in`
   - Configure DNS as per Netlify instructions

### Option 2: Vercel

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build:production`
   - Output Directory: `dist`
   - Install Command: `npm ci`

3. **Environment Variables**
   - Add environment variables in Vercel dashboard

4. **Custom Domain**
   - Add domain: `inspectmymachine.in`
   - Configure DNS

### Option 3: Manual Deployment (SSH/rsync)

```bash
# Build the project
npm run build:production

# Deploy to server (replace with your server details)
rsync -avz --delete dist/ user@inspectmymachine.in:/var/www/html/
```

## Backend Deployment (VOSM Laravel)

1. **SSH into server**
   ```bash
   ssh user@api.inspectmymachine.in
   ```

2. **Navigate to project directory**
   ```bash
   cd /path/to/vosm
   ```

3. **Pull latest changes**
   ```bash
   git pull origin main
   ```

4. **Install dependencies**
   ```bash
   composer install --no-dev --optimize-autoloader
   ```

5. **Run migrations**
   ```bash
   php artisan migrate --force
   ```

6. **Optimize**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

7. **Restart services**
   ```bash
   # If using PHP-FPM
   sudo systemctl restart php-fpm
   
   # If using Nginx
   sudo systemctl restart nginx
   ```

## Post-Deployment Checklist

- [ ] Frontend accessible at https://inspectmymachine.in
- [ ] Backend API accessible at https://api.inspectmymachine.in/api
- [ ] SSL certificates configured
- [ ] CORS settings correct
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Service workers working
- [ ] PWA installable
- [ ] All API endpoints responding

## Troubleshooting

### Frontend Issues
- Clear browser cache
- Check browser console for errors
- Verify API endpoints are accessible
- Check CORS configuration

### Backend Issues
- Check Laravel logs: `storage/logs/laravel.log`
- Verify database connection
- Check file permissions
- Verify .env configuration
