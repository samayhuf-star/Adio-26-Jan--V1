# Discourse Self-Hosted Setup Guide for Adiology

This guide walks you through setting up a self-hosted Discourse forum that integrates with Adiology via SSO.

## Prerequisites

- A VPS with at least 2GB RAM (4GB recommended)
- Ubuntu 22.04 LTS
- A domain pointing to your server (e.g., `community.adiology.io`)
- SMTP credentials for email delivery

## Step 1: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
```

## Step 2: Clone Discourse Docker

```bash
sudo -s
git clone https://github.com/discourse/discourse_docker.git /var/discourse
cd /var/discourse
```

## Step 3: Configure Discourse

```bash
./discourse-setup
```

You'll be prompted for:
- **Hostname**: `community.adiology.io`
- **Email**: Your admin email
- **SMTP server**: Your SMTP host (e.g., `smtp.resend.com`)
- **SMTP port**: Usually `587`
- **SMTP username**: Your SMTP username
- **SMTP password**: Your SMTP password

## Step 4: Enable SSO in Discourse Admin

After installation, access your Discourse admin panel:

1. Go to `https://community.adiology.io/admin/site_settings`
2. Search for "SSO" and configure:

```
enable_discourse_connect: true
discourse_connect_url: https://adiology.io/api/community/sso
discourse_connect_secret: [Generate a random 64-character string]
discourse_connect_overrides_email: true
discourse_connect_overrides_username: true
discourse_connect_overrides_name: true
logout_redirect: https://adiology.io
```

## Step 5: Generate API Key

1. Go to `https://community.adiology.io/admin/api/keys`
2. Click "New API Key"
3. Set:
   - **Description**: "Adiology Integration"
   - **User Level**: "All Users"
   - **Scope**: Global (all endpoints)
4. Copy the generated key

## Step 6: Configure Adiology Environment

Add these to your Replit secrets:

```env
DISCOURSE_URL=https://community.adiology.io
DISCOURSE_API_KEY=your_api_key_here
DISCOURSE_SSO_SECRET=your_sso_secret_here
DISCOURSE_CATEGORY_ID=5  # Optional: default category for new posts
```

## Step 7: CORS Configuration (Optional)

If you need to embed Discourse or make client-side API calls:

1. Go to Admin > Settings > Security
2. Add `https://adiology.io` to "cors origins"

## API Endpoints Used

The Adiology integration uses these Discourse API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/latest.json` | GET | Fetch latest topics |
| `/posts.json` | POST | Create new post |
| `/t/{id}.json` | GET | Get topic details |
| `/session/sso_provider` | GET | SSO authentication |

## Troubleshooting

### SSO Not Working
- Verify the SSO secret matches in both Discourse and Adiology
- Check that the SSO URL is accessible
- Ensure HTTPS is properly configured

### API Errors
- Verify API key has correct permissions
- Check rate limits (default: 60 requests/minute)
- Ensure category ID exists

### Email Not Sending
- Verify SMTP credentials
- Check Discourse logs: `./launcher logs app`

## Maintenance

```bash
# Rebuild container after config changes
cd /var/discourse
./launcher rebuild app

# View logs
./launcher logs app

# Backup
./launcher backup app

# Update Discourse
git pull
./launcher rebuild app
```

## Support

For Discourse-specific issues, see:
- [Discourse Meta](https://meta.discourse.org)
- [Discourse Docs](https://docs.discourse.org)
