#!/bin/bash

# Pre-Deploy Check Script
# Validates the codebase before deployment to prevent blank pages in production

set -e  # Exit on error

echo "🔍 Running pre-deploy checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. TypeScript check
echo ""
echo "1️⃣ Checking TypeScript..."
if npx tsc --noEmit 2>&1; then
  echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
  echo -e "${RED}❌ TypeScript errors found${NC}"
  exit 1
fi

# 2. Build test
echo ""
echo "2️⃣ Testing build..."
if npm run build 2>&1; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

# 3. Check build output exists
echo ""
echo "3️⃣ Verifying build output..."
if [ -d "dist" ] || [ -d "build" ]; then
  echo -e "${GREEN}✅ Build output directory found${NC}"
else
  echo -e "${RED}❌ Build output missing${NC}"
  exit 1
fi

# 4. Check for console.logs (warning only)
echo ""
echo "4️⃣ Checking for console.logs (warnings only)..."
CONSOLE_LOGS=$(grep -r "console\.log" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "// eslint-disable" | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: Found $CONSOLE_LOGS console.log statements${NC}"
  echo "   Consider removing them before production deployment"
else
  echo -e "${GREEN}✅ No console.logs found${NC}"
fi

# 5. Check for ErrorBoundary usage
echo ""
echo "5️⃣ Checking ErrorBoundary implementation..."
if grep -q "ErrorBoundary" src/main.tsx 2>/dev/null; then
  echo -e "${GREEN}✅ ErrorBoundary found in main.tsx${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: ErrorBoundary not found in main.tsx${NC}"
fi

# 6. Check for environment variable validation
echo ""
echo "6️⃣ Checking environment variable validation..."
if grep -q "validateEnvironment\|checkRequiredEnvVars" src/main.tsx 2>/dev/null; then
  echo -e "${GREEN}✅ Environment validation found${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: Environment validation not found${NC}"
fi

# 7. Check index.html has fallback content
echo ""
echo "7️⃣ Checking index.html fallback content..."
if grep -q "app-loading\|noscript" index.html 2>/dev/null; then
  echo -e "${GREEN}✅ Fallback content found in index.html${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: Fallback content not found in index.html${NC}"
fi

echo ""
echo -e "${GREEN}✅ All checks passed - safe to deploy!${NC}"
echo ""

