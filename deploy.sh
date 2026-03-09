#!/bin/bash

# Deploy script for FamilyHub Market
echo "🚀 Starting deployment..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Copy production env file from example
echo "📋 Setting up production environment..."
cp .env.local.example .env.local

# Update production values
SITE_URL=${SITE_URL:-"https://207.154.197.122:3000"}
sed -i.bak 's/NODE_ENV=development/NODE_ENV=production/' .env.local
sed -i.bak "s|NEXT_PUBLIC_SITE_URL=http://localhost:3000|NEXT_PUBLIC_SITE_URL=${SITE_URL}|" .env.local

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart familyhub

echo "✅ Deployment completed!"
echo "🌐 Site available at: https://207.154.197.122:3000"
echo "⚠️  Don't forget to add your API keys to .env.local on server!"
