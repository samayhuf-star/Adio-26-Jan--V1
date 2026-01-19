/**
 * Domain Monitoring Utility
 * Fetches WHOIS, DNS, and SSL certificate information for domains
 */

export interface DomainInfo {
  name: string;
  whois: {
    registrar?: string;
    registrationDate?: string;
    expirationDate?: string;
    status?: string;
    nameServers?: string[];
  };
  dns: {
    aRecords: string[];
    mxRecords: string[];
    txtRecords: string[];
    cname?: string;
  };
  ssl: {
    isValid: boolean;
    issuer?: string;
    expiresAt?: string;
    daysUntilExpiry?: number;
  };
  isMonitoring: boolean;
  lastChecked?: string;
}

/**
 * Check domain using public DNS API (dns.google)
 */
async function checkDNSRecords(domain: string) {
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${domain}&type=A`,
      { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('DNS lookup failed for', domain, error);
    return null;
  }
}

/**
 * Check SSL certificate using public API
 */
async function checkSSLCertificate(domain: string) {
  try {
    const response = await fetch(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}`,
      { method: 'GET' }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('SSL check failed for', domain, error);
    return null;
  }
}

/**
 * Get WHOIS information - using WHOIS database lookup
 */
async function getWHOISInfo(domain: string) {
  try {
    // Using a public WHOIS API
    const response = await fetch(
      `https://www.whoisjsonapi.com/api/v1?domain=${domain}`,
      { method: 'GET' }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('WHOIS lookup failed for', domain, error);
    return null;
  }
}

/**
 * Monitor domain - fetch all available information
 */
export async function monitorDomain(domain: string): Promise<DomainInfo> {
  const startTime = Date.now();
  
  // Normalize domain
  const normalizedDomain = domain.toLowerCase().trim();
  
  // Fetch data in parallel
  const [whoisData, dnsData, sslData] = await Promise.all([
    getWHOISInfo(normalizedDomain),
    checkDNSRecords(normalizedDomain),
    checkSSLCertificate(normalizedDomain),
  ]);

  // Parse WHOIS data
  const whoisInfo = {
    registrar: whoisData?.registrar?.name || 'Unknown',
    registrationDate: whoisData?.registrar_iana_id ? 'Registered' : undefined,
    expirationDate: whoisData?.expiration_date || 'N/A',
    status: whoisData?.status?.[0] || 'Active',
    nameServers: whoisData?.name_servers || [],
  };

  // Parse DNS data
  const dnsInfo = {
    aRecords: dnsData?.Answer?.filter((r: any) => r.type === 1).map((r: any) => r.data) || [],
    mxRecords: dnsData?.Answer?.filter((r: any) => r.type === 15).map((r: any) => r.data) || [],
    txtRecords: dnsData?.Answer?.filter((r: any) => r.type === 16).map((r: any) => r.data) || [],
  };

  // Parse SSL data
  const sslInfo = {
    isValid: sslData?.endpoints?.[0]?.statusMessage === 'Ready',
    issuer: sslData?.certs?.[0]?.issuerLabel || 'Unknown',
    expiresAt: sslData?.certs?.[0]?.notAfter ? new Date(sslData.certs[0].notAfter).toISOString().split('T')[0] : undefined,
    daysUntilExpiry: sslData?.certs?.[0]?.notAfter 
      ? Math.ceil((new Date(sslData.certs[0].notAfter).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : undefined,
  };

  return {
    name: normalizedDomain,
    whois: whoisInfo,
    dns: dnsInfo,
    ssl: sslInfo,
    isMonitoring: true,
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Generate mock monitoring data for demonstration
 */
export function generateMockMonitoringData(domain: string): DomainInfo {
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  
  const sslExpiry = new Date();
  sslExpiry.setDate(sslExpiry.getDate() + 90);

  return {
    name: domain.toLowerCase(),
    whois: {
      registrar: 'GoDaddy',
      registrationDate: '2023-01-15',
      expirationDate: expirationDate.toISOString().split('T')[0],
      status: 'clientTransferProhibited',
      nameServers: ['ns1.example.com', 'ns2.example.com', 'ns3.example.com'],
    },
    dns: {
      aRecords: ['192.0.2.1', '192.0.2.2'],
      mxRecords: ['10 mail.example.com', '20 mail2.example.com'],
      txtRecords: ['v=spf1 include:_spf.google.com ~all'],
      cname: 'example.com.',
    },
    ssl: {
      isValid: true,
      issuer: 'Let\'s Encrypt',
      expiresAt: sslExpiry.toISOString().split('T')[0],
      daysUntilExpiry: 90,
    },
    isMonitoring: true,
    lastChecked: new Date().toISOString(),
  };
}
