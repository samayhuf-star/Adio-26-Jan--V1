# Nhost Admin Secret Configuration

## ⚠️ Security Notice

**NEVER commit admin secrets to git!** Always use environment variables.

## Setting Up Nhost Admin Secret

### For Local Development

Create a `.env` file in the project root (already in `.gitignore`):

```bash
NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
NHOST_REGION=eu-central-1
NHOST_ADMIN_SECRET={{ secrets.HASURA_GRAPHQL_ADMIN_SECRET }}
ADMIN_SECRET_KEY={{ secrets.HASURA_GRAPHQL_ADMIN_SECRET }}
```

**Note:** Replace `{{ secrets.HASURA_GRAPHQL_ADMIN_SECRET }}` with your actual admin secret from Nhost dashboard.

### For Vercel Production Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
NHOST_SUBDOMAIN=vumnjkoyxkistmlzotuk
NHOST_REGION=eu-central-1
NHOST_ADMIN_SECRET=your-actual-admin-secret
ADMIN_SECRET_KEY=your-actual-admin-secret
```

4. Select **Production**, **Preview**, and **Development** environments
5. Click **Save**

### Nhost Service URLs

Based on your configuration:
- **GraphQL URL**: `https://vumnjkoyxkistmlzotuk.graphql.eu-central-1.nhost.run/v1`
- **Auth URL**: `https://vumnjkoyxkistmlzotuk.auth.eu-central-1.nhost.run/v1`
- **Hasura Console**: `https://vumnjkoyxkistmlzotuk.hasura.eu-central-1.nhost.run/console`

### Usage in Code

The admin secret is used for server-to-server authentication:

```typescript
// In server/index.ts
if (adminKey && process.env.ADMIN_SECRET_KEY && adminKey === process.env.ADMIN_SECRET_KEY) {
  // Authenticated
}
```

### Security Best Practices

- ✅ Store secrets in environment variables only
- ✅ Never commit secrets to git
- ✅ Use different secrets for development and production
- ✅ Rotate secrets regularly
- ✅ Restrict access to environment variables

## Verification

After setting up, verify the secret is working:

```bash
curl -H "X-Admin-Key: T#R9hd%p3QR3sRG)p^uy*%m'*BIv)DUx" \
  https://your-api-url.com/api/admin/health
```
