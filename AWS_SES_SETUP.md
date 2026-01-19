# AWS SES Email Setup Guide for Adiology

This guide will help you configure AWS SES (Simple Email Service) to replace Supabase email functionality with your verified domain `adiology.online`.

## Prerequisites

✅ **Already Completed:**
- AWS Account with SES access
- Domain `adiology.online` verified in AWS SES
- Login credentials: `samay@adiology.io`

## 1. AWS SES Configuration

### Verify Domain Status
1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Navigate to **Configuration** > **Verified identities**
3. Confirm `adiology.online` shows as **Verified** ✅

### Check Sending Limits
1. In SES Console, go to **Account dashboard**
2. Check your current limits:
   - **Sending quota**: Number of emails per 24 hours
   - **Sending rate**: Emails per second
   - **Sandbox status**: Should be **Production** for live sending

### Request Production Access (if needed)
If still in sandbox mode:
1. Go to **Account dashboard** > **Request production access**
2. Fill out the form with:
   - **Use case**: Transactional emails for SaaS application
   - **Website URL**: https://adiology.online
   - **Description**: Authentication emails, password resets, notifications for Google Ads campaign builder

## 2. Create IAM User for Email Service

### Create IAM User
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** > **Create user**
3. User name: `adiology-email-service`
4. Select **Programmatic access**

### Attach SES Policy
1. Click **Attach policies directly**
2. Search for `AmazonSESFullAccess` or create custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail",
                "ses:GetSendQuota",
                "ses:GetSendStatistics"
            ],
            "Resource": "*"
        }
    ]
}
```

### Get Access Keys
1. After creating user, go to **Security credentials**
2. Click **Create access key**
3. Choose **Application running outside AWS**
4. **Save the Access Key ID and Secret Access Key** 🔐

## 3. Environment Configuration

### Backend Environment Variables
Create/update `.env` file in the `backend/` directory:

```bash
# AWS SES Configuration
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_REGION=us-east-1

# Flask Configuration
FLASK_ENV=production
PORT=5001
```

### Frontend Environment Variables
Update your frontend `.env` file:

```bash
# Email API Configuration
VITE_EMAIL_API_URL=http://localhost:5001

# For production deployment
# VITE_EMAIL_API_URL=https://your-email-api-domain.com
```

## 4. Start Email Service

### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Start Email API Server
```bash
cd backend
./start_email_api.sh
```

Or manually:
```bash
cd backend
python email_api.py
```

### Verify Service is Running
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "email-api",
  "ses_configured": true
}
```

## 5. Test Email Functionality

### Test Verification Email
```bash
curl -X POST http://localhost:5001/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "verification_link": "https://adiology.online/verify?token=test123",
    "user_name": "Test User"
  }'
```

### Test Password Reset Email
```bash
curl -X POST http://localhost:5001/send-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "reset_link": "https://adiology.online/reset?token=test123",
    "user_name": "Test User"
  }'
```

## 6. Production Deployment

### Deploy Email API
You can deploy the email API to:
- **AWS Lambda** (recommended for cost efficiency)
- **AWS ECS/Fargate**
- **Railway/Render** (simple deployment)
- **Your existing server**

### Update Frontend Configuration
Update `VITE_EMAIL_API_URL` to point to your production email API:

```bash
# Production
VITE_EMAIL_API_URL=https://email-api.adiology.online
```

### DNS Configuration (Optional)
Create a subdomain for your email API:
1. Go to your DNS provider
2. Add CNAME record: `email-api.adiology.online` → your-server-domain

## 7. Email Templates

The service includes pre-built templates for:

### ✅ Verification Email
- **From**: `Adiology <noreply@adiology.online>`
- **Subject**: "Verify your Adiology account"
- **Includes**: Branded HTML template with verification button

### ✅ Password Reset Email
- **From**: `Adiology <noreply@adiology.online>`
- **Subject**: "Reset your Adiology password"
- **Includes**: Security warnings and reset button

### ✅ Welcome Email
- **From**: `Adiology <noreply@adiology.online>`
- **Subject**: "Welcome to Adiology - Let's build winning campaigns!"
- **Includes**: Feature overview and getting started guide

### ✅ Custom Notifications
- Flexible template for any notification
- Supports action buttons and custom content

## 8. Monitoring and Logs

### AWS SES Metrics
Monitor in AWS Console:
- **Sending statistics**: Delivery, bounce, complaint rates
- **Reputation metrics**: Sender reputation
- **Suppression list**: Bounced/complained addresses

### Application Logs
Email API logs include:
- Successful sends with Message IDs
- Failed sends with error details
- Rate limiting and quota information

## 9. Security Best Practices

### ✅ Implemented
- IAM user with minimal SES permissions
- Environment variables for credentials
- Input validation on all endpoints
- CORS configuration for frontend access

### 🔒 Additional Recommendations
- Use AWS Secrets Manager for production credentials
- Implement rate limiting on email endpoints
- Add email template validation
- Monitor for abuse/spam patterns

## 10. Troubleshooting

### Common Issues

**Email not sending:**
- Check AWS credentials are correct
- Verify domain is in "Verified" status
- Check SES sending limits
- Review CloudWatch logs for errors

**"Email address not verified" error:**
- Ensure sender domain `adiology.online` is verified
- Check if account is still in SES sandbox mode

**API connection failed:**
- Verify email API is running on correct port
- Check firewall/security group settings
- Confirm CORS configuration

### Support
- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- Email API logs: Check console output when running `python email_api.py`
- Test endpoints: Use `/health` endpoint to verify configuration

## Summary

✅ **What's Configured:**
- AWS SES with verified domain `adiology.online`
- Python Flask email API with professional templates
- Frontend integration with fallback handling
- Comprehensive error handling and logging

✅ **What's Replaced:**
- Supabase email functionality → AWS SES
- Generic email templates → Branded Adiology templates
- Limited customization → Full template control

🚀 **Ready for Production:**
- Scalable email infrastructure
- Professional branded emails
- Detailed monitoring and analytics
- Cost-effective solution (pay per email sent)