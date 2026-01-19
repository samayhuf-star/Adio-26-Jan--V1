/**
 * Name.com API Integration for Domain Management
 * 
 * This module provides functions to interact with the Name.com API
 * for domain search, availability checking, and domain management.
 * 
 * Required environment variables:
 * - VITE_NAMECOM_API_URL: API endpoint (defaults to https://api.name.com)
 * - VITE_NAMECOM_USERNAME: Your Name.com username
 * - VITE_NAMECOM_API_TOKEN: Your Name.com API token
 */

const NAMECOM_API_URL = import.meta.env.VITE_NAMECOM_API_URL || 'https://api.name.com';
const NAMECOM_USERNAME = import.meta.env.VITE_NAMECOM_USERNAME || '';
const NAMECOM_API_TOKEN = import.meta.env.VITE_NAMECOM_API_TOKEN || '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DomainSearchResult {
  domainName: string;
  sld: string;
  tld: string;
  purchasable: boolean;
  premium: boolean;
  purchasePrice: number;
  purchaseType: string;
  renewalPrice: number;
}

export interface Domain {
  domainName: string;
  nameservers?: string[];
  locked: boolean;
  autorenewEnabled: boolean;
  privacyEnabled: boolean;
  expireDate: string;
  createDate: string;
  renewalPrice?: number;
}

export interface DnsRecord {
  id?: number;
  domainName: string;
  host: string;
  fqdn?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
  answer: string;
  ttl: number;
  priority?: number;
}

function getAuthHeader(): string {
  const credentials = btoa(`${NAMECOM_USERNAME}:${NAMECOM_API_TOKEN}`);
  return `Basic ${credentials}`;
}

async function makeApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<ApiResponse<T>> {
  try {
    if (!NAMECOM_USERNAME || !NAMECOM_API_TOKEN) {
      return {
        success: false,
        error: 'Name.com API credentials not configured. Please set VITE_NAMECOM_USERNAME and VITE_NAMECOM_API_TOKEN.',
      };
    }

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${NAMECOM_API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.details || `API request failed: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Name.com API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Name.com API',
    };
  }
}

// Domain Search & Availability
export async function checkDomainAvailability(domainNames: string[]): Promise<ApiResponse<DomainSearchResult[]>> {
  const result = await makeApiRequest<{ results: DomainSearchResult[] }>(
    '/v4/domains:checkAvailability',
    'POST',
    { domainNames }
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    data: result.data?.results || [],
  };
}

export async function searchDomains(keyword: string): Promise<ApiResponse<DomainSearchResult[]>> {
  const result = await makeApiRequest<{ results: DomainSearchResult[] }>(
    '/v4/domains:search',
    'POST',
    { keyword }
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    data: result.data?.results || [],
  };
}

// Domain Management
export async function listDomains(): Promise<ApiResponse<Domain[]>> {
  const result = await makeApiRequest<{ domains: Domain[] }>('/v4/domains');

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    data: result.data?.domains || [],
  };
}

export async function getDomain(domainName: string): Promise<ApiResponse<Domain>> {
  return await makeApiRequest<Domain>(`/v4/domains/${domainName}`);
}

export async function getDomainPricing(domainName: string): Promise<ApiResponse<{ purchasePrice: number; renewalPrice: number; transferPrice: number }>> {
  return await makeApiRequest<{ purchasePrice: number; renewalPrice: number; transferPrice: number }>(
    `/v4/domains/${domainName}:getPricing`
  );
}

export async function enableAutorenew(domainName: string): Promise<ApiResponse<Domain>> {
  return await makeApiRequest<Domain>(`/v4/domains/${domainName}:enableAutorenew`, 'POST');
}

export async function disableAutorenew(domainName: string): Promise<ApiResponse<Domain>> {
  return await makeApiRequest<Domain>(`/v4/domains/${domainName}:disableAutorenew`, 'POST');
}

export async function lockDomain(domainName: string): Promise<ApiResponse<Domain>> {
  return await makeApiRequest<Domain>(`/v4/domains/${domainName}:lock`, 'POST');
}

export async function unlockDomain(domainName: string): Promise<ApiResponse<Domain>> {
  return await makeApiRequest<Domain>(`/v4/domains/${domainName}:unlock`, 'POST');
}

export async function setNameservers(domainName: string, nameservers: string[]): Promise<ApiResponse<Domain>> {
  return await makeApiRequest<Domain>(
    `/v4/domains/${domainName}:setNameservers`,
    'POST',
    { nameservers }
  );
}

export async function getAuthCode(domainName: string): Promise<ApiResponse<{ authCode: string }>> {
  return await makeApiRequest<{ authCode: string }>(`/v4/domains/${domainName}:getAuthCode`);
}

// DNS Management
export async function listDnsRecords(domainName: string): Promise<ApiResponse<DnsRecord[]>> {
  const result = await makeApiRequest<{ records: DnsRecord[] }>(`/v4/domains/${domainName}/records`);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    data: result.data?.records || [],
  };
}

export async function createDnsRecord(domainName: string, record: Omit<DnsRecord, 'id' | 'domainName' | 'fqdn'>): Promise<ApiResponse<DnsRecord>> {
  return await makeApiRequest<DnsRecord>(
    `/v4/domains/${domainName}/records`,
    'POST',
    record
  );
}

export async function updateDnsRecord(domainName: string, recordId: number, record: Partial<Omit<DnsRecord, 'id' | 'domainName' | 'fqdn'>>): Promise<ApiResponse<DnsRecord>> {
  return await makeApiRequest<DnsRecord>(
    `/v4/domains/${domainName}/records/${recordId}`,
    'PUT',
    record
  );
}

export async function deleteDnsRecord(domainName: string, recordId: number): Promise<ApiResponse<boolean>> {
  const result = await makeApiRequest<any>(`/v4/domains/${domainName}/records/${recordId}`, 'DELETE');
  return {
    success: result.success,
    data: result.success,
    error: result.error,
  };
}

// Check Account Balance
export async function getAccountBalance(): Promise<ApiResponse<{ balance: number }>> {
  return await makeApiRequest<{ balance: number }>('/v4/account');
}

// Hello (API test)
export async function testApiConnection(): Promise<ApiResponse<{ server_name: string; motd: string }>> {
  return await makeApiRequest<{ server_name: string; motd: string }>('/v4/hello');
}
