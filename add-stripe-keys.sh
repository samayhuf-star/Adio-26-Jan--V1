#!/bin/bash

# Script to add Stripe keys to Vercel
# Note: Vercel CLI doesn't support adding env vars directly via command line
# This script provides the values to add manually

echo "🔑 Stripe Keys to Add to Vercel"
echo "================================"
echo ""
echo "Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
echo ""
echo "Add these variables:"
echo ""
echo "1. VITE_STRIPE_PUBLISHABLE_KEY"
echo "   Value: pk_test_51St5NlCX7k7i9k8w0abKGjlHj0m0HjuDtDcr74TcDGoww2ilQrcqK8Tao0mB2eq5VdFBSukrwXzow9EVROZztFEV00TXQgk0gC"
echo "   Environments: ✅ Production, ✅ Preview, ✅ Development"
echo ""
echo "2. STRIPE_PUBLISHABLE_KEY"
echo "   Value: pk_test_51St5NlCX7k7i9k8w0abKGjlHj0m0HjuDtDcr74TcDGoww2ilQrcqK8Tao0mB2eq5VdFBSukrwXzow9EVROZztFEV00TXQgk0gC"
echo "   Environments: ✅ Production, ✅ Preview, ✅ Development"
echo ""
echo "3. STRIPE_SECRET_KEY"
echo "   Value: sk_test_51St5NlCX7k7i9k8wk0IJpG5SQVYUequnjHprwRZhb5NMmoLGC14IZjtPibjvhv10R4Wm6N1UpezKfMtqUe8qkXX00szZGlhQr"
echo "   Environments: ✅ Production, ✅ Preview, ✅ Development"
echo ""
echo "After adding, redeploy the app!"
