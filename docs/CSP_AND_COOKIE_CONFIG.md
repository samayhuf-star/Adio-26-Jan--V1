# Content Security Policy & Cookie Configuration

## CSP Updates for Vercel Live

The Content Security Policy has been updated to allow Vercel Live scripts:

### Updated Directives:
- **script-src**: Added `https://vercel.live`
- **script-src-elem**: Added `https://vercel.live` (for script elements)
- **connect-src**: Added `https://vercel.live` (for WebSocket connections)

### Files Updated:
1. `index.html` - Meta tag CSP
2. `vercel.json` - Header CSP

---

## SameSite Cookie Issue

### Problem:
The console shows: `Cookie "dd_cookie_test_..." has been rejected because it is in a cross-site context and its "SameSite" is "Lax" or "Strict"`.

### Solution:
This is typically from Datadog or another analytics/monitoring service. The cookie needs to be set with `SameSite=None; Secure` for cross-site contexts.

### Implementation Options:

#### Option 1: Backend/Server Configuration
If you're setting cookies on the backend (Supabase Edge Functions, API routes), update the Set-Cookie header:

```javascript
// Example for Supabase Edge Function
const cookieValue = `dd_cookie_test_${id}=${value}; Path=/; Domain=${domain}; SameSite=None; Secure; HttpOnly`;
response.headers.set('Set-Cookie', cookieValue);
```

#### Option 2: Vercel Headers (if using Vercel)
Add to `vercel.json` headers configuration:

```json
{
  "key": "Set-Cookie",
  "value": "dd_cookie_test_<id>=<value>; Path=/; Domain=yourdomain.com; SameSite=None; Secure; HttpOnly"
}
```

#### Option 3: Remove/Disable the Cookie
If the cookie isn't needed, disable the service that's setting it (e.g., Datadog RUM).

### Important Notes:
- `SameSite=None` **requires** `Secure` flag (HTTPS only)
- `HttpOnly` prevents JavaScript access (good for security)
- Domain should match your actual domain
- This is a **backend/server configuration**, not a frontend CSP issue

---

## Current CSP Configuration

### script-src
- `'self'` - Same origin scripts
- `'unsafe-eval'` - Required for some libraries
- `https://js.stripe.com` - Stripe payments
- `https://vercel.live` - Vercel Live preview

### script-src-elem
- Same as script-src (for script elements specifically)

### connect-src
- `'self'` - Same origin connections
- `*.stripe.com` - Stripe API
- `https://*.supabase.co` - Supabase API
- `https://googleads.googleapis.com` - Google Ads API
- `https://generativelanguage.googleapis.com` - Google AI API
- `https://vercel.live` - Vercel Live WebSocket

### frame-src
- `'self'` - Same origin frames
- `*.stripe.com` - Stripe checkout iframes

### style-src
- `'self'` - Same origin styles
- `'unsafe-inline'` - Inline styles (required for many frameworks)

---

## Testing CSP

### Browser Console
Check for CSP violations in the browser console. Look for messages like:
```
Content Security Policy: The page's settings blocked the loading of a resource at...
```

### Report URI (Optional)
To monitor CSP violations, add `report-uri` or `report-to`:

```html
<meta http-equiv="Content-Security-Policy" 
  content="...; report-uri /csp-report-endpoint; report-to csp-endpoint;" />
```

### Vercel Live Testing
After deployment, test Vercel Live preview to ensure scripts load correctly.

---

## Troubleshooting

### Vercel Live Still Blocked
1. Clear browser cache
2. Check browser console for exact blocked resource
3. Verify CSP is being applied (check response headers)
4. Ensure `https://vercel.live` is in both `script-src` and `script-src-elem`

### Cookie Still Rejected
1. Verify cookie is being set with `SameSite=None; Secure`
2. Check that site is served over HTTPS
3. Verify domain matches exactly
4. Check if cookie is needed - consider disabling the service

---

## References
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [Vercel Live Documentation](https://vercel.com/docs/workflow-collaboration/vercel-live)

