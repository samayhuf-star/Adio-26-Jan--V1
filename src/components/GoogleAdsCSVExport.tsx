import React, { useState } from 'react';
import { Download, FileCheck, FileText, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import Papa from 'papaparse';

// Google Ads Editor CSV Schema - Complete header list
const GOOGLE_ADS_CSV_HEADERS = [
  // Top-level context columns
  'Row Type',
  'Client/Account',
  'TempID',
  'ParentCampaignID',
  'Campaign',
  'AdGroup',
  
  // Campaign-level fields
  'Campaign ID',
  'Campaign Status',
  'Campaign Type',
  'Subtype',
  'Campaign Budget',
  'Budget Type',
  'Shared Budget Name',
  'Bidding Strategy Type',
  'Bidding Strategy Value',
  'Start Date',
  'End Date',
  'Networks',
  'Languages',
  'Location Targeting Mode',
  'Location Targeting',
  'Ad Rotation',
  'Tracking Template',
  'URL Options',
  'Labels',
  'Geo Target Type',
  'Negative Locations',
  'Device Bid Modifier',
  
  // Ad group-level fields
  'AdGroup Status',
  'Default Max CPC',
  'AdGroup Type',
  'AdGroup Labels',
  
  // Keyword-level fields
  'Keyword',
  'Match Type',
  'Keyword Status',
  'Keyword Final URL',
  'Keyword Max CPC',
  'Keyword Labels',
  'Keyword ID',
  'TempRowID',
  
  // Negative keywords
  'Negative Keyword',
  'Scope',
  'Shared List Name',
  
  // Ad rows
  'Ad Type',
  'Headline 1', 'Headline 2', 'Headline 3', 'Headline 4', 'Headline 5', 'Headline 6', 'Headline 7', 'Headline 8', 'Headline 9', 'Headline 10', 'Headline 11', 'Headline 12', 'Headline 13', 'Headline 14', 'Headline 15',
  'Description 1', 'Description 2', 'Description 3', 'Description 4',
  'Long Headline',
  'Business Name',
  'Path1', 'Path2',
  'Final URL',
  'Final Mobile URL',
  'Custom Parameters',
  'Image Asset URLs',
  'Video Asset IDs',
  'App ID',
  'Ad Status',
  'Ad ID',
  'Pin',
  
  // Assets & Extensions
  'Asset Type',
  'Asset ID',
  'Asset Name',
  'Asset URL',
  'Callout Text',
  'Sitelink Text',
  'Sitelink Final URL',
  'Sitelink Description Line 1',
  'Sitelink Description Line 2',
  'Structured Snippet Header',
  'Structured Snippet Values',
  'Promotion Code',
  'Promotion Percent Off',
  'Promotion Amount Off',
  'Promotion Money Amount Off',
  'Promotion Target',
  'Price Feed Name',
  'Price Currency',
  'Price',
  'Price Header',
  'Location Business Name',
  'Location Address',
  'Location City',
  'Location Postal',
  'Location Country Code',
  'Location Phone',
  'Lead Form Headline',
  'Lead Form Description',
  'Lead Form Call To Action Text',
  'Lead Form Business Name',
  'Lead Form Privacy Policy URL',
  'Lead Form Fields',
  
  // Audience / Remarketing
  'Audience Type',
  'Audience Name',
  'Audience ID',
  'Audience Bid Modifier',
  'Audience Status',
  
  // Location targeting
  'Location Type',
  'Location Code',
  'Radius',
  'Radius Unit',
  'Location Exclusion',
  'Location ID',
  
  // Ad Schedule
  'Day(s)',
  'Days Of Week',
  'Start Hour',
  'End Hour',
  'Bid Modifier',
  
  // Device modifiers
  'Bid Modifier Desktop',
  'Bid Modifier Mobile',
  'Bid Modifier Tablet',
  
  // Shared lists
  'Shared List Name',
  'Shared List Type',
  'Entries',
  
  // Tracking & final
  'Final URL Suffix',
  'Custom Parameter Key',
  'Custom Parameter Value',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Term',
  'UTM Content',
  
  // Administrative
  'Operation',
  'Import Notes',
];

// Sample CSV template data
const generateSampleCSV = () => {
  return [
    {
      'Row Type': 'CAMPAIGN',
      'Campaign': 'Local Plumbing',
      'Campaign Type': 'SEARCH',
      'Campaign Status': 'ENABLED',
      'Campaign Budget': '30.00',
      'Bidding Strategy Type': 'MANUAL_CPC',
      'Start Date': '2025-12-05',
      'End Date': '2026-12-05',
      'Location Type': 'COUNTRY',
      'Location Code': 'US',
      'Operation': 'NEW',
    },
    {
      'Row Type': 'ADGROUP',
      'Campaign': 'Local Plumbing',
      'AdGroup': 'Emergency Repairs',
      'AdGroup Status': 'ENABLED',
      'Default Max CPC': '2.00',
      'Operation': 'NEW',
    },
    {
      'Row Type': 'KEYWORD',
      'Campaign': 'Local Plumbing',
      'AdGroup': 'Emergency Repairs',
      'Keyword': 'plumber near me',
      'Match Type': 'PHRASE',
      'Keyword Max CPC': '2.00',
      'Operation': 'NEW',
    },
    {
      'Row Type': 'AD',
      'Campaign': 'Local Plumbing',
      'AdGroup': 'Emergency Repairs',
      'Ad Type': 'RESPONSIVE_SEARCH_AD',
      'Headline 1': 'Fast Plumbers Near You',
      'Headline 2': '24/7 Emergency Service',
      'Description 1': 'We fix leaks fast',
      'Final URL': 'https://example.com/emergency',
      'Asset Type': 'IMAGE',
      'Asset URL': '/assets/service1.jpg',
      'Operation': 'NEW',
    },
    {
      'Row Type': 'ASSET',
      'Asset Type': 'IMAGE',
      'Asset Name': 'logo-main',
      'Asset URL': '/assets/logo.svg',
      'Operation': 'NEW',
    },
  ];
};

export const GoogleAdsCSVExport: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadCSV = () => {
    setIsGenerating(true);
    
    try {
      // Generate sample CSV data
      const sampleData = generateSampleCSV();
      
      // Convert to CSV using PapaParse
      const csv = Papa.unparse(sampleData, {
        columns: GOOGLE_ADS_CSV_HEADERS.filter(header => 
          sampleData.some(row => (row as Record<string, any>)[header] !== undefined)
        ),
      });
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `google_ads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating CSV:', error);
      setIsGenerating(false);
    }
  };

  const handleImportAndCheck = () => {
    // Open the validator in a new window
    window.open('/ads_csv_validator.html', '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Google Ads CSV Export & Validator</h1>
        <p className="text-slate-600">
          Export your campaigns to Google Ads Editor-compatible CSV format and validate before import.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Download CSV Card */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleDownloadCSV}
              disabled={isGenerating}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import & Check Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Validate CSV
            </CardTitle>
            <CardDescription>
              Upload and validate your CSV file before importing to Google Ads Editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleImportAndCheck}
              className="w-full"
              size="lg"
              variant="default"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Import & Check
            </Button>
            <div className="text-sm text-slate-600 space-y-1">
              <p>• Validates required headers and row-level data</p>
              <p>• Checks dates, bids, geo codes, and URLs</p>
              <p>• Shows detailed error and warning reports</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schema Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            CSV Schema Information
          </CardTitle>
          <CardDescription>
            Complete list of supported Google Ads Editor fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Supported Row Types:</h3>
              <div className="flex flex-wrap gap-2">
                {['CAMPAIGN', 'ADGROUP', 'AD', 'KEYWORD', 'NEGATIVE_KEYWORD', 'ASSET', 'LOCATION', 'AUDIENCE'].map((type) => (
                  <span key={type} className="px-2 py-1 bg-slate-100 rounded text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Key Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                <li>Campaign-level settings (budget, bidding strategy, dates, locations)</li>
                <li>Ad group configuration and targeting</li>
                <li>Multiple ad types (Responsive Search Ads, Expanded Text Ads, etc.)</li>
                <li>Keyword management with match types</li>
                <li>Asset management (images, logos, videos, extensions)</li>
                <li>Location targeting and geo modifiers</li>
                <li>Audience targeting and remarketing lists</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Row Type column is required for proper validation</li>
                    <li>Campaign and AdGroup names must match across rows</li>
                    <li>Dates must be in YYYY-MM-DD format</li>
                    <li>Bids should be decimal numbers without currency symbols</li>
                    <li>Location codes should use ISO2 country codes (US, CA, GB, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

