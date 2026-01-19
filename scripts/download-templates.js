const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');

// Templates already downloaded (10 successful)
const ALREADY_DOWNLOADED = [
  '3-col-portfolio',
  'above-educational-bootstrap-responsive-template',
  'ace-responsive-coming-soon-template',
  'add-life-health-fitness-free-bootstrap-html5-template',
  'aerosky-real-estate-html-responsive-website-template',
  'agile-agency-free-bootstrap-web-template',
  'alive-responsive-coming-soon-template',
  'amaze-photography-bootstrap-html5-template',
  'aroma-beauty-and-spa-responsive-bootstrap-template',
  'atlanta-free-business-bootstrap-template',
];

// 15 additional templates to download (from available templates in repo)
const TEMPLATES = [
  'avenger-multi-purpose-responsive-html5-bootstrap-template',
  'b-school-free-education-html5-website-template',
  'basic-free-html5-template-for-multi-purpose',
  'beauty-salon-bootstrap-html5-template',
  'bestro-restaurant-bootstrap-html5-template',
  'blazer-responsive-html5-coming-soon-template',
  'brand-html5-app-landing-page-responsive-web-template',
  'businessline-corporate-portfolio-bootstrap-responsive-web-template',
  'businessr-corporate-bootstrap-responsive-web-template',
  'car-care-auto-mobile-html5-bootstrap-web-template',
  'car-repair-html5-bootstrap-template',
  'car-zone-automobile-bootstrap-responsive-web-template',
  'city-square-bootstrap-responsive-web-template',
  'cloud-hosting-free-bootstrap-responsive-website-template',
  'clouds-html5-multipurpose-landing-page-template',
];

const BASE_URL = 'https://raw.githubusercontent.com/samayhuf-star/website-templates/master';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'web-templates-2');

// Helper function to sanitize and validate file paths to prevent path traversal
function sanitizePath(baseDir, userPath) {
  // Remove leading slashes and normalize separators
  const cleanPath = userPath.replace(/^\/+/, '').replace(/\\/g, '/');
  
  // Remove any path traversal sequences
  if (cleanPath.includes('..') || cleanPath.includes('./')) {
    throw new Error(`Path traversal detected in: ${userPath}`);
  }
  
  // Resolve path relative to base directory
  const resolvedPath = path.resolve(baseDir, cleanPath);
  const resolvedBase = path.resolve(baseDir);
  
  // Verify the resolved path is still within the base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error(`Path traversal detected: resolved path outside base directory`);
  }
  
  return resolvedPath;
}

// Helper function to sanitize template ID to prevent path traversal
function sanitizeTemplateId(templateId) {
  // Only allow alphanumeric characters, dashes, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
    throw new Error(`Invalid template ID: ${templateId}`);
  }
  return templateId;
}

// Helper function to download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirects
        return downloadFile(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// Helper function to get all files in a directory from GitHub
async function getDirectoryFiles(templateId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/samayhuf-star/website-templates/contents/${templateId}`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'Node.js'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          try {
            const files = JSON.parse(data);
            resolve(files);
          } catch (e) {
            reject(new Error('Failed to parse GitHub API response'));
          }
        } else {
          reject(new Error(`GitHub API error: ${response.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// Download a template and all its assets
async function downloadTemplate(templateId) {
  // Sanitize template ID to prevent path traversal
  const safeTemplateId = sanitizeTemplateId(templateId);
  const templateDir = path.join(OUTPUT_DIR, safeTemplateId);
  await fs.ensureDir(templateDir);
  
  console.log(`\n📦 Downloading ${safeTemplateId}...`);
  
  // Try to get directory structure from GitHub API
  let files = [];
  try {
    files = await getDirectoryFiles(safeTemplateId);
  } catch (error) {
    console.log(`⚠️  Could not get directory structure, trying direct download...`);
  }
  
  // Download index.html first
  const htmlPaths = [
    `${safeTemplateId}/index.html`,
    `${safeTemplateId}.html`,
  ];
  
  let htmlDownloaded = false;
  for (const htmlPath of htmlPaths) {
    try {
      const htmlUrl = `${BASE_URL}/${htmlPath}`;
      const htmlPath_local = path.join(templateDir, 'index.html');
      
      await downloadFile(htmlUrl, htmlPath_local);
      console.log(`  ✅ Downloaded index.html`);
      htmlDownloaded = true;
      
      // Read HTML to find assets
      const htmlContent = await fs.readFile(htmlPath_local, 'utf-8');
      
      // Extract CSS, JS, and image paths
      const cssMatches = htmlContent.match(/href=["']([^"']+\.css[^"']*)["']/gi) || [];
      const jsMatches = htmlContent.match(/src=["']([^"']+\.js[^"']*)["']/gi) || [];
      const imgMatches = htmlContent.match(/src=["']([^"']+\.(png|jpg|jpeg|gif|svg|ico|webp)[^"']*)["']/gi) || [];
      const bgMatches = htmlContent.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi) || [];
      
      const allAssets = new Set();
      
      // Extract paths
      [...cssMatches, ...jsMatches, ...imgMatches].forEach(match => {
        const pathMatch = match.match(/["']([^"']+)["']/);
        if (pathMatch && pathMatch[1]) {
          const assetPath = pathMatch[1];
          if (!assetPath.startsWith('http') && !assetPath.startsWith('//') && !assetPath.startsWith('data:')) {
            allAssets.add(assetPath);
          }
        }
      });
      
      bgMatches.forEach(match => {
        const pathMatch = match.match(/url\(["']?([^"')]+)["']?\)/);
        if (pathMatch && pathMatch[1]) {
          const assetPath = pathMatch[1];
          if (!assetPath.startsWith('http') && !assetPath.startsWith('//') && !assetPath.startsWith('data:')) {
            allAssets.add(assetPath);
          }
        }
      });
      
      // Download assets
      for (const assetPath of allAssets) {
        try {
          // Sanitize and validate the asset path to prevent path traversal
          const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
          const assetLocalPath = sanitizePath(templateDir, cleanPath);
          const assetUrl = `${BASE_URL}/${safeTemplateId}/${cleanPath}`;
          
          // Ensure directory exists
          await fs.ensureDir(path.dirname(assetLocalPath));
          
          await downloadFile(assetUrl, assetLocalPath);
          console.log(`  ✅ Downloaded ${cleanPath}`);
        } catch (error) {
          // Log path traversal attempts as warnings
          if (error.message.includes('Path traversal')) {
            console.log(`  ⚠️  Security: Blocked potentially malicious path: ${assetPath}`);
          } else {
            console.log(`  ⚠️  Could not download ${assetPath}: ${error.message}`);
          }
        }
      }
      
      break;
    } catch (error) {
      continue;
    }
  }
  
  if (!htmlDownloaded) {
    throw new Error(`Could not download HTML for ${safeTemplateId}`);
  }
  
  console.log(`  ✨ Completed ${safeTemplateId}`);
}

// Main function
async function main() {
  console.log('🚀 Starting template download...\n');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  
  // Create output directory
  await fs.ensureDir(OUTPUT_DIR);
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const templateId of TEMPLATES) {
    try {
      await downloadTemplate(templateId);
      results.success.push(templateId);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  ❌ Error downloading ${templateId}:`, error.message);
      results.failed.push({ id: templateId, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Download Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully downloaded: ${results.success.length} templates`);
  console.log(`❌ Failed: ${results.failed.length} templates`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed templates:');
    results.failed.forEach(({ id, error }) => {
      console.log(`  - ${id}: ${error}`);
    });
  }
  
  console.log('\n✨ Done!');
}

main().catch(console.error);

