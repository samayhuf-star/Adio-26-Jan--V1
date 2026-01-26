#!/bin/bash

# Adiology Vercel Deployment Script
# This script helps you deploy the app to Vercel

set -e

echo "🚀 Adiology Deployment Script"
echo "================================"
echo ""

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

echo ""
echo "📋 Current Configuration:"
echo "  - Project: adiology-dashboard"
echo "  - Build Command: npm run build"
echo "  - Output Directory: build"
echo ""

# Ask for deployment type
read -p "Deploy to production? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    vercel --prod --yes
else
    echo "🚀 Deploying to preview..."
    vercel --yes
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Check deployment logs in Vercel dashboard"
echo "  2. Verify environment variables are set"
echo "  3. Test your app at the deployment URL"
echo ""
