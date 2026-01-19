/**
 * Vercel API Integration for Website Deployment
 */

interface VercelDeployment {
  id: string;
  url: string;
  name: string;
  state: 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED';
  createdAt: number;
}

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
}

interface DeployWebsiteParams {
  name: string;
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  vercelToken: string;
}

/**
 * Create a Vercel project for user websites
 */
export async function createVercelProject(
  vercelToken: string,
  projectName: string = 'User websites'
): Promise<VercelProject> {
  try {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
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
      throw new Error(error.error?.message || 'Failed to create Vercel project');
    }

    const project = await response.json();
    return {
      id: project.id,
      name: project.name,
      accountId: project.accountId,
      createdAt: project.createdAt || Date.now(),
    };
  } catch (error: any) {
    // If project already exists, try to get it
    if (error.message?.includes('already exists')) {
      return await getVercelProject(vercelToken, projectName);
    }
    throw error;
  }
}

/**
 * Get existing Vercel project
 */
export async function getVercelProject(
  vercelToken: string,
  projectName: string
): Promise<VercelProject | null> {
  try {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const projects = data.projects || [];
    const project = projects.find((p: any) => p.name === projectName);
    
    if (!project) {
      return null;
    }

    return {
      id: project.id,
      name: project.name,
      accountId: project.accountId,
      createdAt: project.createdAt || Date.now(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Deploy website to Vercel
 */
export async function deployWebsiteToVercel(
  params: DeployWebsiteParams
): Promise<VercelDeployment> {
  const { name, htmlContent, cssContent, jsContent, vercelToken } = params;

  // Get or create project
  let project = await getVercelProject(vercelToken, 'User websites');
  if (!project) {
    project = await createVercelProject(vercelToken, 'User websites');
  }

  // Helper function to encode to base64 (browser-compatible)
  const toBase64 = (str: string): string => {
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(unescape(encodeURIComponent(str)));
    }
    // Fallback for Node.js
    return Buffer.from(str).toString('base64');
  };

  // Create deployment files - Vercel expects files as base64 encoded
  const files: Record<string, string> = {};
  
  // Add HTML
  files['index.html'] = toBase64(htmlContent);
  
  if (cssContent) {
    files['styles.css'] = toBase64(cssContent);
  }

  if (jsContent) {
    files['script.js'] = toBase64(jsContent);
  }

  // Create deployment using Vercel API v13
  const response = await fetch(
    `https://api.vercel.com/v13/deployments`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
      },
      body: JSON.stringify({
        name: project.name || 'User websites',
        project: project.id,
        files: Object.entries(files).map(([path, base64Content]) => ({
          file: path,
          data: base64Content,
          encoding: 'base64',
        })),
        projectSettings: {
          framework: null,
        },
        target: 'production',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to deploy to Vercel');
  }

  const deployment = await response.json();
  const deploymentUrl = deployment.url || deployment.alias?.[0] || deployment.alias || '';
  
  return {
    id: deployment.id,
    url: deploymentUrl.startsWith('http') ? deploymentUrl : `https://${deploymentUrl}`,
    name: deployment.name || name,
    state: deployment.readyState || deployment.state || 'BUILDING',
    createdAt: deployment.createdAt || Date.now(),
  };
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(
  deploymentId: string,
  vercelToken: string
): Promise<VercelDeployment> {
  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}`,
    {
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get deployment status');
  }

  const deployment = await response.json();
  return {
    id: deployment.id,
    url: `https://${deployment.url}`,
    name: deployment.name,
    state: deployment.readyState || 'BUILDING',
    createdAt: deployment.createdAt || Date.now(),
  };
}

