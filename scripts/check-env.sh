#!/bin/bash

# Environment Check Script
# Проверяет, что окружение настроено правильно для CDN режима

echo "🔍 Checking production environment..."
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# 1. Проверка VERCEL переменных
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Environment Variables Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -z "$VERCEL" ]; then
    echo -e "${RED}❌ VERCEL is set to: $VERCEL${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ VERCEL is not set${NC}"
fi

if [ ! -z "$NEXT_PUBLIC_VERCEL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_VERCEL is set to: $NEXT_PUBLIC_VERCEL${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ NEXT_PUBLIC_VERCEL is not set${NC}"
fi

if [ ! -z "$VERCEL_ENV" ]; then
    echo -e "${YELLOW}⚠️  VERCEL_ENV is set to: $VERCEL_ENV${NC}"
    WARNINGS=$((WARNINGS+1))
fi

if [ ! -z "$VERCEL_URL" ]; then
    echo -e "${YELLOW}⚠️  VERCEL_URL is set to: $VERCEL_URL${NC}"
    WARNINGS=$((WARNINGS+1))
fi

echo ""

# 2. Проверка файлов окружения
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Environment Files Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    if grep -q "VERCEL.*=.*1" .env 2>/dev/null; then
        echo -e "${RED}❌ .env contains VERCEL variables${NC}"
        grep "VERCEL" .env
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}✅ .env looks good${NC}"
    fi
else
    echo "ℹ️  .env file not found (OK)"
fi

if [ -f ".env.local" ]; then
    if grep -q "VERCEL.*=.*1" .env.local 2>/dev/null; then
        echo -e "${RED}❌ .env.local contains VERCEL variables${NC}"
        grep "VERCEL" .env.local
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}✅ .env.local looks good${NC}"
    fi
else
    echo "ℹ️  .env.local file not found (OK)"
fi

echo ""

# 3. Проверка PM2 конфигурации
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. PM2 Configuration Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "ecosystem.config.js" ]; then
    if grep -q "VERCEL.*:.*['\"]1['\"]" ecosystem.config.js; then
        echo -e "${RED}❌ ecosystem.config.js contains VERCEL variables${NC}"
        grep -A 2 -B 2 "VERCEL" ecosystem.config.js
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}✅ ecosystem.config.js looks good${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  ecosystem.config.js not found${NC}"
    WARNINGS=$((WARNINGS+1))
fi

echo ""

# 4. Проверка сборки
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Build Files Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".next" ]; then
    echo -e "${GREEN}✅ .next directory exists${NC}"
else
    echo -e "${RED}❌ .next directory not found${NC}"
    echo "   Run: npm run build"
    ERRORS=$((ERRORS+1))
fi

if [ -f "node_modules/next/dist/bin/next" ]; then
    echo -e "${GREEN}✅ Next.js binary exists${NC}"
else
    echo -e "${RED}❌ Next.js binary not found${NC}"
    echo "   Run: npm ci --legacy-peer-deps"
    ERRORS=$((ERRORS+1))
fi

if [ -d ".next/static" ]; then
    echo -e "${GREEN}✅ Static files directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  Static files directory not found${NC}"
    WARNINGS=$((WARNINGS+1))
fi

echo ""

# 5. Проверка PM2 процесса (если запущен)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. PM2 Process Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "familyhub"; then
        echo "ℹ️  PM2 process 'familyhub' is running"
        echo ""
        echo "Environment variables in PM2:"
        pm2 env 0 2>/dev/null | grep -i vercel || echo "  (no VERCEL variables found)"
    else
        echo "ℹ️  PM2 process 'familyhub' is not running"
    fi
else
    echo "ℹ️  PM2 not installed"
fi

echo ""

# Итоги
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Environment is ready for CDN mode.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) found, but should work.${NC}"
    exit 0
else
    echo -e "${RED}❌ ${ERRORS} error(s) found!${NC}"
    echo ""
    echo "To fix VERCEL variable issues:"
    echo "  1. Remove from .env and .env.local files"
    echo "  2. Remove from ecosystem.config.js"
    echo "  3. Run: unset VERCEL && unset NEXT_PUBLIC_VERCEL"
    echo "  4. Rebuild: npm run build"
    echo "  5. Restart PM2: pm2 restart familyhub"
    exit 1
fi
