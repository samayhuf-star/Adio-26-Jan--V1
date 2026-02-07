import { emailTemplates } from './email-templates';
import pg from 'pg';
import { getDatabaseUrl } from './dbConfig';

const { Pool } = pg;
const pool = new Pool({ connectionString: getDatabaseUrl() });

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Adiology <noreply@adiology.io>';
const BASE_URL = process.env.APP_URL || process.env.DOMAIN || 'https://adiology.io';

interface EmailOptions {
  to: string | string[];
  templateId: keyof typeof emailTemplates;
  variables?: Record<string, string>;
  skipLog?: boolean;
}

async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.log('[EmailService] Resend not configured, skipping email:', options.templateId);
    return { success: false, error: 'Email service not configured' };
  }
  
  const template = emailTemplates[options.templateId];
  if (!template) {
    return { success: false, error: 'Template not found' };
  }
  
  let htmlContent = template.html;
  let subjectLine = template.subject;
  
  const defaultVariables: Record<string, string> = {
    year: new Date().getFullYear().toString(),
    dashboard_url: `${BASE_URL}/dashboard`,
    help_url: `${BASE_URL}/help`,
    support_url: `${BASE_URL}/support`,
    unsubscribe_url: `${BASE_URL}/settings/notifications`,
    upgrade_url: `${BASE_URL}/billing`,
    ...options.variables
  };
  
  for (const [key, value] of Object.entries(defaultVariables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    htmlContent = htmlContent.replace(regex, value);
    subjectLine = subjectLine.replace(regex, value);
  }
  
  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        subject: subjectLine,
        html: htmlContent
      })
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.id) {
      if (!options.skipLog) {
        await pool.query(
          'INSERT INTO email_logs (recipient, subject, status, sent_at) VALUES ($1, $2, $3, NOW())',
          [recipients.join(', '), subjectLine, 'sent']
        ).catch(err => console.error('[EmailService] Failed to log email:', err));
      }
      
      console.log(`[EmailService] Sent ${options.templateId} to ${recipients.join(', ')}`);
      return { success: true, messageId: responseData.id };
    } else {
      console.error('[EmailService] Failed to send:', responseData);
      
      if (!options.skipLog) {
        await pool.query(
          'INSERT INTO email_logs (recipient, subject, status, sent_at) VALUES ($1, $2, $3, NOW())',
          [recipients.join(', '), subjectLine, 'failed']
        ).catch(err => console.error('[EmailService] Failed to log email:', err));
      }
      
      return { success: false, error: responseData.message || 'Failed to send email' };
    }
  } catch (error: any) {
    console.error('[EmailService] Error:', error);
    return { success: false, error: error.message };
  }
}

export const EmailService = {
  async sendWelcomeEmail(email: string, name: string) {
    return sendEmail({
      to: email,
      templateId: 'welcome',
      variables: {
        name: name || 'there'
      }
    });
  },
  
  async sendSubscriptionConfirmation(email: string, planName: string, amount: string, billingPeriod: string, nextBillingDate: string) {
    return sendEmail({
      to: email,
      templateId: 'subscriptionConfirmation',
      variables: {
        plan_name: planName,
        amount: amount,
        billing_period: billingPeriod,
        next_billing_date: nextBillingDate
      }
    });
  },
  
  async sendTrialEndingReminder(email: string, name: string, daysRemaining: number, stats: { campaigns: number; keywords: number; ads: number }) {
    return sendEmail({
      to: email,
      templateId: 'trialEnding',
      variables: {
        name: name || 'there',
        days_remaining: daysRemaining.toString(),
        campaigns_created: stats.campaigns.toString(),
        keywords_generated: stats.keywords.toLocaleString(),
        ads_created: stats.ads.toString()
      }
    });
  },
  
  async sendInvoiceReceipt(email: string, invoiceNumber: string, invoiceDate: string, planName: string, amount: string, invoiceUrl: string) {
    return sendEmail({
      to: email,
      templateId: 'invoiceReceipt',
      variables: {
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        plan_name: planName,
        amount: amount,
        invoice_url: invoiceUrl
      }
    });
  },
  
  async sendFeatureAnnouncement(emails: string[], featureName: string, featureDescription: string, featureBenefits: string, featureUrl: string) {
    return sendEmail({
      to: emails,
      templateId: 'featureAnnouncement',
      variables: {
        feature_name: featureName,
        feature_description: featureDescription,
        feature_benefits: featureBenefits,
        feature_url: featureUrl
      }
    });
  },
  
  async sendWeeklyReport(email: string, weekDate: string, stats: { campaigns: number; keywords: number; ads: number }, weeklySummary: string) {
    return sendEmail({
      to: email,
      templateId: 'weeklyReport',
      variables: {
        week_date: weekDate,
        campaigns_count: stats.campaigns.toString(),
        keywords_count: stats.keywords.toLocaleString(),
        ads_count: stats.ads.toString(),
        weekly_summary: weeklySummary
      }
    });
  },
  
  async sendAccountUpgraded(email: string, planName: string, features: string[]) {
    return sendEmail({
      to: email,
      templateId: 'accountUpgraded',
      variables: {
        plan_name: planName,
        feature_1: features[0] || 'Unlimited campaigns',
        feature_2: features[1] || 'AI-powered keyword suggestions',
        feature_3: features[2] || 'Competitor ad research',
        feature_4: features[3] || 'Priority support'
      }
    });
  },
  
  async sendTeamInvite(email: string, inviterName: string, teamName: string, inviteLink: string) {
    return sendEmail({
      to: email,
      templateId: 'teamInvite',
      variables: {
        inviter_name: inviterName,
        team_name: teamName,
        invite_link: inviteLink
      }
    });
  },
  
  async sendRaw(to: string | string[], templateId: keyof typeof emailTemplates, variables?: Record<string, string>) {
    return sendEmail({ to, templateId, variables });
  },

  async sendRawHtml(to: string | string[], subject: string, htmlContent: string, variables?: Record<string, string>): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.log('[EmailService] Resend not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }
    
    let finalHtml = htmlContent;
    let finalSubject = subject;
    
    const defaultVariables: Record<string, string> = {
      year: new Date().getFullYear().toString(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      name: 'there',
      dashboard_url: `${BASE_URL}/dashboard`,
      help_url: `${BASE_URL}/help`,
      support_url: `${BASE_URL}/support`,
      unsubscribe_url: `${BASE_URL}/settings/notifications`,
      upgrade_url: `${BASE_URL}/billing`,
      resource_url: `${BASE_URL}/resources/google-ads-checklist`,
      trial_days: '7',
      plan_name: 'Professional',
      ...variables
    };
    
    for (const [key, value] of Object.entries(defaultVariables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      finalHtml = finalHtml.replace(regex, value);
      finalSubject = finalSubject.replace(regex, value);
    }
    
    try {
      const recipients = Array.isArray(to) ? to : [to];
      
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: recipients,
          subject: finalSubject,
          html: finalHtml
        })
      });
      
      const responseData = await response.json();
      
      if (response.ok && responseData.id) {
        console.log(`[EmailService] Sent raw email "${finalSubject}" to ${recipients.join(', ')}`);
        return { success: true, messageId: responseData.id };
      } else {
        console.error('[EmailService] Failed to send raw email:', responseData);
        return { success: false, error: responseData.message || 'Failed to send email' };
      }
    } catch (error: any) {
      console.error('[EmailService] Error sending raw email:', error);
      return { success: false, error: error.message };
    }
  }
};

export default EmailService;
