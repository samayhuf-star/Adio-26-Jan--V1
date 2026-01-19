import express from 'express';
import { generateOneClickCampaign } from '../services/one-click-campaign-engine.js';
import { supabaseAdmin } from '../lib/supabase-server.js';

const router = express.Router();

/**
 * POST /api/campaigns/one-click
 * Generate a one-click campaign from website URL
 */
router.post('/one-click', async (req, res) => {
  try {
    const { websiteUrl, userId } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({ error: 'Website URL is required' });
    }

    // Generate campaign
    const result = await generateOneClickCampaign(
      websiteUrl,
      userId,
      null // No real-time progress in POST
    );

    // Save to database
    const { data, error } = await supabaseAdmin
      .from('adiology_campaigns')
      .insert([
        {
          user_id: userId,
          campaign_name: result.campaign.campaign_name,
          business_name: result.websiteAnalysis.businessName,
          website_url: websiteUrl,
          business_type: result.websiteAnalysis.industry,
          target_audience: result.websiteAnalysis.targetAudience,
          monthly_budget: result.campaignStructure.budget,
          daily_budget: result.campaignStructure.dailyBudget,
          seed_keywords: result.keywords.seedKeywords,
          campaign_data: {
            analysis: result.websiteAnalysis,
            structure: result.campaignStructure,
            adGroups: result.adGroups,
            adCopy: result.adCopy,
            csvData: result.csvData
          },
          status: 'draft'
        }
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save campaign',
        data: result // Still return the generated data
      });
    }

    res.json({
      success: true,
      campaign: data[0],
      csvData: result.csvData
    });
  } catch (error) {
    console.error('Error generating one-click campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/campaigns/one-click-stream
 * Server-Sent Events endpoint for real-time progress
 */
router.get('/one-click-stream', async (req, res) => {
  try {
    const { url, userId } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Progress callback
    const sendProgress = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Generate campaign with progress
    const result = await generateOneClickCampaign(url, userId, sendProgress);

    // Save to database
    const { data: savedData, error } = await supabaseAdmin
      .from('adiology_campaigns')
      .insert([
        {
          user_id: userId,
          campaign_name: result.campaign.campaign_name,
          business_name: result.websiteAnalysis.businessName,
          website_url: url,
          business_type: result.websiteAnalysis.industry,
          target_audience: result.websiteAnalysis.targetAudience,
          monthly_budget: result.campaignStructure.budget,
          daily_budget: result.campaignStructure.dailyBudget,
          seed_keywords: result.keywords.seedKeywords,
          campaign_data: {
            analysis: result.websiteAnalysis,
            structure: result.campaignStructure,
            adGroups: result.adGroups,
            adCopy: result.adCopy,
            csvData: result.csvData
          },
          status: 'draft'
        }
      ])
      .select();

    // Send final result
    res.write(`data: ${JSON.stringify({
      step: 7,
      status: 'Complete!',
      progress: 100,
      campaign: savedData?.[0] || result.campaign
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Error in one-click-stream:', error);
    res.write(`data: ${JSON.stringify({
      error: error.message
    })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/campaigns/save-from-onec click
 * Save a generated campaign to saved campaigns
 */
router.post('/save-from-oneclick', async (req, res) => {
  try {
    const { campaignData, userId } = req.body;

    // Save campaign
    const { data, error } = await supabaseAdmin
      .from('adiology_campaigns')
      .insert([
        {
          user_id: userId,
          ...campaignData,
          status: 'draft'
        }
      ])
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Campaign saved to Saved Campaigns',
      data: data[0]
    });
  } catch (error) {
    console.error('Error saving campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/campaigns/download-csv/:campaignId
 * Download CSV for a campaign
 */
router.get('/download-csv/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Get campaign from database
    const { data, error } = await supabaseAdmin
      .from('adiology_campaigns')
      .select('campaign_data')
      .eq('id', campaignId)
      .single();

    if (error) throw error;

    const csvData = data.campaign_data?.csvData;
    if (!csvData) {
      return res.status(404).json({ error: 'CSV data not found' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${campaignId}.csv"`);
    res.send(csvData);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
