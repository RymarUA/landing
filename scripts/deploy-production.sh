#!/bin/bash

# Production Deployment Script - CDN Mode
# Этот скрипт настраивает приложение для работы с Tailwind CDN (без VERCEL переменных)

set -e  # Остановить при ошибке

echo "🚀 Starting production deployment (CDN mode)..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Проверка VERCEL переменных
echo "📋 Step 1: Checking environment variables..."
if [ ! -z "$VERCEL" ] || [ ! -z "$NEXT_PUBLIC_VERCEL" ]; then
    echo -e "${RED}❌ ERROR: VERCEL environment variables are set!${NC}"
    echo ""
    echo "Found:"
    [ ! -z "$VERCEL" ] && echo "  VERCEL=$VERCEL"
    [ ! -z "$NEXT_PUBLIC_VERCEL" ] && echo "  NEXT_PUBLIC_VERCEL=$NEXT_PUBLIC_VERCEL"
    echo ""
    echo "These variables will disable Tailwind CDN and cause missing styles!"
    echo ""
    echo "To fix, run:"
    echo "  unset VERCEL"
    echo "  unset NEXT_PUBLIC_VERCEL"
    echo ""
    echo "Also check:"
    echo "  - .env file"
    echo "  - .env.local file"
    echo "  - PM2 ecosystem.config.js"
    echo "  - System environment (printenv | grep VERCEL)"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ No VERCEL variables found - CDN mode will work${NC}"
fi
echo ""

# 2. Очистка старых файлов
echo "🧹 Step 2: Cleaning old build files..."
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✅ Cleaned .next and cache${NC}"
echo ""

# 3. Установка зависимостей
echo "📦 Step 3: Installing dependencies..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
elif command -v npm &> /dev/null; then
    echo "Using npm..."
    npm ci --legacy-peer-deps
else
    echo -e "${RED}❌ ERROR: Neither npm nor pnpm found!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# 4. Сборка приложения
echo "🔨 Step 4: Building application..."
echo "Note: Prebuild script will skip CDN removal (no VERCEL vars)"
npm run build

# Проверка .next директории
if [ ! -d ".next" ]; then
    echo -e "${RED}❌ ERROR: Build failed - .next directory not created!${NC}"
    exit 1
fi

# Проверка next binary
if [ ! -f "node_modules/next/dist/bin/next" ]; then
    echo -e "${RED}❌ ERROR: Next.js binary not found!${NC}"
    echo "Reinstalling dependencies..."
    npm ci --legacy-peer-deps
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"
echo -e "${GREEN}✅ Using 'next start' mode (not standalone)${NC}"
echo ""

# 5. Создание директории для логов
echo "📝 Step 5: Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"
echo ""

# 6. Проверка PM2 конфигурации
echo "🔍 Step 6: Validating PM2 configuration..."
if [ -f "ecosystem.config.js" ]; then
    if grep -q "VERCEL.*:.*['\"]1['\"]" ecosystem.config.js; then
        echo -e "${YELLOW}⚠️  WARNING: ecosystem.config.js contains VERCEL variables!${NC}"
        echo "Please remove VERCEL and NEXT_PUBLIC_VERCEL from env section"
        echo ""
    else
        echo -e "${GREEN}✅ PM2 config looks good${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  WARNING: ecosystem.config.js not found${NC}"
    echo "Creating default configuration..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'familyhub',
    script: '.next/standalone/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    }
  }]
};
EOF
    echo -e "${GREEN}✅ Created ecosystem.config.js${NC}"
fi
echo ""

# 8. Итоговая информация
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "1. Start/restart PM2:"
echo "   pm2 delete familyhub || true"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo ""
echo "2. Check logs:"
echo "   pm2 logs familyhub --lines 50"
echo ""
echo "3. Verify in browser:"
echo "   - Page should load with styles"
echo "   - DevTools Network should show: @tailwindcss/browser@4 from jsdelivr.net"
echo "   - No 'Failed to find Server Action' errors in console"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
