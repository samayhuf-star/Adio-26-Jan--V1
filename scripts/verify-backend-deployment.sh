#!/bin/bash

# Script to verify if backend edge function is deployed
# Usage: ./scripts/verify-backend-deployment.sh

PROJECT_ID="kkdnnrwhzofttzajnwlj"
API_BASE="https://${PROJECT_ID}.supabase.co/functions/v1/make-server-6757d0ca"

echo "🔍 Verifying Backend Deployment Status..."
echo "=========================================="
echo ""

# Check health endpoint
echo "1. Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
  echo "   ✅ Health endpoint: OK (200)"
else
  echo "   ❌ Health endpoint: Failed ($HEALTH_RESPONSE)"
fi
echo ""

# Check history/save endpoint
echo "2. Checking history/save endpoint..."
HISTORY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_BASE}/history/save" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep -o 'publicAnonKey = "[^"]*"' src/utils/supabase/info.tsx | cut -d'"' -f2)" \
  -d '{"type":"test","name":"test","data":{}}')
if [ "$HISTORY_RESPONSE" = "200" ] || [ "$HISTORY_RESPONSE" = "201" ]; then
  echo "   ✅ History/save endpoint: OK ($HISTORY_RESPONSE)"
else
  echo "   ❌ History/save endpoint: Failed ($HISTORY_RESPONSE)"
  echo "      This is expected if the edge function is not deployed"
fi
echo ""

# Check generate-keywords endpoint
echo "3. Checking generate-keywords endpoint..."
KEYWORDS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_BASE}/generate-keywords" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep -o 'publicAnonKey = "[^"]*"' src/utils/supabase/info.tsx | cut -d'"' -f2)" \
  -d '{"seeds":"test keyword"}')
if [ "$KEYWORDS_RESPONSE" = "200" ] || [ "$KEYWORDS_RESPONSE" = "400" ]; then
  echo "   ✅ Generate-keywords endpoint: OK ($KEYWORDS_RESPONSE)"
else
  echo "   ❌ Generate-keywords endpoint: Failed ($KEYWORDS_RESPONSE)"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary:"
if [ "$HEALTH_RESPONSE" = "200" ]; then
  echo "✅ Backend edge function is DEPLOYED"
  echo "   Campaigns will be saved via edge function"
else
  echo "⚠️  Backend edge function is NOT DEPLOYED"
  echo "   Campaigns will be saved directly to database (if table exists)"
  echo "   or fallback to localStorage"
fi
echo ""
echo "To deploy the edge function, run:"
echo "  supabase functions deploy make-server-6757d0ca"

