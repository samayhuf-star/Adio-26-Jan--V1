/**
 * Site Download Utilities
 * Handles ZIP creation and download for saved sites
 */

import JSZip from 'jszip';

export interface SiteAsset {
  path: string;
  content: string;
  encoding?: string;
}

/**
 * Create ZIP file from saved site
 */
export async function createSiteZip(
  html: string,
  assets: SiteAsset[] = [],
  policies: { privacy?: string; terms?: string } = {}
): Promise<Blob> {
  const zip = new JSZip();

  // Add main HTML file
  zip.file('index.html', html);

  // Add assets
  assets.forEach((asset) => {
    const encoding = asset.encoding === 'base64' ? 'base64' : undefined;
    zip.file(asset.path, asset.content, { base64: encoding === 'base64' });
  });

  // Add policies folder
  if (policies.privacy || policies.terms) {
    const policiesFolder = zip.folder('policies');
    if (policiesFolder) {
      if (policies.privacy) {
        policiesFolder.file('privacy.html', policies.privacy);
      }
      if (policies.terms) {
        policiesFolder.file('terms.html', policies.terms);
      }
    }
  }

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Download site as ZIP
 */
export function downloadSiteZip(
  blob: Blob,
  filename: string = 'site.zip'
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate policy HTML from template
 */
export function generatePolicyHTML(
  policyType: 'privacy' | 'terms',
  content: string,
  businessName: string,
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  },
  accent: string = '#16a34a',
  accentAlt: string = '#059669'
): string {
  const policyTitle = policyType === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  const lastUpdated = new Date().toISOString().split('T')[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${policyTitle} - ${businessName}</title>
    <style>
        :root {
            --accent: ${accent};
            --accent-alt: ${accentAlt};
            --text-primary: #333;
            --text-secondary: #666;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.8;
            color: var(--text-primary);
            background: #fff;
        }
        .policy-page {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 20px;
        }
        .policy-header {
            border-bottom: 2px solid var(--accent);
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }
        .policy-header h1 {
            font-size: 2.5rem;
            color: var(--accent);
            margin-bottom: 0.5rem;
        }
        .policy-content h2 {
            font-size: 1.8rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: var(--accent);
        }
        .policy-content p, .policy-content li {
            margin-bottom: 1rem;
        }
        .policy-content ul {
            margin-left: 2rem;
        }
        .contact-info {
            background: #f5f5f5;
            padding: 1.5rem;
            border-radius: 8px;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="policy-page">
        <div class="policy-header">
            <h1>${policyTitle}</h1>
            <p>Last Updated: ${lastUpdated}</p>
        </div>
        <div class="policy-content">
            ${content}
        </div>
        <div class="contact-info">
            <h3>Contact Us</h3>
            <p>If you have questions about this ${policyTitle}, please contact us:</p>
            <ul>
                ${contact.email ? `<li>Email: <a href="mailto:${contact.email}">${contact.email}</a></li>` : ''}
                ${contact.phone ? `<li>Phone: <a href="tel:${contact.phone}">${contact.phone}</a></li>` : ''}
                ${contact.address ? `<li>Address: ${contact.address}</li>` : ''}
            </ul>
        </div>
    </div>
</body>
</html>`;
}

