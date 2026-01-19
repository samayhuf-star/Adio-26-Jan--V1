/**
 * Google Ads Keyword Planner API Client
 * 
 * Fetches real keyword data from Google Ads API with fallback to estimated data.
 * Provides rich metrics including:
 * - Search volume estimates
 * - Competition level
 * - Bid estimates (low/high top of page)
 * - Average CPC
 * - Monthly search volume trends
 */

export interface KeywordMetrics {
  keyword: string;
  avgMonthlySearches: number | null;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNSPECIFIED' | null;
  competitionIndex: number | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  avgCpc: number | null;
  monthlySearchVolumes?: { year: number; month: number; monthlySearches: number }[];
}

export interface KeywordPlannerResponse {
  success: boolean;
  source: 'google_ads_api' | 'fallback' | 'estimated';
  message?: string;
  keywords: KeywordMetrics[];
  totalResults?: number;
  apiError?: string;
}

export interface KeywordForecast {
  dailyBudget: number;
  estimatedDailyClicks: number;
  estimatedDailyImpressions: number;
  estimatedCtr: number;
  estimatedAvgCpc: number;
  estimatedDailyCost: number;
  keywordCount: number;
  estimatedMonthlyClicks: number;
  estimatedMonthlyCost: number;
}

export interface ForecastResponse {
  success: boolean;
  source: string;
  forecast: KeywordForecast;
}

const API_BASE = '/api/google-ads';

/**
 * Generate keyword ideas with metrics from Google Ads Keyword Planner
 * Supports both seed keywords and URL-based generation
 */
export async function getKeywordIdeas(params: {
  seedKeywords?: string[];
  url?: string;
  targetCountry?: string;
  language?: string;
  customerId?: string;
  includeAdultKeywords?: boolean;
}): Promise<KeywordPlannerResponse> {
  try {
    const response = await fetch(`${API_BASE}/keyword-planner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[KeywordPlannerApi] Error fetching keyword ideas:', error);
    return {
      success: false,
      source: 'fallback',
      message: 'Failed to fetch keyword data',
      keywords: [],
    };
  }
}

/**
 * Get historical metrics for specific keywords
 */
export async function getKeywordMetrics(params: {
  keywords: string[];
  targetCountry?: string;
  customerId?: string;
}): Promise<KeywordPlannerResponse> {
  try {
    const response = await fetch(`${API_BASE}/keyword-metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[KeywordPlannerApi] Error fetching keyword metrics:', error);
    return {
      success: false,
      source: 'fallback',
      message: 'Failed to fetch keyword metrics',
      keywords: [],
    };
  }
}

/**
 * Get keyword forecast data (clicks, impressions, cost estimates)
 */
export async function getKeywordForecast(params: {
  keywords: string[];
  dailyBudget?: number;
  targetCountry?: string;
  customerId?: string;
}): Promise<ForecastResponse> {
  try {
    const response = await fetch(`${API_BASE}/keyword-forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[KeywordPlannerApi] Error fetching forecast:', error);
    return {
      success: false,
      source: 'fallback',
      forecast: {
        dailyBudget: params.dailyBudget || 50,
        estimatedDailyClicks: 0,
        estimatedDailyImpressions: 0,
        estimatedCtr: 0,
        estimatedAvgCpc: 0,
        estimatedDailyCost: 0,
        keywordCount: params.keywords.length,
        estimatedMonthlyClicks: 0,
        estimatedMonthlyCost: 0,
      },
    };
  }
}

/**
 * Format competition level for display
 */
export function formatCompetition(competition: string | null): { label: string; color: string } {
  switch (competition) {
    case 'LOW':
      return { label: 'Low', color: 'text-indigo-600 bg-indigo-50' };
    case 'MEDIUM':
      return { label: 'Medium', color: 'text-yellow-600 bg-yellow-50' };
    case 'HIGH':
      return { label: 'High', color: 'text-red-600 bg-red-50' };
    default:
      return { label: 'N/A', color: 'text-slate-400 bg-slate-50' };
  }
}

/**
 * Format search volume for display (e.g., 1.2K, 45K, 1.5M)
 */
export function formatVolume(volume: number | null): string {
  if (volume === null || volume === undefined) return 'N/A';
  if (volume >= 1000000) return (volume / 1000000).toFixed(1) + 'M';
  if (volume >= 1000) return (volume / 1000).toFixed(1) + 'K';
  return volume.toString();
}

/**
 * Format CPC for display (e.g., $1.25)
 */
export function formatCpc(cpc: number | null, currency: string = '$'): string {
  if (cpc === null || cpc === undefined) return 'N/A';
  return `${currency}${cpc.toFixed(2)}`;
}

/**
 * Format bid range for display (e.g., $0.85 - $2.50)
 */
export function formatBidRange(low: number | null, high: number | null, currency: string = '$'): string {
  if (low === null && high === null) return 'N/A';
  const lowStr = low !== null ? `${currency}${low.toFixed(2)}` : 'N/A';
  const highStr = high !== null ? `${currency}${high.toFixed(2)}` : 'N/A';
  return `${lowStr} - ${highStr}`;
}

/**
 * Get volume trend indicator (up, down, stable)
 */
export function getVolumeTrend(monthlyVolumes?: { year: number; month: number; monthlySearches: number }[]): 'up' | 'down' | 'stable' | null {
  if (!monthlyVolumes || monthlyVolumes.length < 2) return null;
  
  const sorted = [...monthlyVolumes].sort((a, b) => {
    const dateA = a.year * 12 + a.month;
    const dateB = b.year * 12 + b.month;
    return dateB - dateA;
  });
  
  const recent = sorted.slice(0, 3).reduce((sum, v) => sum + v.monthlySearches, 0) / 3;
  const older = sorted.slice(3, 6).reduce((sum, v) => sum + v.monthlySearches, 0) / 3;
  
  if (older === 0) return null;
  
  const changePercent = ((recent - older) / older) * 100;
  
  if (changePercent > 10) return 'up';
  if (changePercent < -10) return 'down';
  return 'stable';
}

/**
 * Merge keyword planner metrics with existing keyword data
 */
export function enrichKeywordsWithMetrics(
  keywords: { id: string; text: string; matchType?: string }[],
  metrics: KeywordMetrics[]
): Array<{
  id: string;
  text: string;
  matchType?: string;
  volume: number | null;
  cpc: number | null;
  competition: string | null;
  competitionIndex: number | null;
  lowBid: number | null;
  highBid: number | null;
  trend?: 'up' | 'down' | 'stable' | null;
}> {
  const metricsMap = new Map<string, KeywordMetrics>();
  
  for (const m of metrics) {
    metricsMap.set(m.keyword.toLowerCase(), m);
  }
  
  return keywords.map(kw => {
    const cleanText = kw.text.replace(/^\[|\]$|^"|"$/g, '').toLowerCase();
    const metric = metricsMap.get(cleanText);
    
    return {
      ...kw,
      volume: metric?.avgMonthlySearches ?? null,
      cpc: metric?.avgCpc ?? null,
      competition: metric?.competition ?? null,
      competitionIndex: metric?.competitionIndex ?? null,
      lowBid: metric?.lowTopOfPageBid ?? null,
      highBid: metric?.highTopOfPageBid ?? null,
      trend: metric?.monthlySearchVolumes ? getVolumeTrend(metric.monthlySearchVolumes) : null,
    };
  });
}
