import { Resend } from 'resend';

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string } | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (xReplitToken && hostname) {
    try {
      const response = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      );
      const data = await response.json();
      const connectionSettings = data.items?.[0];
      
      if (connectionSettings?.settings?.api_key) {
        return { 
          apiKey: connectionSettings.settings.api_key, 
          fromEmail: connectionSettings.settings.from_email || 'Adiology <noreply@adiology.io>' 
        };
      }
    } catch (e) {
      console.warn('Failed to fetch Resend credentials from connector:', e);
    }
  }

  // Fallback to environment variable
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    return { apiKey: resendApiKey, fromEmail: 'Adiology <noreply@adiology.io>' };
  }
  
  // Not configured
  return null;
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  if (!credentials) {
    return null;
  }
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export async function isResendConfigured(): Promise<boolean> {
  const credentials = await getCredentials();
  return credentials !== null;
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; data?: any; error?: any; simulated?: boolean }> {
  const resendClient = await getUncachableResendClient();
  
  if (!resendClient) {
    console.log('[Resend] Not configured, simulating email send:', { to: options.to, subject: options.subject });
    return { success: true, simulated: true };
  }
  
  const result = await resendClient.client.emails.send({
    from: options.from || resendClient.fromEmail,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html
  });
  
  if (result.error) {
    return { success: false, error: result.error };
  }
  
  return { success: true, data: result.data };
}
