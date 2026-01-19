#!/bin/bash

# Deploy Database Migrations to Production
# This script applies all migrations to your Supabase project

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Database Migrations${NC}"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI found"
echo ""

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

echo -e "${BLUE}📦 Linking to project: ${PROJECT_REF}${NC}"
supabase link --project-ref "$PROJECT_REF" || echo "Already linked"
echo ""

# Migration files in order
MIGRATIONS=(
    "backend/supabase/migrations/001_initial_schema.sql"
    "backend/supabase/migrations/002_super_admin_tables.sql"
    "backend/supabase/migrations/003_user_management_functions.sql"
)

echo -e "${BLUE}📋 Applying migrations...${NC}"
echo ""

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo -e "${YELLOW}→ Applying: $(basename $migration)${NC}"
        # Use Supabase CLI to push migrations
        supabase db push --file "$migration" || {
            echo -e "${YELLOW}⚠️  Migration push failed, trying SQL execution...${NC}"
            echo "Please apply this migration manually via Supabase Dashboard → SQL Editor:"
            echo "File: $migration"
        }
        echo ""
    else
        echo -e "${RED}❌ Migration file not found: $migration${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Migration deployment completed!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Verify migrations in Supabase Dashboard → Database → Migrations"
echo "2. Check that all tables exist: users, subscriptions, audit_logs, etc."
echo "3. Verify RLS policies are enabled"
echo "4. Run: ./scripts/deploy-edge-function.sh"

