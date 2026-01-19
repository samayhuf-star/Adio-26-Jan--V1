// Email API Client for AWS SES integration
// This replaces Supabase email functionality with our custom AWS SES service

interface EmailApiResponse {
  success: boolean;
  message?: string;
  message_id?: string;
  error?: string;
}

interface SendVerificationEmailRequest {
  email: string;
  verification_link: string;
  user_name?: string;
}

interface SendPasswordResetEmailRequest {
  email: string;
  reset_link: string;
  user_name?: string;
}

interface SendWelcomeEmailRequest {
  email: string;
  user_name?: string;
}

interface SendCustomEmailRequest {
  to_addresses: string | string[];
  subject: string;
  html_body: string;
  text_body?: string;
  cc_addresses?: string[];
  bcc_addresses?: string[];
  reply_to?: string;
}

class EmailApiClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseUrl = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:5001';
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`Email API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(request: SendVerificationEmailRequest): Promise<EmailApiResponse> {
    return this.makeRequest<EmailApiResponse>('/send-verification', request);
  }

  async sendPasswordResetEmail(request: SendPasswordResetEmailRequest): Promise<EmailApiResponse> {
    return this.makeRequest<EmailApiResponse>('/send-password-reset', request);
  }

  async sendWelcomeEmail(request: SendWelcomeEmailRequest): Promise<EmailApiResponse> {
    return this.makeRequest<EmailApiResponse>('/send-welcome', request);
  }

  async sendCustomEmail(request: SendCustomEmailRequest): Promise<EmailApiResponse> {
    return this.makeRequest<EmailApiResponse>('/send-custom', request);
  }

  async checkHealth(): Promise<{ status: string; service: string; ses_configured: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Email API health check failed:', error);
      throw error;
    }
  }
}

export const emailApiClient = new EmailApiClient();

// Helper functions for common email operations
export const emailHelpers = {
  /**
   * Send verification email for new user signup
   */
  async sendVerificationEmail(email: string, verificationToken: string, userName?: string): Promise<boolean> {
    try {
      // Construct verification link
      const verificationLink = `${window.location.origin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      const result = await emailApiClient.sendVerificationEmail({
        email,
        verification_link: verificationLink,
        user_name: userName,
      });

      return result.success;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<boolean> {
    try {
      // Construct reset link
      const resetLink = `${window.location.origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      const result = await emailApiClient.sendPasswordResetEmail({
        email,
        reset_link: resetLink,
        user_name: userName,
      });

      return result.success;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  },

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, userName?: string): Promise<boolean> {
    try {
      const result = await emailApiClient.sendWelcomeEmail({
        email,
        user_name: userName,
      });

      return result.success;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  },

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    email: string, 
    subject: string, 
    message: string, 
    actionUrl?: string
  ): Promise<boolean> {
    try {
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
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
              <h2>${subject}</h2>
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
${subject}

${message}

${actionUrl ? `Take action: ${actionUrl}` : ''}

© 2024 Adiology. All rights reserved.
      `;

      const result = await emailApiClient.sendCustomEmail({
        to_addresses: email,
        subject: `Adiology: ${subject}`,
        html_body: htmlBody,
        text_body: textBody,
      });

      return result.success;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  },

  /**
   * Check if email service is available and configured
   */
  async isEmailServiceAvailable(): Promise<boolean> {
    try {
      const health = await emailApiClient.checkHealth();
      return health.ses_configured;
    } catch (error) {
      console.warn('Email service not available:', error);
      return false;
    }
  },
};

export default emailApiClient;