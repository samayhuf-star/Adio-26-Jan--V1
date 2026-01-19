import React, { useState } from 'react';
import { Zap, Check, AlertCircle, Download, Save } from 'lucide-react';

/**
 * ONE-CLICK CAMPAIGN BUILDER
 * Main menu option: Click Campaign
 */

export default function OneClickCampaignBuilder() {
  const [currentStep, setCurrentStep] = useState('input'); // input, generating, results
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [generatedCampaign, setGeneratedCampaign] = useState(null);

  const handleAnalyze = async () => {
    if (!websiteUrl) {
      setError('Please enter a website URL');
      return;
    }

    if (!websiteUrl.startsWith('http')) {
      setError('Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    setError('');
    setCurrentStep('generating');
    setProgress(0);

    try {
      // Call backend API
      const response = await fetch('/api/campaigns/one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl,
          userId: 'user-id' // Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate campaign');
      }

      const data = await response.json();
      setGeneratedCampaign(data);
      setCurrentStep('results');
    } catch (err) {
      setError(err.message || 'Failed to generate campaign');
      setCurrentStep('input');
    }
  };

  // Use EventSource for real-time progress
  const handleAnalyzeWithProgress = async () => {
    if (!websiteUrl) {
      setError('Please enter a website URL');
      return;
    }

    setError('');
    setCurrentStep('generating');

    try {
      const eventSource = new EventSource(
        `/api/campaigns/one-click-stream?url=${encodeURIComponent(websiteUrl)}&userId=user-id`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProgress(data.progress);
        setCurrentStatus(data.status);

        if (data.step === 7) {
          setGeneratedCampaign(data.campaign);
          setCurrentStep('results');
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        setError('Error generating campaign');
        setCurrentStep('input');
        eventSource.close();
      };
    } catch (err) {
      setError(err.message);
      setCurrentStep('input');
    }
  };

  const downloadCSV = () => {
    if (!generatedCampaign?.csvData) return;

    const element = document.createElement('a');
    const file = new Blob([generatedCampaign.csvData], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = `${generatedCampaign.campaign_name}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const saveCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedCampaign)
      });

      if (!response.ok) throw new Error('Failed to save campaign');

      alert('Campaign saved to "Saved Campaigns"!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      {/* INPUT STEP */}
      {currentStep === 'input' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">1-Click Campaign Builder</h1>
            </div>

            <p className="text-gray-300 mb-8">
              Paste your landing page URL and let AI do everything:
              <br />
              <span className="text-sm text-gray-400">
                Analyzes content • Generates 100+ keywords • Creates ads • Builds structure
              </span>
            </p>

            <div className="space-y-6">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Landing Page URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}

              {/* Default Settings Info */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong>Default Settings:</strong>
                  <br />
                  📱 Mobile + Desktop • 🌐 Search Network • 🇺🇸 USA • 🇺🇸 English
                </p>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyzeWithProgress}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Generate Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERATING STEP */}
      {currentStep === 'generating' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-8">Generating Campaign...</h2>

            {/* Progress Visualization */}
            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300 font-medium">Progress</span>
                  <span className="text-purple-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Status Steps */}
              <div className="space-y-3">
                <GenerationStep step={1} title="Analyzing landing page" progress={progress} />
                <GenerationStep step={2} title="Building campaign structure" progress={progress} />
                <GenerationStep step={3} title="Generating 100+ keywords" progress={progress} />
                <GenerationStep step={4} title="Creating ad copy variations" progress={progress} />
                <GenerationStep step={5} title="Organizing ad groups" progress={progress} />
                <GenerationStep step={6} title="Generating Google Ads CSV" progress={progress} />
                <GenerationStep step={7} title="Saving campaign" progress={progress} />
              </div>

              {/* Current Status */}
              {currentStatus && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm text-purple-300">{currentStatus}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS STEP */}
      {currentStep === 'results' && generatedCampaign && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
              <Check className="w-7 h-7 text-green-400" />
              Campaign Generated Successfully!
            </h2>

            {/* Campaign Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Campaign Name"
                value={generatedCampaign.campaign_name}
              />
              <StatCard
                label="Keywords Generated"
                value={generatedCampaign.campaign_data?.keywords?.length || '100+'}
              />
              <StatCard
                label="Ad Groups"
                value={generatedCampaign.campaign_data?.adGroups?.length || '5'}
              />
              <StatCard
                label="Budget"
                value={`$${generatedCampaign.monthly_budget || '2,000'}`}
              />
            </div>

            {/* Campaign Details Tabs */}
            <div className="space-y-6 mb-8">
              <DetailSection
                title="📊 Website Analysis"
                data={generatedCampaign.campaign_data?.analysis}
              />

              <DetailSection
                title="🎯 Campaign Structure"
                data={generatedCampaign.campaign_data?.structure}
              />

              <DetailSection
                title="🔑 Keywords"
                data={{
                  total: generatedCampaign.campaign_data?.keywords?.length,
                  sample: generatedCampaign.campaign_data?.keywords?.slice(0, 10)
                }}
              />

              <DetailSection
                title="🚀 Ad Copy"
                data={generatedCampaign.campaign_data?.adCopy}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <Download className="w-5 h-5" />
                Download CSV for Google Ads
              </button>

              <button
                onClick={saveCampaign}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <Save className="w-5 h-5" />
                Save to Saved Campaigns
              </button>

              <button
                onClick={() => {
                  setCurrentStep('input');
                  setWebsiteUrl('');
                  setProgress(0);
                }}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <Zap className="w-5 h-5" />
                Generate Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generation Step Component
 */
function GenerationStep({ step, title, progress }) {
  const stepProgress = progress / 14.3; // 7 steps = ~14.3% per step

  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
        ${stepProgress >= step
          ? 'bg-green-500 text-white'
          : 'bg-slate-700 text-gray-400'
        }
      `}>
        {stepProgress > step ? <Check className="w-4 h-4" /> : step}
      </div>
      <span className={`text-sm ${stepProgress >= step ? 'text-green-400' : 'text-gray-400'}`}>
        {title}
      </span>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ label, value }) {
  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-purple-300">{value}</p>
    </div>
  );
}

/**
 * Detail Section Component
 */
function DetailSection({ title, data }) {
  if (!data) return null;

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4">
      <h3 className="font-semibold text-white mb-3">{title}</h3>
      <pre className="text-xs text-gray-300 overflow-x-auto max-h-40">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
