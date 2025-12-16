#!/bin/bash

# Quick deployment script for VOMS PWA
# This script prepares the dist folder for deployment

echo "🚀 Preparing deployment..."

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from the project root."
    exit 1
fi

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "📦 Building production bundle..."
    npm run build:production
fi

echo "✅ Build ready in dist/ folder"
echo ""
echo "📋 Deployment options:"
echo ""
echo "Option 1: Cloudflare Pages (Auto-deploy from Git)"
echo "  - If using Cloudflare Pages, it will auto-deploy when you push to main"
echo "  - Current branch: $(git branch --show-current)"
echo ""
echo "Option 2: Manual Upload"
echo "  - Upload the entire 'dist/' folder contents to your hosting"
echo "  - Size: $(du -sh dist/ | cut -f1)"
echo ""
echo "Option 3: rsync to server (if you have SSH access)"
echo "  rsync -avz --delete dist/ user@inspectmymachine.in:/path/to/webroot/"
echo ""
echo "✅ Ready to deploy!"
