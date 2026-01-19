#!/bin/bash

# Create Super Admin User
# This script helps create a superadmin user in production

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}👤 Create Super Admin User${NC}"
echo "=============================="
echo ""

# Get user input
read -p "Enter admin email: " ADMIN_EMAIL
read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""
read -p "Enter admin full name (optional): " ADMIN_NAME

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}❌ Email and password are required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Creating user...${NC}"
echo ""

# SQL script to create superadmin
SQL_SCRIPT=$(cat <<EOF
-- Step 1: Create user in Supabase Auth (do this via Dashboard or Auth API)
-- Step 2: Update users table to set role as superadmin

-- After creating the user in Supabase Auth, run:
UPDATE users 
SET role = 'superadmin',
    subscription_plan = 'enterprise',
    subscription_status = 'active'
WHERE email = '${ADMIN_EMAIL}';

-- Verify the update
SELECT id, email, role, subscription_plan, subscription_status 
FROM users 
WHERE email = '${ADMIN_EMAIL}';
EOF
)

echo -e "${YELLOW}📝 SQL Script to run:${NC}"
echo "=================================="
echo "$SQL_SCRIPT"
echo "=================================="
echo ""

echo -e "${BLUE}📋 Instructions:${NC}"
echo ""
echo "1. Create the user in Supabase Dashboard → Authentication → Users"
echo "   - Email: ${ADMIN_EMAIL}"
echo "   - Password: ${ADMIN_PASSWORD}"
echo "   - Auto-confirm: Yes"
echo ""
echo "2. Run the SQL script above in Supabase Dashboard → SQL Editor"
echo ""
echo "3. Verify the user has superadmin role"
echo ""

# Option to use Supabase CLI if available
if command -v supabase &> /dev/null; then
    read -p "Do you want to run this via Supabase CLI? (y/n): " USE_CLI
    
    if [ "$USE_CLI" = "y" ] || [ "$USE_CLI" = "Y" ]; then
        echo ""
        echo -e "${BLUE}Using Supabase CLI...${NC}"
        
        # Create a temporary SQL file
        TEMP_SQL=$(mktemp)
        echo "$SQL_SCRIPT" > "$TEMP_SQL"
        
        # Note: This requires the user to be created in Auth first
        echo -e "${YELLOW}⚠️  Note: You must create the user in Supabase Auth first${NC}"
        echo "Then run: supabase db execute --file $TEMP_SQL"
        echo ""
        echo "Or manually execute the SQL in Supabase Dashboard → SQL Editor"
    fi
fi

echo ""
echo -e "${GREEN}✅ Setup instructions provided!${NC}"
echo ""
echo -e "${BLUE}🧪 Test the superadmin access:${NC}"
echo "1. Login to your app with: ${ADMIN_EMAIL}"
echo "2. Navigate to /superadmin"
echo "3. Verify you can access admin endpoints"

