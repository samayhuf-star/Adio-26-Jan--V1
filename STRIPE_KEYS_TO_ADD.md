# 🔑 Stripe Keys - Add to Vercel

## Quick Steps

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: **adiology-27-dec-kiro**

2. **Navigate to Environment Variables:**
   - Click **Settings** → **Environment Variables**

3. **Add These 3 Variables:**

### Variable 1: VITE_STRIPE_PUBLISHABLE_KEY
- **Key:** `VITE_STRIPE_PUBLISHABLE_KEY`
- **Value:** `pk_test_51St5NlCX7k7i9k8w0abKGjlHj0m0HjuDtDcr74TcDGoww2ilQrcqK8Tao0mB2eq5VdFBSukrwXzow9EVROZztFEV00TXQgk0gC`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

### Variable 2: STRIPE_PUBLISHABLE_KEY
- **Key:** `STRIPE_PUBLISHABLE_KEY`
- **Value:** `pk_test_51St5NlCX7k7i9k8w0abKGjlHj0m0HjuDtDcr74TcDGoww2ilQrcqK8Tao0mB2eq5VdFBSukrwXzow9EVROZztFEV00TXQgk0gC`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

### Variable 3: STRIPE_SECRET_KEY
- **Key:** `STRIPE_SECRET_KEY`
- **Value:** `sk_test_51St5NlCX7k7i9k8wk0IJpG5SQVYUequnjHprwRZhb5NMmoLGC14IZjtPibjvhv10R4Wm6N1UpezKfMtqUe8qkXX00szZGlhQr`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

4. **After Adding All Variables:**
   - Redeploy the app (Deployments → Latest → ⋯ → Redeploy)

## Notes

- These are **test keys** (pk_test_ and sk_test_)
- For production, you'll need to switch to **live keys** (pk_live_ and sk_live_)
- The `VITE_` prefix is required for client-side code (browser)
- The non-prefixed versions are for server-side code
