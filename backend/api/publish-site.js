/**
 * Backend API Endpoint: Publish Site to Vercel
 * 
 * This should be deployed as a serverless function (e.g., Supabase Edge Function)
 * or API route that handles Vercel deployment server-side.
 * 
 * IMPORTANT: Never expose Vercel tokens to the client!
 */

const {
  createOrGetVercelProject,
  createVercelDeployment,
  waitForDeploymentReady,
  prepareFilesForVercel,
} = require('../utils/vercelApi');

/**
 * Publish a saved site to Vercel
 * 
 * @param {string} savedSiteId - ID of the saved site to publish
 * @param {string} vercelToken - Vercel API token (from server-side secrets)
 * @param {string} teamId - Optional Vercel team ID
 * @returns {Promise<{url: string, deploymentId: string, projectId: string}>}
 */
async function publishSavedSite(savedSiteId, vercelToken, teamId = null) {
  // 1. Get saved site from database
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for server-side
  );

  const { data: savedSite, error } = await supabase
    .from('saved_sites')
    .select('*')
    .eq('id', savedSiteId)
    .single();

  if (error || !savedSite) {
    throw new Error('Saved site not found');
  }

  // Validate HTML exists
  if (!savedSite.html || savedSite.html.trim().length === 0) {
    throw new Error('Saved site HTML is empty');
  }

  // 2. Create or get Vercel project
  const projectName = `site-${savedSite.slug}`;
  const project = await createOrGetVercelProject(projectName, vercelToken, teamId);

  // 3. Prepare files for deployment
  const assets = savedSite.assets || [];
  const files = prepareFilesForVercel(savedSite.html, assets);

  // 4. Create deployment with metadata
  const deployment = await createVercelDeployment(
    project.id,
    files,
    vercelToken,
    teamId,
    {
      savedSiteId: savedSite.id,
      userId: savedSite.user_id,
      slug: savedSite.slug,
    }
  );

  // 5. Wait for deployment to be ready (with timeout)
  try {
    await waitForDeploymentReady(deployment.id, vercelToken, teamId, 120000);
  } catch (error) {
    // Deployment might still be building, but we can return the URL
    console.warn('Deployment not ready yet:', error.message);
  }

  // 6. Update saved site in database
  const { error: updateError } = await supabase
    .from('saved_sites')
    .update({
      status: 'published',
      vercel: {
        projectId: project.id,
        deploymentId: deployment.id,
        url: deployment.url || `https://${projectName}.vercel.app`,
      },
    })
    .eq('id', savedSiteId);

  if (updateError) {
    console.error('Failed to update saved site:', updateError);
  }

  // 7. Log activity
  await supabase.from('activity_log').insert({
    user_id: savedSite.user_id,
    saved_site_id: savedSiteId,
    action: 'publish',
    metadata: {
      projectId: project.id,
      deploymentId: deployment.id,
      url: deployment.url,
    },
  });

  return {
    url: deployment.url || `https://${projectName}.vercel.app`,
    deploymentId: deployment.id,
    projectId: project.id,
  };
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
    const { savedSiteId } = await req.json();

    if (!savedSiteId) {
      return new Response(JSON.stringify({ error: 'savedSiteId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Vercel token from environment (server-side only!)
    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    if (!vercelToken) {
      return new Response(JSON.stringify({ error: 'Vercel token not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Optional: Get team ID from environment
    const teamId = Deno.env.get('VERCEL_TEAM_ID') || null;

    const result = await publishSavedSite(savedSiteId, vercelToken, teamId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Publish error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// For Node.js environments (if using Express, etc.)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { publishSavedSite, handler };
}

