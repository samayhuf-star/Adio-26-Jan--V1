/**
 * Vercel API Integration
 * Server-side utilities for deploying sites to Vercel
 */

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
}

export interface VercelDeployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
  readyAt?: number;
  meta?: Record<string, string>;
}

export interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string;
  redirectStatusCode?: number;
  gitBranch?: string;
  updatedAt?: number;
  createdAt?: number;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  };
}

export interface VercelDNSRecord {
  type: 'A' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  value: string;
  ttl?: number;
}

export interface VercelProjectDomain {
  domain: string;
  redirect?: string;
  redirectStatusCode?: number;
  gitBranch?: string;
  updatedAt?: number;
  createdAt?: number;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  };
}

/**
 * Create or get a Vercel project
 */
export async function createOrGetVercelProject(
  projectName: string,
  vercelToken: string,
  teamId?: string
): Promise<VercelProject> {
  const url = teamId
    ? `https://api.vercel.com/v11/projects?teamId=${teamId}`
    : 'https://api.vercel.com/v11/projects';

  // First, try to find existing project
  const listResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (listResponse.ok) {
    const projects = await listResponse.json();
    const existing = projects.projects?.find((p: any) => p.name === projectName);
    if (existing) {
      return existing;
    }
  }

  // Create new project
  const createUrl = teamId
    ? `https://api.vercel.com/v11/projects?teamId=${teamId}`
    : 'https://api.vercel.com/v11/projects';

  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      framework: null, // Static site
      publicSource: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create Vercel project: ${error.error?.message || error.message}`);
  }

  return response.json();
}

/**
 * Prepare files for Vercel deployment
 */
export function prepareFilesForVercel(html: string, assets: Array<{ path: string; content: string; encoding?: string }>): Record<string, { data: string; encoding?: string }> {
  const files: Record<string, { data: string; encoding?: string }> = {
    'index.html': {
      data: html,
      encoding: 'utf-8',
    },
  };

  // Add assets
  assets.forEach((asset) => {
    files[asset.path] = {
      data: asset.content,
      encoding: asset.encoding || 'utf-8',
    };
  });

  return files;
}

/**
 * Create a Vercel deployment
 */
export async function createVercelDeployment(
  projectId: string,
  files: Record<string, { data: string; encoding?: string }>,
  vercelToken: string,
  teamId?: string,
  meta?: Record<string, string>
): Promise<VercelDeployment> {
  const url = teamId
    ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
    : 'https://api.vercel.com/v13/deployments';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectId,
      files,
      projectSettings: {
        framework: null,
      },
      meta: meta || {},
      target: 'production',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create deployment: ${error.error?.message || error.message}`);
  }

  return response.json();
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(
  deploymentId: string,
  vercelToken: string,
  teamId?: string
): Promise<VercelDeployment> {
  const url = teamId
    ? `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${teamId}`
    : `https://api.vercel.com/v13/deployments/${deploymentId}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${vercelToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get deployment status: ${error.error?.message || error.message}`);
  }

  return response.json();
}

/**
 * Wait for deployment to be ready
 */
export async function waitForDeploymentReady(
  deploymentId: string,
  vercelToken: string,
  teamId?: string,
  maxWaitTime: number = 120000, // 2 minutes
  pollInterval: number = 2000 // 2 seconds
): Promise<VercelDeployment> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const deployment = await getDeploymentStatus(deploymentId, vercelToken, teamId);

    if (deployment.readyState === 'READY') {
      return deployment;
    }

    if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
      throw new Error(`Deployment failed with state: ${deployment.readyState}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Deployment timeout: deployment did not become ready in time');
}

/**
 * Add domain to Vercel project
 */
export async function addDomainToProject(
  projectId: string,
  domain: string,
  vercelToken: string,
  teamId?: string
): Promise<VercelProjectDomain> {
  const url = teamId
    ? `https://api.vercel.com/v11/projects/${projectId}/domains?teamId=${teamId}`
    : `https://api.vercel.com/v11/projects/${projectId}/domains`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: domain,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to add domain: ${error.error?.message || error.message}`);
  }

  return response.json();
}

/**
 * Get project domain configuration (for DNS records)
 */
export async function getProjectDomainConfig(
  projectId: string,
  vercelToken: string,
  teamId?: string
): Promise<{ apex: string[]; www: string }> {
  // Vercel provides DNS configuration in project settings
  // For A records, we need to get the recommended IPs from Vercel
  const url = teamId
    ? `https://api.vercel.com/v11/projects/${projectId}/domains?teamId=${teamId}`
    : `https://api.vercel.com/v11/projects/${projectId}/domains`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${vercelToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get domain config: ${error.error?.message || error.message}`);
  }

  const domains = await response.json();

  // Vercel typically uses these IPs for A records (but should be fetched from project settings)
  // For production, these should come from Vercel's API response
  // Default Vercel IPs (these should be fetched from Vercel's domain settings API)
  return {
    apex: ['76.76.21.21'], // This should come from Vercel API - placeholder
    www: 'cname.vercel-dns.com', // CNAME target
  };
}

/**
 * Verify domain
 */
export async function verifyDomain(
  projectId: string,
  domain: string,
  vercelToken: string,
  teamId?: string
): Promise<{ verified: boolean; verification?: any }> {
  const url = teamId
    ? `https://api.vercel.com/v11/projects/${projectId}/domains/${domain}/verify?teamId=${teamId}`
    : `https://api.vercel.com/v11/projects/${projectId}/domains/${domain}/verify`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to verify domain: ${error.error?.message || error.message}`);
  }

  return response.json();
}

/**
 * Get domain DNS records needed
 */
export async function getDomainDNSRecords(
  projectId: string,
  domain: string,
  vercelToken: string,
  teamId?: string
): Promise<VercelDNSRecord[]> {
  // This should fetch from Vercel's domain configuration
  // For now, return standard Vercel DNS records
  const config = await getProjectDomainConfig(projectId, vercelToken, teamId);

  const records: VercelDNSRecord[] = [];

  // Apex domain - A records
  config.apex.forEach((ip) => {
    records.push({
      type: 'A',
      name: '@',
      value: ip,
      ttl: 3600,
    });
  });

  // WWW subdomain - CNAME
  records.push({
    type: 'CNAME',
    name: 'www',
    value: config.www,
    ttl: 3600,
  });

  return records;
}

