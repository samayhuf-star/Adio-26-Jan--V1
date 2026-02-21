# 🚀 Production Deployment Guide

## Quick Start

### 1. Environment Variables Setup

Add these to Vercel Dashboard → Settings → Environment Variables:

```bash
# Required for Payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Required for Keyword Generation (AI Fallback)
VITE_GEMINI_API_KEY=AIzaSyBYyBnc99JTLGvUY3qdGFksUlf7roGUdao

# Optional - Google Ads API (has AI fallback)
GOOGLE_ADS_API_TOKEN=UzifgEs9SwOBo5bP_vmi2A

# Optional - Error Tracking
VITE_SENTRY_DSN=...

# Optional - Analytics
VITE_ANALYTICS_ID=...
```

### 2. Stripe Configuration

1. **Create Stripe Account**: https://stripe.com
2. **Get API Keys**: Dashboard → Developers → API keys
3. **Create Products**:
   - Lifetime Limited: $99.99 (one-time payment)
   - Lifetime Unlimited: $199 (one-time payment)
   - Monthly Limited: $49.99/month (subscription)
   - Monthly Unlimited: $99.99/month (subscription)
4. **Get Price IDs**: Copy Price IDs from Stripe Dashboard
5. **Update Code**: Edit `src/utils/stripe.ts` and replace placeholder Price IDs:
   ```typescript
   export const PLAN_PRICE_IDS = {
     lifetime_limited: 'price_xxxxx', // Your actual Price ID
     lifetime_unlimited: 'price_xxxxx',
     monthly_25: 'price_xxxxx',
     monthly_unlimited: 'price_xxxxx',
   };
   ```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 4. Backend API Setup (Optional but Recommended)

The app works with fallbacks, but for full functionality, set up backend endpoints:

#### Option A: Use Supabase Edge Functions

1. Deploy edge function: `backend/supabase-functions/server/index.tsx`
2. Configure routes in Supabase Dashboard
3. Update API base URL if needed

#### Option B: Use Separate Backend Server

Create these endpoints:
- `POST /api/create-checkout-session` - Stripe checkout
- `POST /api/create-portal-session` - Stripe portal
- `POST /api/webhooks/stripe` - Stripe webhooks

See `docs/STRIPE_SETUP.md` for implementation details.

### 5. Domain Configuration

1. Add custom domain in Vercel Dashboard
2. Configure DNS records as instructed
3. SSL certificate is automatic

### 6. Verify Deployment

Test these critical flows:
- [ ] User signup
- [ ] User login
- [ ] Keyword generation
- [ ] Campaign builder
- [ ] CSV export
- [ ] Payment flow (if backend ready)

## Production Checklist

### Pre-Launch

- [x] Environment variables configured
- [ ] Stripe account set up
- [ ] Stripe Price IDs updated in code
- [ ] Backend endpoints deployed (optional)
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)
- [ ] All features tested
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility checked

### Post-Launch

- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Verify payment processing
- [ ] Test user signup flow
- [ ] Monitor API performance
- [ ] Set up alerts for critical errors

## Troubleshooting

### Payment Issues

**Problem**: Stripe checkout not working
**Solution**: 
1. Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
2. Check Stripe Price IDs are correct
3. Ensure backend endpoint `/api/create-checkout-session` exists

### Keyword Generation Issues

**Problem**: Keywords not generating
**Solution**:
1. Check `VITE_GEMINI_API_KEY` is set
2. Verify API quota not exceeded
3. Check browser console for errors
4. App will fallback to local generation if APIs fail

### API Errors

**Problem**: API calls failing
**Solution**:
1. Most features have fallbacks
2. Check network connectivity
3. Verify Supabase configuration
4. Check browser console for detailed errors

## Support

- Email: support@adiology.io
- Contact: contact@adiology.io
- Address: Sheridan, Wyoming USA 82801

## Monitoring

Consider setting up:
- **Error Tracking**: Sentry, LogRocket
- **Analytics**: Google Analytics, Plausible
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance**: Vercel Analytics (built-in)

## Security

- ✅ HTTPS enforced (Vercel default)
- ✅ Security headers configured
- ✅ XSS protection enabled
- ✅ Content validation
- ⚠️ Add rate limiting (backend)
- ⚠️ Add CSRF protection (backend)

## Performance

- ✅ Code splitting enabled
- ✅ Asset optimization enabled
- ✅ Lazy loading implemented
- ✅ CDN enabled (Vercel)

## Next Steps

1. Set up Stripe backend endpoints
2. Configure monitoring
3. Set up analytics
4. Test all features
5. Launch! 🎉

