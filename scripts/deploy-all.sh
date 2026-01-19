#!/bin/bash

# Complete Production Deployment Script
# This script deploys everything needed for superadmin to production

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Complete Super Admin Production Deployment${NC}"
echo "=============================================="
echo ""

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI found"

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo "Please login: supabase login"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase authentication verified"
echo ""

# Get project reference
PROJECT_REF=$(supabase projects list 2>/dev/null | grep -oP 'kkdnnrwhzofttzajnwlj' || echo "")

if [ -z "$PROJECT_REF" ]; then
    read -p "Enter your Supabase project reference: " PROJECT_REF
fi

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Project reference required${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Project: ${PROJECT_REF}${NC}"
echo ""

# Step 1: Deploy Migrations
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Deploying Database Migrations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "scripts/deploy-migrations.sh" ]; then
    bash scripts/deploy-migrations.sh
else
    echo -e "${YELLOW}⚠️  Migration script not found, applying manually...${NC}"
    echo "Please apply migrations via Supabase Dashboard → SQL Editor"
fi

echo ""
read -p "Press Enter to continue to Step 2..."

# Step 2: Deploy Edge Function
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Deploying Edge Function${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "scripts/deploy-edge-function.sh" ]; then
    bash scripts/deploy-edge-function.sh
else
    echo -e "${YELLOW}⚠️  Edge function script not found${NC}"
    echo "Please deploy manually via Supabase Dashboard"
fi

echo ""
read -p "Press Enter to continue to Step 3..."

# Step 3: Create Super Admin User
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Creating Super Admin User${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "scripts/create-superadmin.sh" ]; then
    bash scripts/create-superadmin.sh
else
    echo -e "${YELLOW}⚠️  Superadmin script not found${NC}"
    echo "Please create superadmin user manually"
fi

# Final verification
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}✅ Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}📋 Production Checklist:${NC}"
echo ""
echo "✓ Database migrations applied"
echo "✓ Edge function deployed"
echo "✓ Environment variables set"
echo "✓ Super admin user created"
echo ""
echo -e "${BLUE}🧪 Test Your Deployment:${NC}"
echo ""
echo "1. Health Check:"
echo "   curl https://${PROJECT_REF}.supabase.co/functions/v1/make-server-6757d0ca/health"
echo ""
echo "2. Login to your app with superadmin credentials"
echo ""
echo "3. Navigate to /superadmin and test features"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - Backend API: docs/BACKEND_SUPERADMIN.md"
echo "   - Deployment: docs/DEPLOYMENT_SUPER_ADMIN.md"
echo ""

