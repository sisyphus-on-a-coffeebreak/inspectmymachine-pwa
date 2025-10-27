# VOMS - Vehicle Operations Management System

A comprehensive Progressive Web Application (PWA) for vehicle inspection and operations management, built with React, TypeScript, and Laravel.

🌐 **Live Site**: [inspectmymachine.in](https://inspectmymachine.in)  
🔗 **API**: [api.inspectmymachine.in](https://api.inspectmymachine.in)

## 🚀 Features

### Core Modules
- **🔍 Vehicle Inspections** - Comprehensive 130+ question inspection forms with PDF reports
- **🚪 Gate Pass Management** - QR-based visitor and vehicle pass system
- **💰 Expense Management** - Employee expense tracking and approval workflow
- **📦 Stockyard Management** - Inventory and asset management

### Technical Features
- **📱 Progressive Web App** - Installable on mobile devices
- **🔄 Offline Support** - Works without internet connection
- **📊 Real-time Dashboard** - Live statistics and activity feed
- **🔐 Role-based Access** - Multi-level user permissions
- **📄 PDF Generation** - Professional inspection reports
- **📷 Media Capture** - Camera, audio, and signature support

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **PWA** with service workers

### Backend
- **Laravel 11** with PHP 8.3
- **MySQL** database
- **Laravel Sanctum** for authentication
- **Cloudflare R2** for file storage
- **RESTful API** architecture

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PHP 8.3+ and Composer
- MySQL 8.0+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/voms-pwa.git
   cd voms-pwa
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up Laravel backend**
   ```bash
   cd ../vosm  # Navigate to Laravel project
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   ```

4. **Start development servers**
   ```bash
   # Frontend (from voms-pwa directory)
   npm run dev
   
   # Backend (from vosm directory)
   php artisan serve
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## 📦 Production Deployment

### Frontend Deployment

1. **Build for production**
   ```bash
   ./build-production.sh
   # or
   npm run build:production
   ```

2. **Deploy to hosting service**
   - Upload `dist/` folder contents to Netlify, Vercel, or similar
   - Configure custom domain: `inspectmymachine.in`

### Backend Deployment

1. **Configure production environment**
   ```bash
   cp .env.production .env
   ```

2. **Deploy to server**
   ```bash
   composer install --no-dev --optimize-autoloader
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   ```

3. **Configure web server**
   - Set up Nginx/Apache
   - Configure SSL certificates
   - Point `api.inspectmymachine.in` to server

### Domain Configuration

```
# DNS Settings
inspectmymachine.in → Frontend hosting
api.inspectmymachine.in → Backend server
```

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Production
npm run build:production    # Build with production settings
npm run preview:production  # Preview production build
npm run deploy:prepare      # Build and type check
npm run deploy:check        # Lint and type check

# Code Quality
npm run typecheck       # TypeScript type checking
npm run lint           # ESLint checking
npm run lint:fix       # Fix ESLint issues
```

## 🏗️ Project Structure

```
voms-pwa/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── providers/     # React context providers
│   ├── lib/          # Utility functions
│   ├── hooks/        # Custom React hooks
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
├── dist/            # Production build output
└── vosm/            # Laravel backend (separate repo)

vosm/ (Laravel Backend)
├── app/
│   ├── Http/Controllers/
│   └── Models/
├── database/
│   └── migrations/
├── routes/
│   └── api.php
└── .env.production
```

## 🔧 Configuration

### Environment Variables

#### Frontend (`production.env`)
```env
VITE_API_ORIGIN=https://api.inspectmymachine.in
VITE_API_BASE=https://api.inspectmymachine.in/api
VITE_APP_URL=https://inspectmymachine.in
```

#### Backend (`.env.production`)
```env
APP_URL=https://api.inspectmymachine.in
FRONTEND_URL=https://inspectmymachine.in
SESSION_DOMAIN=.inspectmymachine.in
SANCTUM_STATEFUL_DOMAINS=inspectmymachine.in,www.inspectmymachine.in
```

## 📱 PWA Features

- **Installable** - Add to home screen on mobile devices
- **Offline Support** - Core functionality works without internet
- **Background Sync** - Uploads resume when connection restored
- **Push Notifications** - Real-time updates (ready for implementation)
- **App-like Experience** - Native mobile app feel

## 🔐 Authentication & Security

- **Laravel Sanctum** - Secure cookie-based authentication
- **CSRF Protection** - Cross-site request forgery prevention
- **Role-based Access** - Granular permission system
- **HTTPS Only** - Secure communication in production
- **Input Validation** - Server-side validation for all inputs

## 📊 Performance

- **Code Splitting** - Lazy loading for optimal performance
- **Image Optimization** - Compressed and optimized images
- **Caching Strategy** - Service worker caching
- **Bundle Optimization** - Minified and compressed assets
- **Database Optimization** - Indexed queries and caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@inspectmymachine.in
- **Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/voms-pwa/issues)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with external APIs
- [ ] Advanced reporting features
- [ ] Real-time notifications

---

**Built with ❤️ for efficient vehicle operations management**