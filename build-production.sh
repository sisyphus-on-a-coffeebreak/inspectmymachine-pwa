#!/bin/bash

# VOMS Production Build Script
# Domain: inspectmymachine.in

echo "🚀 Starting VOMS Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Setting up production environment..."

# Set production environment
export NODE_ENV=production
export VITE_NODE_ENV=production
export VITE_API_ORIGIN=https://api.inspectmymachine.in/api
export VITE_API_BASE=https://api.inspectmymachine.in/api
export VITE_APP_URL=https://inspectmymachine.in

print_status "Installing dependencies..."
npm ci

print_status "Running type check..."
npm run typecheck
if [ $? -ne 0 ]; then
    print_error "Type check failed!"
    exit 1
fi

print_status "Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    print_warning "Linting issues found. Consider running 'npm run lint:fix'"
fi

print_status "Building for production..."
npm run build:production
if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_success "Production build completed successfully!"

# Check build output
if [ -d "dist" ]; then
    print_status "Build output:"
    ls -la dist/
    
    print_status "Build size:"
    du -sh dist/
    
    print_success "✅ Frontend ready for deployment!"
    print_status "📁 Upload the contents of the 'dist/' folder to your hosting service"
    print_status "🌐 Domain: https://inspectmymachine.in"
    print_status "🔗 API: https://api.inspectmymachine.in/api"
else
    print_error "Build output directory 'dist' not found!"
    exit 1
fi

echo ""
print_success "🎉 VOMS Production Build Complete!"
print_status "Next steps:"
echo "  1. Deploy frontend to hosting service (Netlify/Vercel)"
echo "  2. Deploy backend to server (DigitalOcean/Linode)"
echo "  3. Configure DNS for inspectmymachine.in"
echo "  4. Set up SSL certificates"
echo "  5. Test the live application"
echo ""
print_status "📖 See DEPLOYMENT.md for detailed instructions"

