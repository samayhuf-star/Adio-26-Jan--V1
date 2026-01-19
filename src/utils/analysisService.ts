import { type IntentResult } from './campaignIntelligence/schemas';

export interface WebsiteAnalysis {
  id: string;
  url: string;
  domain: string;
  timestamp: string;
  intent: IntentResult | null;
  vertical: string | null;
  cta: string | null;
  seedKeywords: string[];
  contentSummary: string;
  detectedServices: string[];
  detectedCTAs: string[];
}

class AnalysisService {
  private readonly STORAGE_KEY = 'adiology_analyses';

  saveAnalysis(analysis: Omit<WebsiteAnalysis, 'id' | 'timestamp'>): WebsiteAnalysis {
    const record: WebsiteAnalysis = {
      ...analysis,
      id: `analysis-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const analyses = this.getAllAnalyses();
    analyses.unshift(record);
    
    // Keep only last 50 analyses
    const trimmed = analyses.slice(0, 50);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));

    // Also sync to backend API if available
    this.syncToBackend(record).catch(err => console.warn('Failed to sync analysis to backend:', err));

    return record;
  }

  getAnalysisByUrl(url: string): WebsiteAnalysis | undefined {
    const analyses = this.getAllAnalyses();
    const domain = this.extractDomain(url);
    return analyses.find(a => a.domain === domain || a.url === url);
  }

  getAllAnalyses(): WebsiteAnalysis[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading analyses:', e);
      return [];
    }
  }

  deleteAnalysis(id: string): void {
    const analyses = this.getAllAnalyses();
    const filtered = analyses.filter(a => a.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.split('/')[0].replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
  }

  private async syncToBackend(analysis: WebsiteAnalysis): Promise<void> {
    try {
      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
      });
      if (!response.ok) {
        console.warn('Backend analysis sync returned status:', response.status);
      }
    } catch (error) {
      // Silently fail - localStorage is the fallback
      console.warn('Could not reach backend for analysis sync');
    }
  }
}

export const analysisService = new AnalysisService();
