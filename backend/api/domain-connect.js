/**
 * Backend API Endpoint: Connect Domain to Vercel Project
 * 
 * This should be deployed as a serverless function that handles domain management server-side.
 */

const {
  addDomainToProject,
  getDomainDNSRecords,
  verifyDomain,
} = require('../utils/vercelApi');

/**
 * Add domain to a published site
 * 
 * @param {string} savedSiteId - ID of the saved site
 * @param {string} domain - Domain name to add (e.g., 'example.com')
 * @param {string} vercelToken - Vercel API token
 * @param {string} teamId - Optional Vercel team ID
 * @returns {Promise<{domain: string, dnsRecords: Array, verified: boolean}>}
 */
async function connectDomain(savedSiteId, domain, vercelToken, teamId = null) {
  // 1. Get saved site from database
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: savedSite, error } = await supabase
    .from('saved_sites')
    .select('*')
    .eq('id', savedSiteId)
    .single();

  if (error || !savedSite) {
    throw new Error('Saved site not found');
  }

  if (savedSite.status !== 'published' || !savedSite.vercel?.projectId) {
    throw new Error('Site must be published before connecting domain');
  }

  const projectId = savedSite.vercel.projectId;

  // 2. Add domain to Vercel project
  try {
    await addDomainToProject(projectId, domain, vercelToken, teamId);
  } catch (error) {
    // Domain might already exist or be owned by another account
    if (error.message.includes('already exists') || error.message.includes('owned')) {
      throw new Error(`Domain ${domain} is already connected to another Vercel account. Please remove it first or contact support.`);
    }
    throw error;
  }

  // 3. Get DNS records needed
  const dnsRecords = await getDomainDNSRecords(projectId, domain, vercelToken, teamId);

  // 4. Try to verify domain (might fail if DNS not configured yet)
  let verified = false;
  try {
    const verification = await verifyDomain(projectId, domain, vercelToken, teamId);
    verified = verification.verified || false;
  } catch (error) {
    // Domain verification will fail until DNS is configured - this is expected
    console.log('Domain verification pending DNS configuration');
  }

  // 5. Log activity
  await supabase.from('activity_log').insert({
    user_id: savedSite.user_id,
    saved_site_id: savedSiteId,
    action: 'domain_connect',
    metadata: {
      domain,
      verified,
      dnsRecords,
    },
  });

  return {
    domain,
    dnsRecords,
    verified,
    instructions: generateDNSInstructions(domain, dnsRecords),
  };
}

/**
 * Generate human-readable DNS instructions
 */
function generateDNSInstructions(domain, dnsRecords) {
  const instructions = [];

  dnsRecords.forEach((record) => {
    if (record.type === 'A') {
      instructions.push({
        type: 'A',
        name: record.name === '@' ? domain : `${record.name}.${domain}`,
        value: record.value,
        ttl: record.ttl || 3600,
        description: `Add an A record pointing ${record.name === '@' ? 'the apex domain' : record.name} to ${record.value}`,
      });
    } else if (record.type === 'CNAME') {
      instructions.push({
        type: 'CNAME',
        name: record.name === 'www' ? `www.${domain}` : `${record.name}.${domain}`,
        value: record.value,
        ttl: record.ttl || 3600,
        description: `Add a CNAME record pointing ${record.name} to ${record.value}`,
      });
    }
  });

  return instructions;
}

/**
 * Check domain verification status
 */
async function checkDomainStatus(savedSiteId, domain, vercelToken, teamId = null) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: savedSite } = await supabase
    .from('saved_sites')
    .select('vercel')
    .eq('id', savedSiteId)
    .single();

  if (!savedSite?.vercel?.projectId) {
    throw new Error('Site not published');
  }

  try {
    const verification = await verifyDomain(
      savedSite.vercel.projectId,
      domain,
      vercelToken,
      teamId
    );

    return {
      verified: verification.verified || false,
      verification: verification.verification,
    };
  } catch (error) {
    return {
      verified: false,
      error: error.message,
    };
  }
}

/**
 * Example Supabase Edge Function handler
 */
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { savedSiteId, domain, action } = await req.json();

    if (!savedSiteId || !domain) {
      return new Response(JSON.stringify({ error: 'savedSiteId and domain are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    if (!vercelToken) {
      return new Response(JSON.stringify({ error: 'Vercel token not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const teamId = Deno.env.get('VERCEL_TEAM_ID') || null;

    if (action === 'check') {
      const status = await checkDomainStatus(savedSiteId, domain, vercelToken, teamId);
      return new Response(JSON.stringify(status), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await connectDomain(savedSiteId, domain, vercelToken, teamId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Domain connect error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { connectDomain, checkDomainStatus, handler };
}

