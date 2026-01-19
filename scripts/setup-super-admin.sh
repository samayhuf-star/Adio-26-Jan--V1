#!/bin/bash

# Super Admin Backend Setup Script
# This script helps set up the Super Admin backend infrastructure

set -e

echo "🚀 Super Admin Backend Setup"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

echo -e "${GREEN}✓${NC} Supabase CLI found"
echo ""

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase. Please login:${NC}"
    supabase login
fi

echo -e "${GREEN}✓${NC} Supabase authentication verified"
echo ""

# Prompt for project reference
read -p "Enter your Supabase project reference (or press Enter to skip): " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}⚠️  Skipping project linking. You can do this manually later.${NC}"
else
    echo "Linking to project: $PROJECT_REF"
    supabase link --project-ref "$PROJECT_REF"
    echo -e "${GREEN}✓${NC} Project linked"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Run database migration:"
echo "   - Go to Supabase Dashboard → SQL Editor"
echo "   - Copy contents of: backend/supabase/migrations/001_initial_schema.sql"
echo "   - Paste and Run"
echo ""
echo "2. Set environment variables in Supabase Dashboard:"
echo "   - Go to Edge Functions → Settings"
echo "   - Add: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY"
echo ""
echo "3. Deploy Edge Function:"
echo "   supabase functions deploy make-server-6757d0ca"
echo ""
echo "4. Create super admin user:"
echo "   - Create user in Supabase Auth"
echo "   - Update users table: UPDATE users SET role = 'superadmin' WHERE email = 'your-email'"
echo ""
echo -e "${GREEN}✅ Setup script completed!${NC}"

