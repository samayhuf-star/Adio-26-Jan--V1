import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

// AWS SES Configuration
const AWS_REGION = 'us-east-1'; // Change to your preferred region
const VERIFIED_DOMAIN = 'adiology.online';
const FROM_EMAIL = `noreply@${VERIFIED_DOMAIN}`;
const FROM_NAME = 'Adiology';

// Initialize SES Client
const sesClient = new SESClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

class EmailService {
  private isConfigured(): boolean {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('AWS SES not configured. Email not sent.');
      return false;
    }

    try {
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      const ccAddresses = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined;
      const bccAddresses = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined;

      const params: SendEmailCommandInput = {
        Source: `${FROM_NAME} <${FROM_EMAIL}>`,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccAddresses,
          BccAddresses: bccAddresses,
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: options.htmlBody,
              Charset: 'UTF-8',
            },
            Text: options.textBody ? {
              Data: options.textBody,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
      };

      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);
      
      console.log('Email sent successfully:', result.MessageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Email verification template
  async sendVerificationEmail(email: string, verificationLink: string, userName?: string): Promise<boolean> {
    const displayName = userName || email.split('@')[0];
    
    const template = this.getVerificationEmailTemplate(displayName, verificationLink);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
    });
  }

  // Password reset template
  async sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<boolean> {
    const displayName = userName || email.split('@')[0];
    
    const template = this.getPasswordResetEmailTemplate(displayName, resetLink);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
    });
  }

  // Welcome email template
  async sendWelcomeEmail(email: string, userName?: string): Promise<boolean> {
    const displayName = userName || email.split('@')[0];
    
    const template = this.getWelcomeEmailTemplate(displayName);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
    });
  }

  // Notification email template
  async sendNotificationEmail(email: string, title: string, message: string, actionUrl?: string): Promise<boolean> {
    const template = this.getNotificationEmailTemplate(title, message, actionUrl);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
    });
  }

  private getVerificationEmailTemplate(userName: string, verificationLink: string): EmailTemplate {
    const subject = 'Verify your Adiology account';
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #6366f1; }
          .logo { font-size: 32px; font-weight: bold; color: #6366f1; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ADIOLOGY</div>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Google Ads Made Easy</p>
          </div>
          
          <div class="content">
            <h2>Welcome to Adiology, ${userName}!</h2>
            <p>Thank you for signing up. To complete your registration and start building winning campaigns, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${verificationLink}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with Adiology, you can safely ignore this email.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Adiology. All rights reserved.</p>
            <p>This email was sent from a notification-only address. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Welcome to Adiology, ${userName}!

Thank you for signing up. To complete your registration and start building winning campaigns, please verify your email address by visiting this link:

${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with Adiology, you can safely ignore this email.

© 2024 Adiology. All rights reserved.
    `;

    return { subject, htmlBody, textBody };
  }

  private getPasswordResetEmailTemplate(userName: string, resetLink: string): EmailTemplate {
    const subject = 'Reset your Adiology password';
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #6366f1; }
          .logo { font-size: 32px; font-weight: bold; color: #6366f1; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ADIOLOGY</div>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Google Ads Made Easy</p>
          </div>
          
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password for your Adiology account. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${resetLink}</p>
            
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Adiology. All rights reserved.</p>
            <p>This email was sent from a notification-only address. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Password Reset Request

Hi ${userName},

We received a request to reset your password for your Adiology account. Visit this link to create a new password:

${resetLink}

Security Notice:
- This link will expire in 1 hour for security reasons
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

© 2024 Adiology. All rights reserved.
    `;

    return { subject, htmlBody, textBody };
  }

  private getWelcomeEmailTemplate(userName: string): EmailTemplate {
    const subject = 'Welcome to Adiology - Let\'s build winning campaigns!';
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Adiology</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #6366f1; }
          .logo { font-size: 32px; font-weight: bold; color: #6366f1; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          .feature { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ADIOLOGY</div>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Google Ads Made Easy</p>
          </div>
          
          <div class="content">
            <h2>🎉 Welcome to Adiology, ${userName}!</h2>
            <p>Your account is now verified and ready to go. You're about to discover how easy it is to create high-converting Google Ads campaigns.</p>
            
            <h3>What you can do with Adiology:</h3>
            
            <div class="feature">
              <h4>🚀 Campaign Builder</h4>
              <p>Create professional Google Ads campaigns in minutes with our intuitive builder.</p>
            </div>
            
            <div class="feature">
              <h4>🔍 Keyword Planner</h4>
              <p>Discover high-performing keywords and optimize your targeting strategy.</p>
            </div>
            
            <div class="feature">
              <h4>📊 Performance Analytics</h4>
              <p>Track your campaigns and get insights to improve your ROI.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://adiology.online/dashboard" class="button">Start Building Campaigns</a>
            </div>
            
            <p>Need help getting started? Check out our <a href="https://adiology.online/support" style="color: #6366f1;">help center</a> or reach out to our support team.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Adiology. All rights reserved.</p>
            <p>Questions? Contact us at <a href="mailto:support@adiology.online" style="color: #6366f1;">support@adiology.online</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Welcome to Adiology, ${userName}!

Your account is now verified and ready to go. You're about to discover how easy it is to create high-converting Google Ads campaigns.

What you can do with Adiology:

🚀 Campaign Builder
Create professional Google Ads campaigns in minutes with our intuitive builder.

🔍 Keyword Planner
Discover high-performing keywords and optimize your targeting strategy.

📊 Performance Analytics
Track your campaigns and get insights to improve your ROI.

Get started: https://adiology.online/dashboard

Need help? Visit our help center: https://adiology.online/support

© 2024 Adiology. All rights reserved.
Questions? Contact us at support@adiology.online
    `;

    return { subject, htmlBody, textBody };
  }

  private getNotificationEmailTemplate(title: string, message: string, actionUrl?: string): EmailTemplate {
    const subject = `Adiology: ${title}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #6366f1; }
          .logo { font-size: 32px; font-weight: bold; color: #6366f1; }
          .content { padding: 30px 0; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #6366f1, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ADIOLOGY</div>
            <p style="margin: 5px 0 0 0; color: #6b7280;">Google Ads Made Easy</p>
          </div>
          
          <div class="content">
            <h2>${title}</h2>
            <p>${message}</p>
            
            ${actionUrl ? `
              <div style="text-align: center;">
                <a href="${actionUrl}" class="button">Take Action</a>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>© 2024 Adiology. All rights reserved.</p>
            <p>This email was sent from a notification-only address. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
${title}

${message}

${actionUrl ? `Take action: ${actionUrl}` : ''}

© 2024 Adiology. All rights reserved.
    `;

    return { subject, htmlBody, textBody };
  }
}

export const emailService = new EmailService();