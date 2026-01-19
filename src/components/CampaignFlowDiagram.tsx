import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';

interface CampaignFlowDiagramProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structureName: string;
  structureId: string;
}

export const CampaignFlowDiagram: React.FC<CampaignFlowDiagramProps> = ({
  open,
  onOpenChange,
  structureName,
  structureId
}) => {
  // Get structure-specific descriptions
  const getStructureDescription = () => {
    const descriptions: { [key: string]: string } = {
      skag: 'Single Keyword Ad Group - One keyword per ad group with tightly themed ads',
      stag: 'Single Theme Ad Group - Groups related keywords with multiple variations',
      mix: 'Hybrid Structure - Combines SKAG and STAG approaches for flexibility',
      stag_plus: 'Smart Grouping with ML - AI-powered keyword clustering',
      intent: 'Intent-Based - Groups keywords by search intent and user intent',
      alpha_beta: 'Alpha-Beta - Separate performers and discovery campaigns',
      match_type: 'Match-Type Split - Separate campaigns for broad, phrase, and exact match',
      geo: 'GEO-Segmented - Individual campaigns for each geographic region',
      funnel: 'Funnel-Based - Top-of-Funnel, Middle-of-Funnel, Bottom-of-Funnel campaigns',
      brand_split: 'Brand Split - Separate campaigns for branded and non-branded terms',
      competitor: 'Competitor - Target competitor brand keywords',
      ngram: 'N-Gram Clusters - Smart clustering based on keyword patterns',
      long_tail: 'Long-Tail Master - Focus on 3+ word low-competition keywords',
      seasonal: 'Seasonal Sprint - Time-based campaigns for seasonal products',
    };
    return descriptions[structureId] || 'Campaign Structure';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{structureName} Structure</DialogTitle>
          <DialogDescription>{getStructureDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Campaign Level */}
          <div className="flex flex-col items-center">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 px-8 py-4 text-center text-white shadow-lg">
              <div className="text-sm font-semibold uppercase tracking-wider">Campaign Level</div>
              <div className="mt-1 text-lg font-bold">Campaign</div>
              <div className="mt-1 text-xs opacity-90">e.g., "Plumbing Services Campaign"</div>
            </div>

            {/* Arrow */}
            <div className="my-4 flex items-center justify-center">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-green-500"></div>
            </div>
          </div>

          {/* Ad Group Level */}
          <div className="flex flex-col items-center">
            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 px-8 py-4 text-center text-white shadow-lg">
              <div className="text-sm font-semibold uppercase tracking-wider">Ad Group Level</div>
              <div className="mt-1 text-lg font-bold">Ad Group(s)</div>
              <div className="mt-1 text-xs opacity-90">e.g., "Plumbing Repair", "Emergency Plumbing"</div>
            </div>

            {/* Arrow */}
            <div className="my-4 flex items-center justify-center">
              <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-orange-500"></div>
            </div>
          </div>

          {/* Keywords Level */}
          <div className="flex flex-col items-center">
            <div className="w-full">
              <div className="mb-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Keyword Level
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {['Keyword 1', 'Keyword 2', 'Keyword 3'].map((kw, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 px-6 py-3 text-center text-white shadow-lg"
                  >
                    <div className="text-sm font-bold">{kw}</div>
                    <div className="mt-1 text-xs opacity-90">Exact/Phrase/Broad</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="my-4 flex items-center justify-center">
              <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-pink-500"></div>
            </div>
          </div>

          {/* Ads Level */}
          <div className="flex flex-col items-center">
            <div className="w-full">
              <div className="mb-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Ad Level
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {['Responsive Search Ad (RSA)', 'Call-Only Ad'].map((ad, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-gradient-to-br from-pink-500 to-red-600 px-6 py-3 text-center text-white shadow-lg"
                  >
                    <div className="text-sm font-bold">{ad}</div>
                    <div className="mt-1 text-xs opacity-90">Multiple copies per ad group</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="my-4 flex items-center justify-center">
              <div className="h-8 w-1 bg-gradient-to-b from-pink-500 to-cyan-500"></div>
            </div>
          </div>

          {/* Assets Level */}
          <div className="flex flex-col items-center">
            <div className="w-full">
              <div className="mb-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Assets & Extensions
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {['Sitelinks', 'Callouts', 'Call Extension', 'Structured Snippets'].map((asset, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-4 py-3 text-center text-white shadow-lg"
                  >
                    <div className="text-xs font-bold">{asset}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Points Card */}
          <div className="mt-8 border-t pt-6">
            <Card className="border-2 border-gray-200 bg-gray-50 p-6">
              <h4 className="mb-3 font-semibold text-gray-900">Key Insights</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600 mt-1.5"></span>
                  <span>Each Campaign contains one or more Ad Groups</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-600 mt-1.5"></span>
                  <span>Each Ad Group contains related Keywords and multiple Ads</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-600 mt-1.5"></span>
                  <span>Keywords determine when your ads are shown (match types: exact, phrase, broad)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-pink-600 mt-1.5"></span>
                  <span>Ads are displayed when keywords match user searches</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-cyan-600 mt-1.5"></span>
                  <span>Assets & Extensions enhance your ads with additional information</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
