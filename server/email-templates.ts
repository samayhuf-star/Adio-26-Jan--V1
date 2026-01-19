export const emailTemplates = {
  welcome: {
    name: 'Welcome to Adiology',
    subject: 'Welcome to Adiology - Let\'s Build Your First Campaign!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome aboard, {{name}}! 🎉</h2>
      <p style="color: #4b5563; margin-bottom: 20px;">
        You've just joined thousands of marketers who use Adiology to create high-converting Google Ads campaigns in minutes, not hours.
      </p>
      
      <div style="background: linear-gradient(135deg, #f0f9ff, #e0e7ff); border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #4338ca; margin: 0 0 15px 0;">Here's what you can do:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Generate 400+ targeted keywords instantly</li>
          <li style="margin-bottom: 8px;">Create RSA ads with AI assistance</li>
          <li style="margin-bottom: 8px;">Export directly to Google Ads Editor</li>
          <li style="margin-bottom: 8px;">Research competitor ads</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Start Building Campaigns</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        Need help? Reply to this email or check out our <a href="{{help_url}}" style="color: #6366f1;">documentation</a>.
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `
  },

  emailVerification: {
    name: 'Email Verification',
    subject: 'Verify your email address',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Verify your email</h2>
      <p style="color: #4b5563; margin-bottom: 20px;">
        Thanks for signing up! Please verify your email address to complete your registration and access all features.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{verification_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Verify Email Address</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
      
      <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          If the button doesn't work, copy and paste this URL:<br>
          <span style="color: #6366f1; word-break: break-all;">{{verification_url}}</span>
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  },

  passwordReset: {
    name: 'Password Reset',
    subject: 'Reset your Adiology password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Reset your password</h2>
      <p style="color: #4b5563; margin-bottom: 20px;">
        We received a request to reset your password. Click the button below to choose a new password.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reset_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
      </div>
      
      <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          ⚠️ This link expires in 1 hour. If you didn't request this, please ignore this email or contact support if you're concerned.
        </p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          If the button doesn't work, copy and paste this URL:<br>
          <span style="color: #6366f1; word-break: break-all;">{{reset_url}}</span>
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  },

  subscriptionConfirmation: {
    name: 'Subscription Confirmation',
    subject: 'Your Adiology {{plan_name}} subscription is active!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; padding: 15px;">
          <span style="font-size: 32px;">✓</span>
        </div>
      </div>
      
      <h2 style="color: #1f2937; text-align: center; margin-bottom: 20px;">You're all set!</h2>
      <p style="color: #4b5563; text-align: center; margin-bottom: 25px;">
        Your <strong>{{plan_name}}</strong> subscription is now active.
      </p>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Subscription Details</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="color: #6b7280; padding: 5px 0;">Plan:</td><td style="color: #1f2937; text-align: right;">{{plan_name}}</td></tr>
          <tr><td style="color: #6b7280; padding: 5px 0;">Amount:</td><td style="color: #1f2937; text-align: right;">{{amount}}/{{billing_period}}</td></tr>
          <tr><td style="color: #6b7280; padding: 5px 0;">Next billing:</td><td style="color: #1f2937; text-align: right;">{{next_billing_date}}</td></tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Questions? <a href="{{support_url}}" style="color: #6366f1;">Contact our support team</a>
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  },

  trialEnding: {
    name: 'Trial Ending Reminder',
    subject: 'Your Adiology trial ends in {{days_remaining}} days',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
        <p style="color: #92400e; font-size: 18px; font-weight: 600; margin: 0;">
          ⏰ Your trial ends in {{days_remaining}} days
        </p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Don't lose access, {{name}}!</h2>
      <p style="color: #4b5563; margin-bottom: 20px;">
        You've been making great progress with Adiology. Upgrade now to keep your campaigns, keywords, and all your work.
      </p>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">Your trial stats:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">{{campaigns_created}} campaigns created</li>
          <li style="margin-bottom: 8px;">{{keywords_generated}} keywords generated</li>
          <li style="margin-bottom: 8px;">{{ads_created}} ads created</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{upgrade_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Upgrade Now</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Have questions? <a href="{{support_url}}" style="color: #6366f1;">Talk to us</a>
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `
  },

  invoiceReceipt: {
    name: 'Invoice Receipt',
    subject: 'Your Adiology receipt - {{invoice_number}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Payment Receipt</h2>
      <p style="color: #4b5563; margin-bottom: 25px;">
        Thank you for your payment. Here's your receipt.
      </p>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Invoice Number:</td><td style="color: #1f2937; text-align: right; font-weight: 600;">{{invoice_number}}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0;">Date:</td><td style="color: #1f2937; text-align: right;">{{invoice_date}}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0;">Description:</td><td style="color: #1f2937; text-align: right;">{{plan_name}} Plan</td></tr>
          <tr style="border-top: 1px solid #e5e7eb;"><td style="color: #1f2937; padding: 15px 0 8px 0; font-weight: 600;">Total Paid:</td><td style="color: #10b981; text-align: right; font-size: 18px; font-weight: 700;">{{amount}}</td></tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{invoice_url}}" style="display: inline-block; padding: 12px 24px; border: 2px solid #6366f1; color: #6366f1; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Download Invoice PDF</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        If you have any questions about this charge, please contact <a href="mailto:billing@adiology.io" style="color: #6366f1;">billing@adiology.io</a>
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  },

  featureAnnouncement: {
    name: 'Feature Announcement',
    subject: 'New in Adiology: {{feature_name}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #6366f1, #9333ea); border-radius: 8px; padding: 3px; margin-bottom: 25px;">
        <div style="background: white; border-radius: 6px; padding: 20px; text-align: center;">
          <span style="font-size: 14px; font-weight: 600; background: linear-gradient(135deg, #6366f1, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">✨ NEW FEATURE</span>
        </div>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">Introducing {{feature_name}}</h2>
      <p style="color: #4b5563; margin-bottom: 20px;">
        {{feature_description}}
      </p>
      
      <div style="background: #f0f9ff; border-left: 4px solid #6366f1; padding: 15px 20px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px;">What's New:</h3>
        <p style="color: #4b5563; margin: 0; font-size: 14px;">{{feature_benefits}}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{feature_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Try It Now</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Questions? <a href="{{help_url}}" style="color: #6366f1;">Check our docs</a> or reply to this email.
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `
  },

  weeklyReport: {
    name: 'Weekly Usage Report',
    subject: 'Your Adiology Weekly Report - {{week_date}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 5px;">Weekly Report</h2>
      <p style="color: #6b7280; margin-bottom: 25px;">{{week_date}}</p>
      
      <div style="display: flex; gap: 15px; margin: 20px 0;">
        <div style="flex: 1; background: linear-gradient(135deg, #f0f9ff, #e0e7ff); border-radius: 8px; padding: 20px; text-align: center;">
          <p style="color: #6366f1; font-size: 28px; font-weight: 700; margin: 0;">{{campaigns_count}}</p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">Campaigns</p>
        </div>
        <div style="flex: 1; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 8px; padding: 20px; text-align: center;">
          <p style="color: #10b981; font-size: 28px; font-weight: 700; margin: 0;">{{keywords_count}}</p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">Keywords</p>
        </div>
        <div style="flex: 1; background: linear-gradient(135deg, #fdf4ff, #f5d0fe); border-radius: 8px; padding: 20px; text-align: center;">
          <p style="color: #a855f7; font-size: 28px; font-weight: 700; margin: 0;">{{ads_count}}</p>
          <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">Ads Created</p>
        </div>
      </div>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">This Week's Highlights</h3>
        <p style="color: #4b5563; margin: 0; font-size: 14px;">{{weekly_summary}}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Full Dashboard</a>
      </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #9ca3af;">Unsubscribe from reports</a></p>
    </div>
  </div>
</body>
</html>
    `
  },

  accountUpgraded: {
    name: 'Account Upgraded',
    subject: 'Welcome to Adiology {{plan_name}}! 🚀',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 48px;">🎉</span>
      </div>
      
      <h2 style="color: #1f2937; text-align: center; margin-bottom: 20px;">You've Upgraded!</h2>
      <p style="color: #4b5563; text-align: center; margin-bottom: 25px;">
        Welcome to <strong>{{plan_name}}</strong>. You now have access to all premium features.
      </p>
      
      <div style="background: linear-gradient(135deg, #f0f9ff, #e0e7ff); border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #4338ca; margin: 0 0 15px 0;">Your new superpowers:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">{{feature_1}}</li>
          <li style="margin-bottom: 8px;">{{feature_2}}</li>
          <li style="margin-bottom: 8px;">{{feature_3}}</li>
          <li style="margin-bottom: 8px;">{{feature_4}}</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboard_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Explore Premium Features</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Thank you for choosing Adiology!
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  },

  teamInvite: {
    name: 'Team Invitation',
    subject: "You're invited to join {{team_name}} on Adiology",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #6366f1; margin: 0;">ADIOLOGY</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Google Ads Made Easy</p>
      </div>
      
      <h2 style="color: #1f2937; margin-bottom: 20px;">You're Invited!</h2>
      <p style="color: #4b5563; margin-bottom: 20px;">
        <strong>{{inviter_name}}</strong> has invited you to join <strong>{{team_name}}</strong> on Adiology.
      </p>
      <p style="color: #4b5563; margin-bottom: 30px;">
        Adiology helps teams create powerful Google Ads campaigns with AI-powered tools. Accept this invitation to start collaborating!
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{invite_link}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
      </div>
      
      <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>&copy; {{year}} Adiology. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  }
};

export async function createResendTemplates() {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'API key not configured' };
  }
  
  const results: { name: string; success: boolean; id?: string; error?: string }[] = [];
  
  for (const [key, template] of Object.entries(emailTemplates)) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'Adiology <noreply@adiology.io>',
          to: ['test@resend.dev'],
          subject: `[TEMPLATE TEST] ${template.subject}`,
          html: template.html
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.id) {
        results.push({ name: template.name, success: true, id: data.id });
        console.log(`Template "${template.name}" validated successfully`);
      } else {
        results.push({ name: template.name, success: false, error: data.message || 'Unknown error' });
        console.error(`Template "${template.name}" failed:`, data);
      }
    } catch (error: any) {
      results.push({ name: template.name, success: false, error: error.message });
      console.error(`Template "${template.name}" error:`, error);
    }
  }
  
  return { success: true, results };
}
