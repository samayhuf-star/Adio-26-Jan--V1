export interface SequenceEmail {
  id: string;
  sequence: 'lead_nurturing' | 'onboarding' | 'conversion' | 'churn_prevention' | 'advocacy';
  name: string;
  subject: string;
  triggerType: 'time_delay' | 'event' | 'condition';
  triggerValue: string;
  dayOffset: number;
  description: string;
  html: string;
}

// Professional dark theme email template inspired by SearchAtlas
const CEO_NAME = 'Samay Vashisht';
const CEO_TITLE = 'CEO, Adiology';
const CEO_IMAGE_URL = 'https://adiology.io/samay-ceo.jpg';
const LOGO_URL = 'https://adiology.io/logo-white.png';
const PRODUCT_SCREENSHOT_URL = 'https://adiology.io/dashboard-preview.png';
const APP_URL = 'https://adiology.io';

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; color: #ffffff !important; }
  .email-wrapper { background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); background-color: #1a1a2e; padding: 40px 20px; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { text-align: center; padding: 30px 0; }
  .header img { max-width: 180px; height: auto; }
  .date-badge { color: #a78bfa !important; font-size: 13px; margin-bottom: 8px; }
  .main-card { background: linear-gradient(135deg, #1e1e3f 0%, #2d2d5a 100%); background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2); }
  .headline { font-size: 32px; font-weight: 700; color: #ffffff !important; margin: 0 0 10px 0; line-height: 1.2; }
  .subheadline { font-size: 18px; color: #a78bfa !important; margin: 0 0 25px 0; font-weight: 500; }
  .progress-bar-container { background: rgba(167, 139, 250, 0.2); border-radius: 50px; height: 8px; margin: 20px 0; position: relative; overflow: hidden; }
  .progress-bar { background: linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%); height: 100%; border-radius: 50px; }
  .progress-dot { position: absolute; right: 0; top: -4px; width: 16px; height: 16px; background: #a78bfa; border-radius: 50%; border: 3px solid #1e1e3f; }
  .greeting { font-size: 16px; color: #ffffff !important; margin-bottom: 20px; line-height: 1.6; }
  .body-text { font-size: 15px; color: #e0e0e0 !important; line-height: 1.7; margin: 15px 0; }
  p { color: #e0e0e0 !important; }
  li { color: #e0e0e0 !important; }
  strong { color: #ffffff !important; }
  .cta-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); background-color: #8b5cf6; color: #ffffff !important; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); transition: all 0.3s ease; }
  .cta-button:hover { box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6); transform: translateY(-2px); }
  .feature-list { margin: 25px 0; padding: 0; list-style: none; }
  .feature-item { padding: 12px 0; font-size: 15px; color: #ffffff !important; line-height: 1.5; }
  .feature-icon { margin-right: 10px; }
  .product-screenshot { width: 100%; border-radius: 12px; margin: 25px 0; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4); }
  .highlight-box { background: rgba(167, 139, 250, 0.15); background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0 !important; }
  .highlight-box strong { color: #ffffff !important; }
  .stat-grid { display: table; width: 100%; margin: 25px 0; }
  .stat-item { display: table-cell; text-align: center; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; }
  .stat-number { font-size: 28px; font-weight: 700; color: #a78bfa !important; display: block; }
  .stat-label { font-size: 12px; color: #c0c0c0 !important; margin-top: 5px; display: block; }
  .testimonial-box { background: rgba(255, 255, 255, 0.05); background-color: #252545; border-radius: 12px; padding: 25px; margin: 25px 0; font-style: italic; color: #e0e0e0 !important; }
  .testimonial-author { font-style: normal; font-weight: 600; color: #a78bfa !important; margin-top: 15px; }
  .urgency-box { background: rgba(239, 68, 68, 0.1); background-color: #3d2233; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444; }
  .urgency-text { color: #fca5a5 !important; font-weight: 600; }
  .closing-text { font-size: 15px; color: #e0e0e0 !important; margin: 25px 0 5px 0; }
  .signature { margin-top: 30px; padding-top: 25px; border-top: 1px solid rgba(167, 139, 250, 0.2); }
  .signature-content { display: table; width: 100%; }
  .signature-photo { display: table-cell; width: 70px; vertical-align: top; }
  .signature-photo img { width: 60px; height: 60px; border-radius: 50%; border: 3px solid #a78bfa; }
  .signature-info { display: table-cell; vertical-align: middle; padding-left: 15px; }
  .signature-label { font-size: 14px; color: #c0c0c0 !important; margin: 0; }
  .signature-name { font-size: 18px; font-weight: 700; color: #ffffff !important; margin: 3px 0; }
  .signature-title { font-size: 14px; color: #a78bfa !important; margin: 0; }
  .footer { text-align: center; padding: 30px 20px; }
  .social-icons { margin: 20px 0; }
  .social-icon { display: inline-block; margin: 0 8px; width: 32px; height: 32px; background: rgba(255, 255, 255, 0.1); background-color: #2d2d5a; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff !important; text-decoration: none; font-size: 14px; }
  .footer-text { font-size: 13px; color: #9ca3af !important; margin: 10px 0; }
  .footer-links a { color: #a78bfa !important; text-decoration: none; font-size: 13px; margin: 0 10px; }
  .unsubscribe { color: #9ca3af !important; text-decoration: underline; font-size: 12px; }
`;

const createSignature = () => `
  <div class="signature" style="margin-top: 30px; padding-top: 25px; border-top: 1px solid rgba(167, 139, 250, 0.2);">
    <p class="closing-text" style="font-size: 15px; color: #e0e0e0; margin: 25px 0 5px 0;">Let's automate your Google Ads today.</p>
    <p class="closing-text" style="font-size: 15px; color: #e0e0e0; margin-top: 5px;">Talk soon,</p>
    <div class="signature-content" style="display: table; width: 100%;">
      <div class="signature-photo" style="display: table-cell; width: 70px; vertical-align: top;">
        <img src="${CEO_IMAGE_URL}" alt="${CEO_NAME}" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid #a78bfa;" />
      </div>
      <div class="signature-info" style="display: table-cell; vertical-align: middle; padding-left: 15px;">
        <p class="signature-label" style="font-size: 14px; color: #c0c0c0; margin: 0;">Best,</p>
        <p class="signature-name" style="font-size: 18px; font-weight: 700; color: #ffffff; margin: 3px 0;">${CEO_NAME}</p>
        <p class="signature-title" style="font-size: 14px; color: #a78bfa; margin: 0;">${CEO_TITLE}</p>
      </div>
    </div>
  </div>
`;

const createFooter = () => `
  <div class="footer" style="text-align: center; padding: 30px 20px;">
    <div class="social-icons" style="margin: 20px 0;">
      <a href="https://instagram.com/adiology" class="social-icon" style="display: inline-block; margin: 0 8px; width: 32px; height: 32px; background-color: #2d2d5a; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; text-decoration: none; font-size: 14px;">IG</a>
      <a href="https://facebook.com/adiology" class="social-icon" style="display: inline-block; margin: 0 8px; width: 32px; height: 32px; background-color: #2d2d5a; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; text-decoration: none; font-size: 14px;">FB</a>
      <a href="https://youtube.com/@adiology" class="social-icon" style="display: inline-block; margin: 0 8px; width: 32px; height: 32px; background-color: #2d2d5a; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; text-decoration: none; font-size: 14px;">YT</a>
      <a href="https://x.com/adiology" class="social-icon" style="display: inline-block; margin: 0 8px; width: 32px; height: 32px; background-color: #2d2d5a; border-radius: 50%; text-align: center; line-height: 32px; color: #ffffff; text-decoration: none; font-size: 14px;">X</a>
    </div>
    <p class="footer-text" style="font-size: 13px; color: #9ca3af; margin: 10px 0;">Adiology &copy; {{year}} All rights reserved.</p>
    <p class="footer-links" style="margin: 10px 0;">
      <a href="{{unsubscribe_url}}" class="unsubscribe" style="color: #9ca3af; text-decoration: underline; font-size: 12px;">Unsubscribe</a>
    </p>
  </div>
`;

const createEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adiology</title>
  <style>${baseStyles}</style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; color: #ffffff;">
  <div class="email-wrapper" style="background-color: #1a1a2e; padding: 40px 20px;">
    <div class="container" style="max-width: 600px; margin: 0 auto;">
      <div class="header" style="text-align: center; padding: 30px 0;">
        <img src="${LOGO_URL}" alt="Adiology" style="max-width: 180px; height: auto;" />
      </div>
      ${content}
      ${createFooter()}
    </div>
  </div>
</body>
</html>
`;

export const sequenceEmails: SequenceEmail[] = [
  // ============ LEAD NURTURING (5 emails) ============
  {
    id: 'ln_01_lead_magnet',
    sequence: 'lead_nurturing',
    name: 'Lead Magnet Delivery',
    subject: 'Your Free Google Ads Checklist is Here!',
    triggerType: 'event',
    triggerValue: 'lead_magnet_download',
    dayOffset: 0,
    description: 'Deliver free resource immediately after signup',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Your Free Resource is Ready!</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">The Ultimate Google Ads Campaign Checklist</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Thanks for downloading <strong>The Ultimate Google Ads Campaign Checklist</strong>! You're taking the first step toward building campaigns that actually convert.</p>
        
        <a href="{{resource_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Download Your Checklist &rarr;</a>
        
        <img src="${PRODUCT_SCREENSHOT_URL}" alt="Adiology Dashboard" class="product-screenshot" />
        
        <p class="body-text" style="font-weight: 600; margin-top: 25px;">What's Inside:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128640;</span> <strong>Pre-Launch Audit:</strong> Complete campaign setup checklist to catch issues before they cost you money.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#127760;</span> <strong>Keyword Research:</strong> Best practices for finding high-intent keywords that convert.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128200;</span> <strong>Performance Tracking:</strong> Key metrics to monitor for maximum ROI.</div>
        </div>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ln_02_educational',
    sequence: 'lead_nurturing',
    name: 'Educational Value #1',
    subject: '3 Mistakes Killing Your Google Ads ROI',
    triggerType: 'time_delay',
    triggerValue: '2_days',
    dayOffset: 2,
    description: 'Educational content about common PPC mistakes',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Are You Making These Mistakes?</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">3 Errors Destroying Your Ad Budget</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">After analyzing thousands of Google Ads campaigns, we've identified <strong>3 critical mistakes</strong> that waste 40-60% of most ad budgets:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128293;</span> <strong>Mistake #1: Broad Match Chaos</strong> - Using broad match keywords without negative lists burns through your budget on irrelevant searches.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#9888;&#65039;</span> <strong>Mistake #2: Wrong Campaign Structure</strong> - Intent-based grouping outperforms traditional SKAG by 30%+ in most industries.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128164;</span> <strong>Mistake #3: Set-and-Forget</strong> - Without weekly optimization, performance degrades 15-20% monthly.</div>
        </div>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>The Solution?</strong> A systematic approach to campaign building that eliminates these errors from day one. Adiology automates the best practices.
        </div>
        
        <a href="{{dashboard_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">See How Adiology Helps &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ln_03_case_study',
    sequence: 'lead_nurturing',
    name: 'Case Study',
    subject: 'How Sarah Increased Conversions 340% (Case Study)',
    triggerType: 'time_delay',
    triggerValue: '4_days',
    dayOffset: 4,
    description: 'Success story with real numbers',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Case Study: 340% More Conversions</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">From Struggling Agency to Top Performer</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Let me tell you about <strong>Sarah from Digital Spark Agency</strong>...</p>
        
        <div class="testimonial-box" style="background-color: #252545; border-radius: 12px; padding: 25px; margin: 25px 0; font-style: italic; color: #e0e0e0;">
          "We were spending 20+ hours per week building campaigns manually. Quality was inconsistent, and clients were getting frustrated with poor results."
          <p class="testimonial-author" style="font-style: normal; font-weight: 600; color: #a78bfa; margin-top: 15px;">- Sarah Chen, Founder, Digital Spark Agency</p>
        </div>
        
        <img src="${PRODUCT_SCREENSHOT_URL}" alt="Adiology Dashboard" class="product-screenshot" />
        
        <p class="body-text" style="font-weight: 600;">The Transformation:</p>
        
        <!--[if mso]>
        <table role="presentation" width="100%"><tr>
        <td width="33%" align="center" style="padding: 10px;">
        <![endif]-->
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; width: 30%; min-width: 100px; text-align: center; background: rgba(139, 92, 246, 0.1); border-radius: 8px; padding: 15px; margin: 5px;">
            <span class="stat-number">340%</span>
            <span class="stat-label">Conversion Increase</span>
          </div>
          <div style="display: inline-block; width: 30%; min-width: 100px; text-align: center; background: rgba(139, 92, 246, 0.1); border-radius: 8px; padding: 15px; margin: 5px;">
            <span class="stat-number">85%</span>
            <span class="stat-label">Time Saved</span>
          </div>
          <div style="display: inline-block; width: 30%; min-width: 100px; text-align: center; background: rgba(139, 92, 246, 0.1); border-radius: 8px; padding: 15px; margin: 5px;">
            <span class="stat-number">$47K</span>
            <span class="stat-label">Monthly Revenue</span>
          </div>
        </div>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
        
        <a href="{{dashboard_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Start Your Free Trial &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ln_04_pain_point',
    sequence: 'lead_nurturing',
    name: 'Pain Point Agitation',
    subject: 'Why 73% of Google Ads Campaigns Fail',
    triggerType: 'time_delay',
    triggerValue: '7_days',
    dayOffset: 7,
    description: 'Pain point agitation with statistics',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">The Uncomfortable Truth</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Why Most Campaigns Never Turn a Profit</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Here's a statistic that should terrify every marketer:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 25px 40px;">
            <span style="font-size: 48px; font-weight: 700; color: #ef4444;">73%</span>
            <span style="display: block; font-size: 14px; color: #fca5a5; margin-top: 5px;">of Google Ads campaigns fail to generate positive ROI</span>
          </div>
        </div>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Why does this happen?</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#10060;</span> Poor keyword selection wastes 40% of budget</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#10060;</span> Weak ad copy fails to capture attention</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#10060;</span> Wrong campaign structures hurt Quality Score</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#10060;</span> Missing negative keywords bleed money</div>
        </div>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>The good news?</strong> These problems are 100% preventable with the right system. Adiology builds campaigns using proven structures that work.
        </div>
        
        <a href="{{dashboard_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Build Better Campaigns &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ln_05_soft_pitch',
    sequence: 'lead_nurturing',
    name: 'Soft Pitch',
    subject: 'Ready to Build Your First Campaign?',
    triggerType: 'time_delay',
    triggerValue: '10_days',
    dayOffset: 10,
    description: 'Transition to trial signup',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Ready to Transform Your Ads?</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Your 7-Day Free Trial Awaits</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Over the past week, I've shared the mistakes killing most campaigns and the success stories of those who fixed them.</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Now it's your turn.</p>
        
        <img src="${PRODUCT_SCREENSHOT_URL}" alt="Adiology Dashboard" class="product-screenshot" />
        
        <p class="body-text" style="font-weight: 600;">Your free trial unlocks:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128640;</span> <strong>AI-Powered Campaign Builder:</strong> Generate complete campaigns in minutes, not hours.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#127760;</span> <strong>Smart Keyword Research:</strong> Find high-converting keywords automatically.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128176;</span> <strong>14 Campaign Structures:</strong> SKAG, STAG, Intent-Based, Alpha-Beta, and 10 more proven formats.</div>
        </div>
        
        <a href="{{dashboard_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Start Your FREE Trial &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },

  // ============ ONBOARDING (8 emails) ============
  {
    id: 'ob_01_welcome',
    sequence: 'onboarding',
    name: 'Welcome Email',
    subject: 'Welcome to Adiology - Let\'s Build Your First Campaign',
    triggerType: 'event',
    triggerValue: 'trial_started',
    dayOffset: 0,
    description: 'Welcome new trial user',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Welcome to Adiology!</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Let's Build Your First Campaign Together</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 15%;"></div>
          <div class="progress-dot" style="left: 15%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Congratulations on starting your free trial! You're about to discover why top agencies trust Adiology for their Google Ads campaigns.</p>
        
        <a href="{{dashboard_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Go to Dashboard &rarr;</a>
        
        <img src="${PRODUCT_SCREENSHOT_URL}" alt="Adiology Dashboard" class="product-screenshot" />
        
        <p class="body-text" style="font-weight: 600;">Your trial unlocks:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128640;</span> <strong>1-Click Campaign Builder:</strong> Generate complete campaigns instantly from any URL.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#127760;</span> <strong>Smart Keyword Tools:</strong> Planner, Mixer, and Long-Tail generator.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128200;</span> <strong>14 Campaign Structures:</strong> Every format from SKAG to Funnel-Based.</div>
        </div>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>&#128161; Quick Start Tip:</strong> Try the 1-Click Builder first. Just paste any URL and watch the magic happen!
        </div>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ob_02_first_campaign',
    sequence: 'onboarding',
    name: 'First Campaign Prompt',
    subject: 'Build Your First Campaign in 60 Seconds',
    triggerType: 'time_delay',
    triggerValue: '1_day',
    dayOffset: 1,
    description: 'Encourage first campaign creation',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">60 Seconds to Your First Campaign</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Let's Make It Happen</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 25%;"></div>
          <div class="progress-dot" style="left: 25%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Ready to build your first campaign? Here's how easy it is:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">1&#65039;&#8419;</span> Open the <strong>1-Click Campaign Builder</strong></div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">2&#65039;&#8419;</span> Paste your landing page URL</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">3&#65039;&#8419;</span> Click <strong>"Generate Campaign"</strong></div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#127881;</span> That's it! Download your Google Ads Editor CSV</div>
        </div>
        
        <a href="{{dashboard_url}}/one-click" class="cta-button">Build My First Campaign &rarr;</a>
        
        <img src="${PRODUCT_SCREENSHOT_URL}" alt="Campaign Builder" class="product-screenshot" />
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ob_03_feature_tour',
    sequence: 'onboarding',
    name: 'Feature Tour',
    subject: 'Unlock These 5 Powerful Features',
    triggerType: 'time_delay',
    triggerValue: '3_days',
    dayOffset: 3,
    description: 'Tour key platform features',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">5 Features You Need to Try</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Unlock Your Full Potential</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 40%;"></div>
          <div class="progress-dot" style="left: 40%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">You've explored the basics. Now let's unlock the full power of Adiology:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128161;</span> <strong>Keyword Planner:</strong> Generate 150+ keywords with search volume and CPC data.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128256;</span> <strong>Keyword Mixer:</strong> Combine keyword lists to create thousands of variations.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128721;</span> <strong>Negative Keywords Builder:</strong> Block 1000+ irrelevant searches automatically.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128269;</span> <strong>Long-Tail Generator:</strong> Find low-competition, high-intent keywords.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#127891;</span> <strong>Competitor Ads Search:</strong> See what your competitors are running.</div>
        </div>
        
        <a href="{{dashboard_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Explore Features &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ob_04_tips',
    sequence: 'onboarding',
    name: 'Pro Tips',
    subject: '3 Pro Tips for Better Campaigns',
    triggerType: 'time_delay',
    triggerValue: '5_days',
    dayOffset: 5,
    description: 'Share expert tips',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">3 Pro Tips from Power Users</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Level Up Your Campaigns</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 55%;"></div>
          <div class="progress-dot" style="left: 55%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Our top users shared their secrets. Here's what separates good campaigns from great ones:</p>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>&#128161; Pro Tip #1: Use Multiple Structures</strong><br />
          Don't stick with just SKAG. Try Intent-Based or Alpha-Beta structures for different campaigns. Adiology lets you test all 14 formats.
        </div>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>&#128161; Pro Tip #2: Always Add Negatives</strong><br />
          Before launching, run your keywords through our Negative Keywords Builder. It blocks 40-60% of wasted clicks.
        </div>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>&#128161; Pro Tip #3: Export to Google Ads Editor</strong><br />
          Download the CSV and bulk-upload to Google Ads Editor. Changes that took hours now take minutes.
        </div>
        
        <a href="{{dashboard_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Apply These Tips &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ob_05_milestone',
    sequence: 'onboarding',
    name: 'Progress Check',
    subject: 'You\'re Halfway There! 🎉',
    triggerType: 'time_delay',
    triggerValue: '7_days',
    dayOffset: 7,
    description: 'Celebrate mid-trial milestone',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">You're Crushing It!</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Day 7 of Your Trial</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 70%;"></div>
          <div class="progress-dot" style="left: 70%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Wow! You're halfway through your trial and making amazing progress.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 25px 40px;">
            <span style="font-size: 48px;">&#127881;</span>
            <span style="display: block; font-size: 18px; color: #10b981; margin-top: 10px; font-weight: 600;">Day 7 Milestone Reached!</span>
          </div>
        </div>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Ready to lock in your access? Upgrade now and keep building amazing campaigns.</p>
        
        <a href="{{upgrade_url}}" class="cta-button">Upgrade My Account &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ob_06_social_proof',
    sequence: 'onboarding',
    name: 'Social Proof',
    subject: 'Why 2,000+ Agencies Trust Adiology',
    triggerType: 'time_delay',
    triggerValue: '9_days',
    dayOffset: 9,
    description: 'Share testimonials',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Join 2,000+ Happy Agencies</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">See What They're Saying</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 80%;"></div>
          <div class="progress-dot" style="left: 80%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Don't just take my word for it. Here's what other agencies are saying:</p>
        
        <div class="testimonial-box" style="background-color: #252545; border-radius: 12px; padding: 25px; margin: 25px 0; font-style: italic; color: #e0e0e0;">
          "Adiology cut our campaign setup time by 85%. We went from 3 hours to 20 minutes per campaign."
          <p class="testimonial-author" style="font-style: normal; font-weight: 600; color: #a78bfa; margin-top: 15px;">- Mike R., Performance Marketing Agency</p>
        </div>
        
        <div class="testimonial-box" style="background-color: #252545; border-radius: 12px; padding: 25px; margin: 25px 0; font-style: italic; color: #e0e0e0;">
          "The Keyword Mixer alone is worth the subscription. We generate thousands of variations in seconds."
          <p class="testimonial-author" style="font-style: normal; font-weight: 600; color: #a78bfa; margin-top: 15px;">- Lisa T., Digital Marketing Director</p>
        </div>
        
        <div class="testimonial-box" style="background-color: #252545; border-radius: 12px; padding: 25px; margin: 25px 0; font-style: italic; color: #e0e0e0;">
          "Finally, a tool that understands Google Ads structure. The CSV exports work perfectly every time."
          <p class="testimonial-author" style="font-style: normal; font-weight: 600; color: #a78bfa; margin-top: 15px;">- James K., PPC Specialist</p>
        </div>
        
        <a href="{{upgrade_url}}" class="cta-button">Join Them Today &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ob_07_urgency',
    sequence: 'onboarding',
    name: 'Trial Ending Soon',
    subject: 'Only 3 Days Left in Your Trial',
    triggerType: 'time_delay',
    triggerValue: '11_days',
    dayOffset: 11,
    description: 'Trial ending warning',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Your Trial Ends in 3 Days</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Don't Lose Your Progress</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 90%;"></div>
          <div class="progress-dot" style="left: 90%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Just a heads up: your Adiology trial ends in <strong>3 days</strong>.</p>
        
        <div class="urgency-box" style="background-color: #3d2233; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p class="urgency-text" style="color: #fca5a5; font-weight: 600; margin: 0;">&#9888;&#65039; After your trial ends:</p>
          <ul style="color: #fca5a5; margin: 10px 0; padding-left: 20px;">
            <li>You'll lose access to all campaign builders</li>
            <li>Saved campaigns and keywords won't be accessible</li>
            <li>Any work in progress will be paused</li>
          </ul>
        </div>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Upgrade now to keep everything you've built:</p>
        
        <a href="{{upgrade_url}}" class="cta-button">Upgrade Now &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ob_08_last_chance',
    sequence: 'onboarding',
    name: 'Last Day',
    subject: 'LAST DAY: Your Trial Ends Today',
    triggerType: 'time_delay',
    triggerValue: '13_days',
    dayOffset: 13,
    description: 'Final trial day',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">This is It - Final Day</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Your Trial Ends Tonight</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 98%;"></div>
          <div class="progress-dot" style="left: 98%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Your Adiology trial ends <strong>tonight at midnight</strong>.</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">This is your last chance to upgrade and keep all your campaigns, keywords, and progress.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 25px 40px;">
            <span style="font-size: 32px; font-weight: 700; color: #ef4444;">&#9200; Hours Left</span>
          </div>
        </div>
        
        <a href="{{upgrade_url}}" class="cta-button">Upgrade Before Midnight &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },

  // ============ CONVERSION (6 emails) ============
  {
    id: 'cv_01_expired',
    sequence: 'conversion',
    name: 'Trial Expired',
    subject: 'Your Trial Has Ended - But There\'s Still Time',
    triggerType: 'event',
    triggerValue: 'trial_expired',
    dayOffset: 1,
    description: 'First email after trial expires',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">You Were So Close</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Complete Your Journey</p>
        
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 95%;"></div>
          <div class="progress-dot" style="left: 95%;"></div>
        </div>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">You were just a click away from unlocking Adiology, but didn't quite finish.</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Pick up where you left off and get instant access to the world's most powerful Google Ads campaign builder.</p>
        
        <a href="{{upgrade_url}}" class="cta-button">Complete Your Registration &rarr;</a>
        
        <img src="${PRODUCT_SCREENSHOT_URL}" alt="Adiology Dashboard" class="product-screenshot" />
        
        <p class="body-text" style="font-weight: 600;">Your account unlocks:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128640;</span> <strong>AI Campaign Builder:</strong> Generate complete campaigns from any URL.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#127760;</span> <strong>Smart Keywords:</strong> Research, mix, and expand keywords automatically.</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128200;</span> <strong>Export Ready:</strong> Download Google Ads Editor CSVs instantly.</div>
        </div>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'cv_02_value',
    sequence: 'conversion',
    name: 'Value Reminder',
    subject: 'What You\'re Missing Without Adiology',
    triggerType: 'time_delay',
    triggerValue: '3_days',
    dayOffset: 3,
    description: 'Remind of value proposition',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">What You're Missing</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">The Manual Way vs. The Adiology Way</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Every day without Adiology, you're:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#9200;</span> Spending 3+ hours on campaigns that take us 10 minutes</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128176;</span> Missing keywords that could be driving conversions</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#128293;</span> Burning budget on searches that should be negative keywords</div>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; width: 45%; min-width: 150px; text-align: center; background: rgba(239, 68, 68, 0.1); border-radius: 8px; padding: 15px; margin: 5px;">
            <span style="font-size: 24px; font-weight: 700; color: #ef4444; display: block;">3+ Hours</span>
            <span style="font-size: 12px; color: #fca5a5;">Manual Campaign Setup</span>
          </div>
          <div style="display: inline-block; width: 45%; min-width: 150px; text-align: center; background: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 15px; margin: 5px;">
            <span style="font-size: 24px; font-weight: 700; color: #10b981; display: block;">10 Min</span>
            <span style="font-size: 12px; color: #6ee7b7;">With Adiology</span>
          </div>
        </div>
        
        <a href="{{upgrade_url}}" class="cta-button">Get Started Today &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'cv_03_objection',
    sequence: 'conversion',
    name: 'Objection Handler',
    subject: 'Is Price Holding You Back?',
    triggerType: 'time_delay',
    triggerValue: '7_days',
    dayOffset: 7,
    description: 'Address common objections',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Let's Talk About Value</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Is Price the Concern?</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">I noticed you haven't upgraded yet. If price is the concern, let me break down the math:</p>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>The Starter Plan ($29/month):</strong><br />
          <ul style="margin: 10px 0; padding-left: 20px; color: #e0e0e0;">
            <li>5 campaigns/month = <strong>$5.80/campaign</strong></li>
            <li>Save 3+ hours per campaign</li>
            <li>At $50/hour, that's <strong>$150 saved per campaign</strong></li>
            <li><strong>ROI: 26x your investment</strong></li>
          </ul>
        </div>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Plus, we offer a <strong>14-day money-back guarantee</strong>. If you're not happy, we'll refund every penny.</p>
        
        <a href="{{upgrade_url}}" class="cta-button">Try Risk-Free &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'cv_04_scarcity',
    sequence: 'conversion',
    name: 'Special Offer',
    subject: 'Special Offer: 20% Off - This Week Only',
    triggerType: 'time_delay',
    triggerValue: '14_days',
    dayOffset: 14,
    description: 'Limited time discount',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Special Offer Inside</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">20% Off - This Week Only</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">I don't do this often, but I want to make Adiology accessible to you.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); border-radius: 12px; padding: 25px 40px;">
            <span style="font-size: 48px; font-weight: 700; color: #ffffff;">20% OFF</span>
            <span style="display: block; font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 5px;">Use code: WELCOME20</span>
          </div>
        </div>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">This offer expires in 7 days. After that, it's gone forever.</p>
        
        <a href="{{upgrade_url}}?coupon=WELCOME20" class="cta-button">Claim 20% Off &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'cv_05_testimonial',
    sequence: 'conversion',
    name: 'Success Story',
    subject: 'How Mark 10x\'d His Agency Revenue',
    triggerType: 'time_delay',
    triggerValue: '21_days',
    dayOffset: 21,
    description: 'Detailed success story',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">From Side Hustle to $50K/Month</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Mark's Adiology Story</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Meet Mark. One year ago, he was a freelancer struggling to land clients.</p>
        
        <div class="testimonial-box" style="background-color: #252545; border-radius: 12px; padding: 25px; margin: 25px 0; font-style: italic; color: #e0e0e0;">
          "I was spending so much time building campaigns that I couldn't scale. With Adiology, I now handle 50+ clients and make more in a month than I used to make in a year."
          <p class="testimonial-author" style="font-style: normal; font-weight: 600; color: #a78bfa; margin-top: 15px;">- Mark D., Agency Owner</p>
        </div>
        
        <p class="body-text" style="font-weight: 600;">Mark's transformation:</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; width: 30%; min-width: 100px; text-align: center; background: rgba(139, 92, 246, 0.1); border-radius: 8px; padding: 15px; margin: 5px;">
            <span class="stat-number">10x</span>
            <span class="stat-label">Revenue Growth</span>
          </div>
          <div style="display: inline-block; width: 30%; min-width: 100px; text-align: center; background: rgba(139, 92, 246, 0.1); border-radius: 8px; padding: 15px; margin: 5px;">
            <span class="stat-number">50+</span>
            <span class="stat-label">Active Clients</span>
          </div>
          <div style="display: inline-block; width: 30%; min-width: 100px; text-align: center; background: rgba(139, 92, 246, 0.1); border-radius: 8px; padding: 15px; margin: 5px;">
            <span class="stat-number">85%</span>
            <span class="stat-label">Time Saved</span>
          </div>
        </div>
        
        <a href="{{upgrade_url}}" class="cta-button">Start Your Story &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'cv_06_final',
    sequence: 'conversion',
    name: 'Final Attempt',
    subject: 'One Last Thing Before I Go...',
    triggerType: 'time_delay',
    triggerValue: '35_days',
    dayOffset: 35,
    description: 'Final conversion attempt',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">One Last Thing...</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Before We Part Ways</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">I've sent you a few emails about Adiology, and I respect that you haven't jumped on board yet.</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">This will be my last email for a while. But before I go, I wanted to leave you with this:</p>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>The door is always open.</strong><br />
          Whenever you're ready to build better Google Ads campaigns in a fraction of the time, we'll be here.
        </div>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">If you ever want to give it another shot, just click below:</p>
        
        <a href="{{dashboard_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Visit Adiology &rarr;</a>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Wishing you all the best with your marketing!</p>
        
        ${createSignature()}
      </div>
    `)
  },

  // ============ CHURN PREVENTION (3 emails) ============
  {
    id: 'cp_01_cancel',
    sequence: 'churn_prevention',
    name: 'Cancel Confirmation',
    subject: 'We\'re Sad to See You Go',
    triggerType: 'event',
    triggerValue: 'subscription_cancelled',
    dayOffset: 0,
    description: 'Acknowledge cancellation',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">We're Sorry to See You Go</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Your Cancellation is Confirmed</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">We've processed your cancellation. Your access will remain active until the end of your current billing period.</p>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>Before you go...</strong><br />
          We'd love to know what we could have done better. Your feedback helps us improve for everyone.
        </div>
        
        <a href="{{feedback_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Share Feedback &rarr;</a>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">If you change your mind, you can reactivate anytime. All your data will be waiting for you.</p>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'cp_02_winback',
    sequence: 'churn_prevention',
    name: 'Win-Back Offer',
    subject: 'We Miss You! Here\'s 30% Off to Come Back',
    triggerType: 'time_delay',
    triggerValue: '30_days',
    dayOffset: 30,
    description: 'Win-back discount offer',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">We Miss You!</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Here's 30% Off to Come Back</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">It's been a month since you left, and we've been busy making Adiology even better:</p>
        
        <div class="feature-list">
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#10024;</span> New: AI-powered ad copy suggestions</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#10024;</span> New: Competitor analysis tool</div>
          <div class="feature-item" style="padding: 12px 0; font-size: 15px; color: #ffffff; line-height: 1.5;"><span class="feature-icon">&#10024;</span> Improved: Faster campaign generation</div>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px 40px;">
            <span style="font-size: 48px; font-weight: 700; color: #ffffff;">30% OFF</span>
            <span style="display: block; font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 5px;">Your first 3 months back</span>
          </div>
        </div>
        
        <a href="{{reactivate_url}}?coupon=COMEBACK30" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Reactivate with 30% Off &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'cp_03_final',
    sequence: 'churn_prevention',
    name: 'Final Win-Back',
    subject: 'Last Chance: Your Special Offer Expires',
    triggerType: 'time_delay',
    triggerValue: '60_days',
    dayOffset: 60,
    description: 'Final win-back attempt',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Your Offer Expires Soon</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Last Chance for 30% Off</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Remember that 30% discount we offered? It expires in 7 days.</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">After that, it's gone for good.</p>
        
        <div class="urgency-box" style="background-color: #3d2233; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p class="urgency-text" style="color: #fca5a5; font-weight: 600; margin: 0;">&#9200; Offer Expires: {{expiry_date}}</p>
        </div>
        
        <a href="{{reactivate_url}}?coupon=COMEBACK30" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Claim Your Discount &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },

  // ============ ADVOCACY (3 emails) ============
  {
    id: 'ad_01_review',
    sequence: 'advocacy',
    name: 'Request Review',
    subject: 'How Are We Doing? (Quick Survey)',
    triggerType: 'condition',
    triggerValue: 'active_30_days',
    dayOffset: 30,
    description: 'Request product review',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Quick Favor?</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Your Feedback Means Everything</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">You've been with us for a month now, and I hope Adiology has been making your life easier!</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Would you mind taking 60 seconds to share your experience? Your review helps other marketers find us.</p>
        
        <a href="{{review_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Leave a Quick Review &rarr;</a>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Thank you for being part of the Adiology family!</p>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ad_02_referral',
    sequence: 'advocacy',
    name: 'Referral Program',
    subject: 'Give $20, Get $20 - Share Adiology',
    triggerType: 'condition',
    triggerValue: 'active_90_days',
    dayOffset: 90,
    description: 'Introduce referral program',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Share the Love</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">Give $20, Get $20</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">You've been crushing it with Adiology! Know someone else who could benefit?</p>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>Here's the deal:</strong><br />
          <ul style="margin: 10px 0; padding-left: 20px; color: #e0e0e0;">
            <li>Give your friends $20 off their first month</li>
            <li>You get $20 credit for each referral</li>
            <li>No limits - refer as many as you want!</li>
          </ul>
        </div>
        
        <a href="{{referral_url}}" class="cta-button" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0;">Get Your Referral Link &rarr;</a>
        
        ${createSignature()}
      </div>
    `)
  },
  {
    id: 'ad_03_anniversary',
    sequence: 'advocacy',
    name: 'Anniversary',
    subject: 'Happy Anniversary! 🎉 1 Year with Adiology',
    triggerType: 'condition',
    triggerValue: 'active_365_days',
    dayOffset: 365,
    description: 'Celebrate 1 year anniversary',
    html: createEmailWrapper(`
      <p class="date-badge" style="color: #a78bfa; font-size: 13px; margin-bottom: 8px;">Date: {{date}}</p>
      <div class="main-card" style="background-color: #1e1e3f; border-radius: 16px; padding: 40px; margin: 20px 0; border: 1px solid rgba(167, 139, 250, 0.2);">
        <h1 class="headline" style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0; line-height: 1.2;">Happy Anniversary!</h1>
        <p class="subheadline" style="font-size: 18px; color: #a78bfa; margin: 0 0 25px 0; font-weight: 500;">1 Year of Amazing Campaigns</p>
        
        <p class="greeting" style="font-size: 16px; color: #ffffff; margin-bottom: 20px; line-height: 1.6;">Hey {{name}},</p>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Wow! It's been exactly one year since you joined Adiology. Thank you for being such an incredible part of our community!</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); border-radius: 12px; padding: 30px;">
            <span style="font-size: 72px;">&#127881;</span>
            <span style="display: block; font-size: 24px; font-weight: 700; color: #ffffff; margin-top: 10px;">1 Year!</span>
          </div>
        </div>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">As a thank you, here's a special gift:</p>
        
        <div class="highlight-box" style="background-color: #2d2854; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #a78bfa; color: #e0e0e0;">
          <strong>&#127873; Anniversary Gift:</strong> 1 month FREE on your next renewal!<br />
          <span style="font-size: 13px; color: #a0a0a0;">Applied automatically to your account</span>
        </div>
        
        <p class="body-text" style="font-size: 15px; color: #e0e0e0; line-height: 1.7; margin: 15px 0;">Here's to many more years of building amazing campaigns together!</p>
        
        ${createSignature()}
      </div>
    `)
  }
];

export default sequenceEmails;
