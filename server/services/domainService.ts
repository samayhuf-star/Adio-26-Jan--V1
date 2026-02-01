import * as dns from 'dns';
import * as tls from 'tls';
import whois from 'whois';
import { promisify } from 'util';

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveNs = promisify(dns.resolveNs);
const dnsResolveCname = promisify(dns.resolveCname);
const dnsResolveSoa = promisify(dns.resolveSoa);

export interface WhoisData {
  raw: string;
  registrar?: string;
  createdDate?: Date;
  updatedDate?: Date;
  expiryDate?: Date;
  nameServers?: string[];
  registrantName?: string;
  registrantOrg?: string;
  registrantEmail?: string;
  dnssec?: string;
  status?: string[];
}

export interface SSLData {
  issuer: string;
  issuerOrg?: string;
  subject: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  serialNumber: string;
  fingerprint: string;
  protocol: string;
  cipher?: string;
  altNames?: string[];
  isValid: boolean;
}

export interface DNSRecords {
  a?: string[];
  aaaa?: string[];
  mx?: Array<{ priority: number; exchange: string }>;
  txt?: string[][];
  ns?: string[];
  cname?: string[];
  soa?: {
    nsname: string;
    hostmaster: string;
    serial: number;
    refresh: number;
    retry: number;
    expire: number;
    minttl: number;
  };
}

export async function lookupWhois(domain: string): Promise<WhoisData> {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err: Error | null, data: string | object[]) => {
      if (err) {
        reject(err);
        return;
      }

      const rawData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const parsed = parseWhoisData(rawData);
      resolve(parsed);
    });
  });
}

function parseWhoisData(raw: string): WhoisData {
  const result: WhoisData = { raw };
  const lines = raw.split('\n');
  
  const datePatterns = [
    /Creation Date:\s*(.+)/i,
    /Created Date:\s*(.+)/i,
    /Registration Time:\s*(.+)/i,
    /created:\s*(.+)/i,
  ];
  
  const updatePatterns = [
    /Updated Date:\s*(.+)/i,
    /Last Modified:\s*(.+)/i,
    /last-updated:\s*(.+)/i,
  ];
  
  const expiryPatterns = [
    /Registry Expiry Date:\s*(.+)/i,
    /Registrar Registration Expiration Date:\s*(.+)/i,
    /Expiration Date:\s*(.+)/i,
    /Expiry Date:\s*(.+)/i,
    /expires:\s*(.+)/i,
    /paid-till:\s*(.+)/i,
  ];
  
  const registrarPatterns = [
    /Registrar:\s*(.+)/i,
    /Sponsoring Registrar:\s*(.+)/i,
    /registrar:\s*(.+)/i,
  ];
  
  const nameServers: string[] = [];
  const statuses: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    for (const pattern of datePatterns) {
      const match = trimmed.match(pattern);
      if (match && !result.createdDate) {
        const parsed = new Date(match[1].trim());
        if (!isNaN(parsed.getTime())) result.createdDate = parsed;
      }
    }
    
    for (const pattern of updatePatterns) {
      const match = trimmed.match(pattern);
      if (match && !result.updatedDate) {
        const parsed = new Date(match[1].trim());
        if (!isNaN(parsed.getTime())) result.updatedDate = parsed;
      }
    }
    
    for (const pattern of expiryPatterns) {
      const match = trimmed.match(pattern);
      if (match && !result.expiryDate) {
        const parsed = new Date(match[1].trim());
        if (!isNaN(parsed.getTime())) result.expiryDate = parsed;
      }
    }
    
    for (const pattern of registrarPatterns) {
      const match = trimmed.match(pattern);
      if (match && !result.registrar) {
        result.registrar = match[1].trim();
      }
    }
    
    const nsMatch = trimmed.match(/^Name Server:\s*(.+)/i) || trimmed.match(/^nserver:\s*(.+)/i);
    if (nsMatch) {
      nameServers.push(nsMatch[1].trim().toLowerCase());
    }
    
    const statusMatch = trimmed.match(/^Domain Status:\s*(.+)/i) || trimmed.match(/^status:\s*(.+)/i);
    if (statusMatch) {
      statuses.push(statusMatch[1].trim());
    }
    
    const registrantNameMatch = trimmed.match(/^Registrant Name:\s*(.+)/i);
    if (registrantNameMatch && !result.registrantName) {
      result.registrantName = registrantNameMatch[1].trim();
    }
    
    const registrantOrgMatch = trimmed.match(/^Registrant Organization:\s*(.+)/i);
    if (registrantOrgMatch && !result.registrantOrg) {
      result.registrantOrg = registrantOrgMatch[1].trim();
    }
    
    const registrantEmailMatch = trimmed.match(/^Registrant Email:\s*(.+)/i);
    if (registrantEmailMatch && !result.registrantEmail) {
      result.registrantEmail = registrantEmailMatch[1].trim();
    }
    
    const dnssecMatch = trimmed.match(/^DNSSEC:\s*(.+)/i);
    if (dnssecMatch && !result.dnssec) {
      result.dnssec = dnssecMatch[1].trim();
    }
  }
  
  if (nameServers.length > 0) {
    result.nameServers = [...new Set(nameServers)];
  }
  
  if (statuses.length > 0) {
    result.status = statuses;
  }
  
  return result;
}

export async function checkSSL(domain: string, port: number = 443): Promise<SSLData> {
  return new Promise((resolve, reject) => {
    const options = {
      host: domain,
      port,
      servername: domain,
      rejectUnauthorized: false,
    };

    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate();
      const cipher = socket.getCipher();
      const protocol = socket.getProtocol();

      if (!cert || !cert.valid_from || !cert.valid_to) {
        socket.destroy();
        reject(new Error('No certificate found'));
        return;
      }

      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const sslData: SSLData = {
        issuer: cert.issuer?.CN || cert.issuer?.O || 'Unknown',
        issuerOrg: cert.issuer?.O,
        subject: cert.subject?.CN || domain,
        validFrom,
        validTo,
        daysUntilExpiry,
        serialNumber: cert.serialNumber || '',
        fingerprint: cert.fingerprint || '',
        protocol: protocol || 'unknown',
        cipher: cipher?.name,
        altNames: cert.subjectaltname?.split(', ').map((n: string) => n.replace('DNS:', '')) || [],
        isValid: socket.authorized && daysUntilExpiry > 0,
      };

      socket.destroy();
      resolve(sslData);
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

export async function lookupDNS(domain: string): Promise<DNSRecords> {
  const records: DNSRecords = {};

  const safeResolve = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch {
      return undefined;
    }
  };

  const [a, aaaa, mx, txt, ns, cname, soa] = await Promise.all([
    safeResolve(() => dnsResolve4(domain)),
    safeResolve(() => dnsResolve6(domain)),
    safeResolve(() => dnsResolveMx(domain)),
    safeResolve(() => dnsResolveTxt(domain)),
    safeResolve(() => dnsResolveNs(domain)),
    safeResolve(() => dnsResolveCname(domain)),
    safeResolve(() => dnsResolveSoa(domain)),
  ]);

  if (a) records.a = a;
  if (aaaa) records.aaaa = aaaa;
  if (mx) records.mx = mx.map(r => ({ priority: r.priority, exchange: r.exchange }));
  if (txt) records.txt = txt;
  if (ns) records.ns = ns;
  if (cname) records.cname = cname;
  if (soa) records.soa = soa;

  return records;
}

export function calculateDaysUntilExpiry(expiryDate: Date | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function detectDNSChanges(oldRecords: DNSRecords, newRecords: DNSRecords): string[] {
  const changes: string[] = [];
  
  const compareArrays = (type: string, oldArr: any[] | undefined, newArr: any[] | undefined) => {
    const oldStr = JSON.stringify(oldArr || []);
    const newStr = JSON.stringify(newArr || []);
    if (oldStr !== newStr) {
      if (!oldArr?.length && newArr?.length) {
        changes.push(`${type} records added: ${newStr}`);
      } else if (oldArr?.length && !newArr?.length) {
        changes.push(`${type} records removed`);
      } else {
        changes.push(`${type} records changed from ${oldStr} to ${newStr}`);
      }
    }
  };

  compareArrays('A', oldRecords.a, newRecords.a);
  compareArrays('AAAA', oldRecords.aaaa, newRecords.aaaa);
  compareArrays('MX', oldRecords.mx?.map(m => `${m.priority} ${m.exchange}`), newRecords.mx?.map(m => `${m.priority} ${m.exchange}`));
  compareArrays('TXT', oldRecords.txt?.flat(), newRecords.txt?.flat());
  compareArrays('NS', oldRecords.ns, newRecords.ns);
  compareArrays('CNAME', oldRecords.cname, newRecords.cname);

  return changes;
}

export function normalizeDomain(input: string): string {
  let domain = input.toLowerCase().trim();
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');
  domain = domain.split('/')[0];
  domain = domain.split(':')[0];
  return domain;
}
