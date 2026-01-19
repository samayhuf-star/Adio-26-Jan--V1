#!/bin/bash

# Deploy Edge Function to Production
# This script deploys the superadmin backend API to Supabase Edge Functions

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Edge Function${NC}"
echo "=============================="
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

# Check if edge function file exists
EDGE_FUNCTION_FILE="backend/supabase-functions/server/index.tsx"

if [ ! -f "$EDGE_FUNCTION_FILE" ]; then
    echo -e "${RED}❌ Edge function file not found: $EDGE_FUNCTION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Edge function file found"
echo ""

# Check environment variables
echo -e "${BLUE}🔐 Checking environment variables...${NC}"

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

# Check for required environment variables
echo -e "${YELLOW}⚠️  Make sure these environment variables are set in Supabase Dashboard:${NC}"
echo "   - SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
echo "   - SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>"
echo "   - GEMINI_API_KEY=<your_gemini_key>"
echo ""
read -p "Have you set the environment variables? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${YELLOW}⚠️  Please set environment variables in Supabase Dashboard → Edge Functions → Settings${NC}"
    echo "Then run this script again."
    exit 1
fi

# Deploy the edge function
FUNCTION_NAME="make-server-6757d0ca"

echo ""
echo -e "${BLUE}📤 Deploying function: ${FUNCTION_NAME}${NC}"

# Create function directory structure if needed
mkdir -p supabase/functions/$FUNCTION_NAME

# Copy the edge function file
cp "$EDGE_FUNCTION_FILE" "supabase/functions/$FUNCTION_NAME/index.tsx"

# Copy kv_store.tsx if it exists
KV_STORE_FILE="backend/supabase-functions/server/kv_store.tsx"
if [ -f "$KV_STORE_FILE" ]; then
    cp "$KV_STORE_FILE" "supabase/functions/$FUNCTION_NAME/kv_store.tsx"
    echo -e "${GREEN}✓${NC} KV store file copied"
fi

# Deploy using Supabase CLI
if supabase functions deploy "$FUNCTION_NAME" --no-verify-jwt; then
    echo ""
    echo -e "${GREEN}✅ Edge function deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}🔗 Function URL:${NC}"
    echo "https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"
    echo ""
    echo -e "${BLUE}🧪 Test the deployment:${NC}"
    echo "curl https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}/health"
    echo ""
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "1. Test the health endpoint"
    echo "2. Create a superadmin user: ./scripts/create-superadmin.sh"
    echo "3. Test admin endpoints with authentication"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo -e "${YELLOW}Alternative: Deploy via Supabase Dashboard${NC}"
    echo "1. Go to Supabase Dashboard → Edge Functions"
    echo "2. Create/Update function: ${FUNCTION_NAME}"
    echo "3. Copy code from: $EDGE_FUNCTION_FILE"
    echo "4. Set environment variables"
    echo "5. Deploy"
    exit 1
fi

