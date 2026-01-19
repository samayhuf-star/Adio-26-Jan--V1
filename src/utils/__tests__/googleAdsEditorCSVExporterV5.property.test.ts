/**
 * Property-Based Tests for CSV Exporter V5 - Extension Data Preservation
 * Feature: campaign-builders-fix, Property 2: Extension Data Preservation
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import * as fc from 'fast-check';
import { 
  generateMasterCSV, 
  convertToV5Format,
  CampaignDataV5,
  SitelinkV5,
  CalloutV5,
  SnippetV5,
  CallExtensionV5,
  AppExtensionV5,
  MessageExtensionV5,
  LeadFormExtensionV5,
  PriceExtensionV5,
  PromotionV5,
  ImageAssetV5,
  VideoAssetV5,
  COLUMN_INDEX
} from '../googleAdsEditorCSVExporterV5';

// Generators for extension data
const sitelinkGenerator = fc.record({
  text: fc.string({ minLength: 1, maxLength: 25 }),
  description1: fc.option(fc.string({ maxLength: 35 })),
  description2: fc.option(fc.string({ maxLength: 35 })),
  finalUrl: fc.webUrl(),
  status: fc.constantFrom('Enabled', 'Paused')
});

const calloutGenerator = fc.record({
  text: fc.string({ minLength: 1, maxLength: 25 }),
  status: fc.constantFrom('Enabled', 'Paused'),
  startDate: fc.option(fc.string()),
  endDate: fc.option(fc.string())
});

const snippetGenerator = fc.record({
  header: fc.constantFrom('Services', 'Brands', 'Types', 'Styles', 'Models'),
  values: fc.string({ minLength: 1, maxLength: 100 }),
  status: fc.constantFrom('Enabled', 'Paused')
});

const callExtensionGenerator = fc.record({
  phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).map(s => '+1-555-' + s.slice(0, 7)),
  countryCode: fc.constantFrom('US', 'CA', 'GB'),
  verificationUrl: fc.option(fc.webUrl()),
  status: fc.constantFrom('Enabled', 'Paused'),
  scheduling: fc.option(fc.string())
});

const appExtensionGenerator = fc.record({
  appId: fc.string({ minLength: 5, maxLength: 50 }),
  appStore: fc.constantFrom('Google Play', 'Apple App Store'),
  linkText: fc.string({ minLength: 1, maxLength: 25 }),
  finalUrl: fc.webUrl(),
  status: fc.constantFrom('Enabled', 'Paused')
});

const messageExtensionGenerator = fc.record({
  text: fc.string({ minLength: 1, maxLength: 35 }),
  finalUrl: fc.option(fc.webUrl()),
  businessName: fc.string({ minLength: 1, maxLength: 50 }),
  countryCode: fc.constantFrom('US', 'CA', 'GB'),
  phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).map(s => '+1-555-' + s.slice(0, 7)),
  status: fc.constantFrom('Enabled', 'Paused')
});

const leadFormExtensionGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  headline: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.string({ minLength: 1, maxLength: 90 }),
  callToAction: fc.constantFrom('Learn More', 'Get Quote', 'Sign Up', 'Contact Us'),
  status: fc.constantFrom('Enabled', 'Paused')
});

const priceExtensionGenerator = fc.record({
  type: fc.constantFrom('Services', 'Products', 'Brands'),
  priceQualifier: fc.option(fc.constantFrom('From', 'Up to', 'Starting at')),
  items: fc.array(fc.record({
    header: fc.string({ minLength: 1, maxLength: 25 }),
    price: fc.string({ minLength: 1, maxLength: 10 }).map(s => '$' + s),
    finalUrl: fc.webUrl()
  }), { minLength: 1, maxLength: 4 })
});

const promotionGenerator = fc.record({
  target: fc.string({ minLength: 1, maxLength: 50 }),
  discountModifier: fc.option(fc.constantFrom('Up to', 'Save')),
  percentOff: fc.option(fc.integer({ min: 5, max: 50 }).map(n => n.toString())),
  moneyAmountOff: fc.option(fc.integer({ min: 10, max: 500 }).map(n => '$' + n.toString())),
  finalUrl: fc.option(fc.webUrl()),
  status: fc.constantFrom('Enabled', 'Paused'),
  startDate: fc.option(fc.string()),
  endDate: fc.option(fc.string())
});

const imageAssetGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  url: fc.webUrl(),
  status: fc.constantFrom('Enabled', 'Paused')
});

const videoAssetGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  url: fc.webUrl(),
  status: fc.constantFrom('Enabled', 'Paused')
});

// Campaign generator with all extension types
const campaignWithExtensionsGenerator = fc.record({
  campaignName: fc.string({ minLength: 1, maxLength: 50 }),
  dailyBudget: fc.integer({ min: 10, max: 1000 }),
  adGroups: fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    maxCpc: fc.float({ min: 0.1, max: 10 }),
    keywords: fc.array(fc.record({
      text: fc.string({ minLength: 1, maxLength: 80 }),
      matchType: fc.constantFrom('Broad', 'Phrase', 'Exact'),
      status: fc.constantFrom('Enabled', 'Paused')
    }), { minLength: 1, maxLength: 5 }),
    ads: fc.array(fc.record({
      type: fc.constantFrom('RSA', 'DKI', 'CallOnly'),
      headlines: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 3, maxLength: 15 }),
      descriptions: fc.array(fc.string({ minLength: 1, maxLength: 90 }), { minLength: 2, maxLength: 4 }),
      finalUrl: fc.webUrl(),
      path1: fc.option(fc.string({ maxLength: 15 })),
      path2: fc.option(fc.string({ maxLength: 15 }))
    }), { minLength: 1, maxLength: 3 })
  }), { minLength: 1, maxLength: 3 }),
  
  // Extension arrays (limited to reasonable sizes)
  sitelinks: fc.option(fc.array(sitelinkGenerator, { maxLength: 4 })),
  callouts: fc.option(fc.array(calloutGenerator, { maxLength: 4 })),
  snippets: fc.option(fc.array(snippetGenerator, { maxLength: 2 })),
  callExtensions: fc.option(fc.array(callExtensionGenerator, { maxLength: 1 })),
  appExtensions: fc.option(fc.array(appExtensionGenerator, { maxLength: 1 })),
  messageExtensions: fc.option(fc.array(messageExtensionGenerator, { maxLength: 1 })),
  leadFormExtensions: fc.option(fc.array(leadFormExtensionGenerator, { maxLength: 1 })),
  priceExtensions: fc.option(fc.array(priceExtensionGenerator, { maxLength: 1 })),
  promotions: fc.option(fc.array(promotionGenerator, { maxLength: 1 })),
  imageAssets: fc.option(fc.array(imageAssetGenerator, { maxLength: 3 })),
  videoAssets: fc.option(fc.array(videoAssetGenerator, { maxLength: 3 }))
});

// Helper function to parse CSV and extract extension data
function parseCSVLine(line: string): string[] {
  const columns = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      columns.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  columns.push(current);
  return columns;
}

function getColumnValue(row: string, columnName: string): string {
  const columns = parseCSVLine(row);
  const columnIndex = COLUMN_INDEX[columnName];
  return columnIndex !== undefined ? (columns[columnIndex] || '').replace(/^"|"$/g, '') : '';
}

describe('CSV Exporter V5 - Extension Data Preservation', () => {
  
  /**
   * Property 2: Extension Data Preservation
   * For any campaign with extensions, exporting to CSV should preserve all extension data
   * including sitelinks, callouts, structured snippets, and call extensions with proper formatting
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4
   */
  test('Property 2: Extension Data Preservation - All extension data is preserved in CSV export', () => {
    fc.assert(
      fc.property(campaignWithExtensionsGenerator, (campaignData) => {
        // Generate CSV from campaign data
        const csvContent = generateMasterCSV(campaignData as CampaignDataV5);
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        // Should have at least header + campaign row
        expect(lines.length).toBeGreaterThanOrEqual(2);
        
        // Get the campaign row (first data row)
        const campaignRow = lines[1];
        const columns = parseCSVLine(campaignRow);
        
        // Should have exactly 183 columns
        expect(columns.length).toBe(183);
        
        // Test sitelinks preservation
        if (campaignData.sitelinks && campaignData.sitelinks.length > 0) {
          for (let i = 0; i < Math.min(4, campaignData.sitelinks.length); i++) {
            const originalSitelink = campaignData.sitelinks[i];
            const csvText = getColumnValue(campaignRow, `Sitelink ${i + 1} Text`);
            const csvDesc1 = getColumnValue(campaignRow, `Sitelink ${i + 1} Description 1`);
            const csvUrl = getColumnValue(campaignRow, `Sitelink ${i + 1} Final URL`);
            const csvStatus = getColumnValue(campaignRow, `Sitelink ${i + 1} Status`);
            
            expect(csvText).toBe(originalSitelink.text);
            expect(csvDesc1).toBe(originalSitelink.description1 || '');
            expect(csvUrl).toBe(originalSitelink.finalUrl);
            expect(csvStatus).toBe(originalSitelink.status || 'Enabled');
          }
        }
        
        // Test callouts preservation
        if (campaignData.callouts && campaignData.callouts.length > 0) {
          for (let i = 0; i < Math.min(4, campaignData.callouts.length); i++) {
            const originalCallout = campaignData.callouts[i];
            const csvText = getColumnValue(campaignRow, `Callout ${i + 1} Text`);
            const csvStatus = getColumnValue(campaignRow, `Callout ${i + 1} Status`);
            
            expect(csvText).toBe(originalCallout.text);
            expect(csvStatus).toBe(originalCallout.status || 'Enabled');
          }
        }
        
        // Test structured snippets preservation
        if (campaignData.snippets && campaignData.snippets.length > 0) {
          const originalSnippet = campaignData.snippets[0];
          const csvHeader = getColumnValue(campaignRow, 'Structured Snippet Header');
          const csvValues = getColumnValue(campaignRow, 'Structured Snippet Values');
          
          expect(csvHeader).toBe(originalSnippet.header);
          expect(csvValues).toBe(originalSnippet.values);
        }
        
        // Test call extensions preservation
        if (campaignData.callExtensions && campaignData.callExtensions.length > 0) {
          const originalCallExt = campaignData.callExtensions[0];
          const csvPhone = getColumnValue(campaignRow, 'PhoneNumber');
          const csvVerification = getColumnValue(campaignRow, 'VerificationURL');
          const csvStatus = getColumnValue(campaignRow, 'Call Extension Status');
          
          expect(csvPhone).toBe(originalCallExt.phoneNumber);
          expect(csvVerification).toBe(originalCallExt.verificationUrl || '');
          expect(csvStatus).toBe(originalCallExt.status || 'Enabled');
        }
        
        // Test app extensions preservation
        if (campaignData.appExtensions && campaignData.appExtensions.length > 0) {
          const originalAppExt = campaignData.appExtensions[0];
          const csvAppId = getColumnValue(campaignRow, 'App ID');
          const csvAppStore = getColumnValue(campaignRow, 'App Store');
          const csvLinkText = getColumnValue(campaignRow, 'App Link Text');
          const csvFinalUrl = getColumnValue(campaignRow, 'App Final URL');
          const csvStatus = getColumnValue(campaignRow, 'App Status');
          
          expect(csvAppId).toBe(originalAppExt.appId);
          expect(csvAppStore).toBe(originalAppExt.appStore);
          expect(csvLinkText).toBe(originalAppExt.linkText);
          expect(csvFinalUrl).toBe(originalAppExt.finalUrl);
          expect(csvStatus).toBe(originalAppExt.status || 'Enabled');
        }
        
        // Test message extensions preservation
        if (campaignData.messageExtensions && campaignData.messageExtensions.length > 0) {
          const originalMsgExt = campaignData.messageExtensions[0];
          const csvText = getColumnValue(campaignRow, 'Message Text');
          const csvBusiness = getColumnValue(campaignRow, 'Message Business Name');
          const csvPhone = getColumnValue(campaignRow, 'Message Phone Number');
          const csvStatus = getColumnValue(campaignRow, 'Message Status');
          
          expect(csvText).toBe(originalMsgExt.text);
          expect(csvBusiness).toBe(originalMsgExt.businessName);
          expect(csvPhone).toBe(originalMsgExt.phoneNumber);
          expect(csvStatus).toBe(originalMsgExt.status || 'Enabled');
        }
        
        // Test lead form extensions preservation
        if (campaignData.leadFormExtensions && campaignData.leadFormExtensions.length > 0) {
          const originalLeadForm = campaignData.leadFormExtensions[0];
          const csvId = getColumnValue(campaignRow, 'Lead Form ID');
          const csvName = getColumnValue(campaignRow, 'Lead Form Name');
          const csvHeadline = getColumnValue(campaignRow, 'Lead Form Headline');
          const csvCTA = getColumnValue(campaignRow, 'Lead Form Call-to-action');
          
          expect(csvId).toBe(originalLeadForm.id);
          expect(csvName).toBe(originalLeadForm.name);
          expect(csvHeadline).toBe(originalLeadForm.headline);
          expect(csvCTA).toBe(originalLeadForm.callToAction);
        }
        
        // Test promotions preservation
        if (campaignData.promotions && campaignData.promotions.length > 0) {
          const originalPromo = campaignData.promotions[0];
          const csvTarget = getColumnValue(campaignRow, 'Promotion Target');
          const csvPercent = getColumnValue(campaignRow, 'Promotion Percent Off');
          const csvStatus = getColumnValue(campaignRow, 'Promotion Status');
          
          expect(csvTarget).toBe(originalPromo.target);
          expect(csvPercent).toBe(originalPromo.percentOff || '');
          expect(csvStatus).toBe(originalPromo.status || 'Enabled');
        }
        
        // Test image assets preservation (separate rows)
        if (campaignData.imageAssets && campaignData.imageAssets.length > 0) {
          const imageRows = lines.filter(line => {
            const imageName = getColumnValue(line, 'Image Asset Name');
            return imageName !== '';
          });
          
          expect(imageRows.length).toBe(campaignData.imageAssets.length);
          
          campaignData.imageAssets.forEach((originalImg, index) => {
            const csvName = getColumnValue(imageRows[index], 'Image Asset Name');
            const csvUrl = getColumnValue(imageRows[index], 'Image Asset URL');
            const csvStatus = getColumnValue(imageRows[index], 'Image Asset Status');
            
            expect(csvName).toBe(originalImg.name);
            expect(csvUrl).toBe(originalImg.url);
            expect(csvStatus).toBe(originalImg.status || 'Enabled');
          });
        }
        
        // Test video assets preservation (separate rows)
        if (campaignData.videoAssets && campaignData.videoAssets.length > 0) {
          const videoRows = lines.filter(line => {
            const videoId = getColumnValue(line, 'Video Asset ID');
            return videoId !== '';
          });
          
          expect(videoRows.length).toBe(campaignData.videoAssets.length);
          
          campaignData.videoAssets.forEach((originalVideo, index) => {
            const csvId = getColumnValue(videoRows[index], 'Video Asset ID');
            const csvName = getColumnValue(videoRows[index], 'Video Asset Name');
            const csvUrl = getColumnValue(videoRows[index], 'Video Asset URL');
            const csvStatus = getColumnValue(videoRows[index], 'Video Asset Status');
            
            expect(csvId).toBe(originalVideo.id);
            expect(csvName).toBe(originalVideo.name);
            expect(csvUrl).toBe(originalVideo.url);
            expect(csvStatus).toBe(originalVideo.status || 'Enabled');
          });
        }
        
        return true;
      }),
      { numRuns: 100 } // Run 100 iterations as specified in the design document
    );
  });
  
  /**
   * Additional property test for legacy data conversion
   * Ensures that legacy extension data is properly converted and preserved
   */
  test('Property 2a: Legacy Extension Data Conversion Preservation', () => {
    const legacyExtensionGenerator = fc.record({
      campaignName: fc.string({ minLength: 1, maxLength: 50 }),
      extensions: fc.array(fc.oneof(
        fc.record({
          type: fc.constant('sitelink'),
          text: fc.string({ minLength: 1, maxLength: 25 }),
          url: fc.webUrl()
        }),
        fc.record({
          type: fc.constant('callout'),
          text: fc.string({ minLength: 1, maxLength: 25 })
        }),
        fc.record({
          type: fc.constant('snippet'),
          header: fc.constantFrom('Services', 'Brands'),
          values: fc.string({ minLength: 1, maxLength: 100 })
        }),
        fc.record({
          type: fc.constant('call'),
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).map(s => '+1-555-' + s.slice(0, 7))
        })
      ), { maxLength: 10 }),
      adGroups: fc.array(fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        keywords: fc.array(fc.string({ minLength: 1, maxLength: 80 }), { minLength: 1, maxLength: 3 })
      }), { minLength: 1, maxLength: 2 })
    });
    
    fc.assert(
      fc.property(legacyExtensionGenerator, (legacyData) => {
        // Convert legacy data to V5 format
        const v5Campaign = convertToV5Format(legacyData);
        
        // Generate CSV
        const csvContent = generateMasterCSV(v5Campaign);
        const lines = csvContent.split('\n').filter(line => line.trim());
        const campaignRow = lines[1];
        
        // Verify that legacy extensions were converted and preserved
        const sitelinkExts = legacyData.extensions.filter(e => e.type === 'sitelink');
        const calloutExts = legacyData.extensions.filter(e => e.type === 'callout');
        const snippetExts = legacyData.extensions.filter(e => e.type === 'snippet');
        const callExts = legacyData.extensions.filter(e => e.type === 'call');
        
        // Check sitelinks
        if (sitelinkExts.length > 0) {
          const csvText = getColumnValue(campaignRow, 'Sitelink 1 Text');
          const csvUrl = getColumnValue(campaignRow, 'Sitelink 1 Final URL');
          expect(csvText).toBe(sitelinkExts[0].text);
          expect(csvUrl).toBe(sitelinkExts[0].url);
        }
        
        // Check callouts
        if (calloutExts.length > 0) {
          const csvText = getColumnValue(campaignRow, 'Callout 1 Text');
          expect(csvText).toBe(calloutExts[0].text);
        }
        
        // Check snippets
        if (snippetExts.length > 0) {
          const csvHeader = getColumnValue(campaignRow, 'Structured Snippet Header');
          expect(csvHeader).toBe(snippetExts[0].header);
        }
        
        // Check call extensions
        if (callExts.length > 0) {
          const csvPhone = getColumnValue(campaignRow, 'PhoneNumber');
          expect(csvPhone).toBe(callExts[0].phoneNumber);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});