/**
 * Test CSV Generation Script
 * Generates a test CSV from sample preset data and validates it
 */

const fs = require('fs');
const path = require('path');

// Sample campaign structure based on presets
const sampleCampaignStructure = {
  campaigns: [
    {
      campaign_name: 'Test Campaign - Locksmith Services',
      budget: '100',
      budget_type: 'Daily',
      bidding_strategy: 'Manual CPC',
      start_date: '2025-01-01',
      end_date: '',
      location_type: 'COUNTRY',
      location_code: 'US',
      targetCountry: 'United States',
      states: [],
      cities: [],
      zip_codes: [],
      adgroups: [
        {
          adgroup_name: 'Emergency Locksmith',
          keywords: [
            'emergency locksmith',
            'emergency locksmith near me',
            '24 hour locksmith',
            'locksmith service',
            'locksmith repair'
          ],
          match_types: ['Broad', 'Phrase', 'Exact'],
          negative_keywords: [
            'free',
            'cheap',
            'jobs',
            'training',
            'DIY'
          ],
          ads: [
            {
              headline1: '24/7 Emergency Locksmith',
              headline2: 'Fast Lockout Service',
              headline3: 'Car & Home Lock Services',
              headline4: 'Licensed & Insured',
              headline5: 'Available 24 Hours',
              headline6: '',
              headline7: '',
              headline8: '',
              headline9: '',
              headline10: '',
              headline11: '',
              headline12: '',
              headline13: '',
              headline14: '',
              headline15: '',
              description1: 'Quick arrival & fair pricing. Call for emergency lockout help.',
              description2: 'Rekey, replace, install locks. Professional service guaranteed.',
              description3: 'Same-day service available. Trusted by thousands.',
              description4: '',
              final_url: 'https://adiology.online/locksmith?utm_source=adiology&utm_medium=ads&utm_campaign=locksmith_test',
              final_mobile_url: '',
              path1: 'locksmith',
              path2: 'emergency',
            },
            {
              headline1: 'Emergency Locksmith Near You',
              headline2: 'Fast Response Time',
              headline3: 'Professional Lock Services',
              headline4: '24/7 Available',
              headline5: 'Licensed Professionals',
              headline6: '',
              headline7: '',
              headline8: '',
              headline9: '',
              headline10: '',
              headline11: '',
              headline12: '',
              headline13: '',
              headline14: '',
              headline15: '',
              description1: 'Get help fast when locked out. Professional locksmith services.',
              description2: 'Car, home, and business lock services. Call now!',
              description3: '',
              description4: '',
              final_url: 'https://adiology.online/locksmith?utm_source=adiology&utm_medium=ads&utm_campaign=locksmith_test',
              final_mobile_url: '',
              path1: 'locksmith',
              path2: 'service',
            },
            {
              headline1: 'Trusted Locksmith Service',
              headline2: 'Quick & Reliable',
              headline3: 'Emergency Lockout Help',
              headline4: 'Professional Team',
              headline5: 'Available Now',
              headline6: '',
              headline7: '',
              headline8: '',
              headline9: '',
              headline10: '',
              headline11: '',
              headline12: '',
              headline13: '',
              headline14: '',
              headline15: '',
              description1: 'Experienced locksmiths ready to help. Fast service guaranteed.',
              description2: 'Lock repair, rekey, and installation. Call today!',
              description3: '',
              description4: '',
              final_url: 'https://adiology.online/locksmith?utm_source=adiology&utm_medium=ads&utm_campaign=locksmith_test',
              final_mobile_url: '',
              path1: 'locksmith',
              path2: 'repair',
            }
          ]
        },
        {
          adgroup_name: 'Car Locksmith',
          keywords: [
            'car locksmith',
            'car lockout service',
            'auto locksmith',
            'car key replacement',
            'vehicle lockout'
          ],
          match_types: ['Broad', 'Phrase', 'Exact'],
          negative_keywords: [
            'free',
            'cheap',
            'jobs',
            'training'
          ],
          ads: [
            {
              headline1: 'Car Lockout Service',
              headline2: 'Fast Auto Locksmith',
              headline3: '24/7 Car Key Help',
              headline4: 'Professional Service',
              headline5: 'Quick Response',
              headline6: '',
              headline7: '',
              headline8: '',
              headline9: '',
              headline10: '',
              headline11: '',
              headline12: '',
              headline13: '',
              headline14: '',
              headline15: '',
              description1: 'Locked out of your car? We can help fast. Professional auto locksmith.',
              description2: 'Car key replacement and lock repair. Available 24/7.',
              description3: '',
              description4: '',
              final_url: 'https://adiology.online/locksmith?utm_source=adiology&utm_medium=ads&utm_campaign=locksmith_test',
              final_mobile_url: '',
              path1: 'car',
              path2: 'locksmith',
            },
            {
              headline1: 'Auto Locksmith Near You',
              headline2: 'Car Key Replacement',
              headline3: 'Emergency Car Help',
              headline4: 'Fast Service',
              headline5: 'Professional Team',
              headline6: '',
              headline7: '',
              headline8: '',
              headline9: '',
              headline10: '',
              headline11: '',
              headline12: '',
              headline13: '',
              headline14: '',
              headline15: '',
              description1: 'Expert car locksmith services. Quick response guaranteed.',
              description2: 'Car lockout, key replacement, and more. Call now!',
              description3: '',
              description4: '',
              final_url: 'https://adiology.online/locksmith?utm_source=adiology&utm_medium=ads&utm_campaign=locksmith_test',
              final_mobile_url: '',
              path1: 'car',
              path2: 'key',
            }
          ]
        }
      ]
    }
  ]
};

// Convert to the format expected by the exporter
function convertToCampaignStructure(data) {
  return {
    campaigns: data.campaigns.map(campaign => ({
      campaign_name: campaign.campaign_name,
      budget: campaign.budget,
      budget_type: campaign.budget_type,
      bidding_strategy: campaign.bidding_strategy,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      location_type: campaign.location_type,
      location_code: campaign.location_code,
      targetCountry: campaign.targetCountry,
      states: campaign.states || [],
      cities: campaign.cities || [],
      zip_codes: campaign.zip_codes || [],
      adgroups: campaign.adgroups.map(adGroup => ({
        adgroup_name: adGroup.adgroup_name,
        keywords: adGroup.keywords,
        match_types: adGroup.match_types || [],
        negative_keywords: adGroup.negative_keywords || [],
        ads: adGroup.ads.map(ad => ({
          headline1: ad.headline1 || '',
          headline2: ad.headline2 || '',
          headline3: ad.headline3 || '',
          headline4: ad.headline4 || '',
          headline5: ad.headline5 || '',
          headline6: ad.headline6 || '',
          headline7: ad.headline7 || '',
          headline8: ad.headline8 || '',
          headline9: ad.headline9 || '',
          headline10: ad.headline10 || '',
          headline11: ad.headline11 || '',
          headline12: ad.headline12 || '',
          headline13: ad.headline13 || '',
          headline14: ad.headline14 || '',
          headline15: ad.headline15 || '',
          description1: ad.description1 || '',
          description2: ad.description2 || '',
          description3: ad.description3 || '',
          description4: ad.description4 || '',
          final_url: ad.final_url || '',
          final_mobile_url: ad.final_mobile_url || '',
          path1: ad.path1 || '',
          path2: ad.path2 || '',
        }))
      }))
    }))
  };
}

// Note: This is a Node.js script, but the actual CSV generation uses browser APIs
// We'll create a simplified version that shows the structure
console.log('Test Campaign Structure:');
console.log(JSON.stringify(convertToCampaignStructure(sampleCampaignStructure), null, 2));

console.log('\n✅ Sample campaign structure created successfully!');
console.log('\nTo test the CSV generation:');
console.log('1. Open the application in a browser');
console.log('2. Navigate to Campaign Builder 3.0');
console.log('3. Use the sample data above to create a campaign');
console.log('4. Export the CSV and validate it in Google Ads Editor');
console.log('\nThe CSV should have:');
console.log('- Type column (first)');
console.log('- Operation column (second, value: ADD)');
console.log('- UTF-8 BOM encoding');
console.log('- CRLF line endings');
console.log('- Proper column names matching Google Ads Editor format');
