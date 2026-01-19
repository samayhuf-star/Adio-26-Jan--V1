/**
 * ResellerClub API Integration for Webmail Management
 * 
 * This module provides functions to interact with the ResellerClub API
 * for managing email accounts, domains, and webmail services.
 * 
 * Required environment variables:
 * - VITE_RESELLERCLUB_API_URL: API endpoint (defaults to https://httpapi.com/api)
 * - VITE_RESELLERCLUB_API_KEY: Your ResellerClub API key
 * - VITE_RESELLERCLUB_USER_ID: Your ResellerClub numeric reseller/user ID
 */

const RESELLERCLUB_API_URL = import.meta.env.VITE_RESELLERCLUB_API_URL || 'https://httpapi.com/api';
const RESELLERCLUB_API_KEY = import.meta.env.VITE_RESELLERCLUB_API_KEY || '';
const RESELLERCLUB_USER_ID = import.meta.env.VITE_RESELLERCLUB_USER_ID || '';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface EmailAccount {
  email: string;
  domain: string;
  firstName?: string;
  lastName?: string;
  quota?: number;
  status: 'active' | 'suspended' | 'deleted';
  createdAt?: string;
}

interface DomainInfo {
  domain: string;
  status: string;
  expiryDate?: string;
  emailAccounts?: number;
}

interface CreateEmailParams {
  domain: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  quota?: number;
}

interface EmailForwardingRule {
  source: string;
  destination: string;
  enabled: boolean;
}

async function makeApiRequest<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
  method: 'GET' | 'POST' = 'GET'
): Promise<ApiResponse<T>> {
  try {
    if (!RESELLERCLUB_API_KEY || !RESELLERCLUB_USER_ID) {
      return {
        success: false,
        error: 'ResellerClub API credentials not configured. Please set VITE_RESELLERCLUB_API_KEY and VITE_RESELLERCLUB_USER_ID.',
      };
    }

    const queryParams = new URLSearchParams({
      'auth-userid': RESELLERCLUB_USER_ID,
      'api-key': RESELLERCLUB_API_KEY,
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ),
    });

    const url = `${RESELLERCLUB_API_URL}${endpoint}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'ERROR' || data.error) {
      return {
        success: false,
        error: data.message || data.error || 'Unknown error occurred',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('ResellerClub API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to ResellerClub API',
    };
  }
}

export async function listEmailAccounts(domain: string): Promise<ApiResponse<EmailAccount[]>> {
  const result = await makeApiRequest<any>('/mail/user/search.json', {
    'domain-name': domain,
    'no-of-records': 100,
    'page-no': 1,
  });

  if (!result.success) {
    return result;
  }

  const accounts: EmailAccount[] = [];
  if (result.data && typeof result.data === 'object') {
    for (const key of Object.keys(result.data)) {
      if (result.data[key] && typeof result.data[key] === 'object') {
        const account = result.data[key];
        accounts.push({
          email: account.email || `${key}@${domain}`,
          domain,
          firstName: account.fname || '',
          lastName: account.lname || '',
          quota: account.quota || 0,
          status: account.status === 'Active' ? 'active' : 'suspended',
          createdAt: account.creationdt || '',
        });
      }
    }
  }

  return { success: true, data: accounts };
}

export async function createEmailAccount(params: CreateEmailParams): Promise<ApiResponse<{ email: string }>> {
  const result = await makeApiRequest<any>('/mail/user/add.json', {
    'domain-name': params.domain,
    email: params.email,
    passwd: params.password,
    fname: params.firstName || '',
    lname: params.lastName || '',
    'quota-size': params.quota || 100,
  }, 'POST');

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { email: `${params.email}@${params.domain}` },
  };
}

export async function deleteEmailAccount(email: string, domain: string): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/mail/user/delete.json', {
    'domain-name': domain,
    email: email.split('@')[0],
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

export async function updateEmailPassword(
  email: string,
  domain: string,
  newPassword: string
): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/mail/user/change-password.json', {
    'domain-name': domain,
    email: email.split('@')[0],
    passwd: newPassword,
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

export async function getEmailQuota(email: string, domain: string): Promise<ApiResponse<{ used: number; total: number }>> {
  const result = await makeApiRequest<any>('/mail/user/quota.json', {
    'domain-name': domain,
    email: email.split('@')[0],
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      used: result.data?.usedquota || 0,
      total: result.data?.quota || 0,
    },
  };
}

export async function listDomains(): Promise<ApiResponse<DomainInfo[]>> {
  const result = await makeApiRequest<any>('/domains/search.json', {
    'no-of-records': 100,
    'page-no': 1,
  });

  if (!result.success) {
    return result;
  }

  const domains: DomainInfo[] = [];
  if (result.data && Array.isArray(result.data)) {
    for (const domain of result.data) {
      domains.push({
        domain: domain.domainname || domain.domain,
        status: domain.status || 'active',
        expiryDate: domain.expirydate || '',
        emailAccounts: domain.emailcount || 0,
      });
    }
  }

  return { success: true, data: domains };
}

export async function addEmailForwarding(
  email: string,
  domain: string,
  forwardTo: string
): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/mail/user/add-forward.json', {
    'domain-name': domain,
    email: email.split('@')[0],
    'forward-to': forwardTo,
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

export async function removeEmailForwarding(
  email: string,
  domain: string,
  forwardTo: string
): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/mail/user/delete-forward.json', {
    'domain-name': domain,
    email: email.split('@')[0],
    'forward-to': forwardTo,
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

export async function getWebmailLoginUrl(domain: string): Promise<string> {
  // ResellerClub webmail can be accessed via multiple methods:
  // 1. cPanel webmail interface (standard port 2095 for HTTP, 2096 for HTTPS)
  // 2. Standard webmail subdomain
  // 3. Direct webmail URL with proper SSL certificate
  
  // For development, we'll use the webmail subdomain method which is more reliable
  // Standard ResellerClub webmail subdomain: webmail.{domain}
  return `https://webmail.${domain}/`;
}

export async function suspendEmailAccount(email: string, domain: string): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/mail/user/suspend.json', {
    'domain-name': domain,
    email: email.split('@')[0],
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

export async function unsuspendEmailAccount(email: string, domain: string): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/mail/user/unsuspend.json', {
    'domain-name': domain,
    email: email.split('@')[0],
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

// DNS Management Functions

export async function addCnameRecord(
  domain: string,
  host: string,
  value: string,
  ttl: number = 14400
): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/dns/manage/add-cname-record.json', {
    'domain-name': domain,
    'host': host,
    'value': value,
    'ttl': ttl,
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

export async function addMxRecord(
  domain: string,
  value: string,
  priority: number = 10,
  ttl: number = 14400
): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/dns/manage/add-mx-record.json', {
    'domain-name': domain,
    'value': value,
    'priority': priority,
    'ttl': ttl,
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

export async function addTxtRecord(
  domain: string,
  value: string,
  host: string = '@',
  ttl: number = 14400
): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>('/dns/manage/add-txt-record.json', {
    'domain-name': domain,
    'host': host,
    'value': value,
    'ttl': ttl,
  }, 'POST');

  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

export async function getDnsRecords(domain: string): Promise<ApiResponse<any[]>> {
  const result = await makeApiRequest<any>('/dns/manage/search-records.json', {
    'domain-name': domain,
    'no-of-records': 100,
    'page-no': 1,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data?.recsonpage || [],
  };
}

export async function setupWebmailDns(domain: string): Promise<ApiResponse<{ cname: boolean; mx: boolean; spf: boolean }>> {
  const results = {
    cname: false,
    mx: false,
    spf: false,
  };

  // Add CNAME for webmail subdomain pointing to Titan/ResellerClub webmail
  const cnameResult = await addCnameRecord(domain, 'webmail', 'webmail.titan.email');
  results.cname = cnameResult.success;

  // Add MX records for email delivery
  const mx1Result = await addMxRecord(domain, 'mx1.titan.email', 10);
  const mx2Result = await addMxRecord(domain, 'mx2.titan.email', 20);
  results.mx = mx1Result.success || mx2Result.success;

  // Add SPF record for email authentication
  const spfResult = await addTxtRecord(domain, 'v=spf1 include:spf.titan.email ~all');
  results.spf = spfResult.success;

  return {
    success: results.cname || results.mx || results.spf,
    data: results,
  };
}

export type { EmailAccount, DomainInfo, CreateEmailParams, EmailForwardingRule, ApiResponse };
