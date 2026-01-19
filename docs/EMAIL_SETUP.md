# Email Setup with Sendune

This document explains how to set up and use Sendune for transactional emails in Adiology.

## Prerequisites

1. **Sendune Account**: Log in at [app.sendune.com](https://app.sendune.com)
2. **Sendune API Key**: Get your API key from Settings
3. **Email Templates**: Create templates in Sendune dashboard with replace tags

## Environment Variables

Add the following environment variable to your Replit secrets:

```bash
SENDUNE_API_KEY=your-sendune-api-key
```

## API Endpoint

### Send Email

**Endpoint:** `POST /api/admin/email/send`

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Your Email Subject",
  "templateKey": "optional-template-specific-key",
  "replaceTags": {
    "name": "John Doe",
    "reset-link": "https://adiology.io/reset/abc123"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## How Sendune Works

Sendune uses template-based email sending:

1. **Create Template**: Design your email template in Sendune dashboard
2. **Add Replace Tags**: Use `{{tag-name}}` syntax for dynamic content
3. **Get Template Key**: Each template has a unique API key
4. **Send Email**: Call the API with recipient, subject, and replace tag values

### Replace Tag Syntax

- Standard tags: `{{tag-name}}` - replaced with your API values
- Name tag: `[[name]]` - auto-filled from contact database

### Example Template

```html
Hi {{customer-name}},

Your password reset link: {{reset-link}}

This link expires in {{expiry-time}}.

Best,
Adiology Team
```

### Send with API

```json
{
  "to": "customer@example.com",
  "subject": "Password Reset Request",
  "replaceTags": {
    "customer-name": "John",
    "reset-link": "https://adiology.io/reset/abc123",
    "expiry-time": "24 hours"
  }
}
```

## Email Logs

All sent emails are logged in the `email_logs` table with:
- Recipient email
- Subject
- Status (sent/failed)
- Timestamp

View logs in Super Admin Panel under Email Management.

## Sendune Dashboard

Access your Sendune account:
- URL: https://app.sendune.com
- Manage templates, view analytics, configure settings
