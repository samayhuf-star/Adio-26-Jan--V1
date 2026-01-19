interface UrlAnalysisInput {
  title?: string;
  pageTitle?: string;
  metaDescription?: string;
  mainContent?: string;
  headings?: string[];
  [key: string]: unknown;
}

interface IntentInput {
  category?: string;
  intentId?: string;
  [key: string]: unknown;
}

/**
 * Generate 3-4 highly relevant seed keywords based on URL analysis and campaign intent
 */
export function generateSeedKeywordSuggestions(
  urlAnalysis?: UrlAnalysisInput,
  intent?: IntentInput,
  campaignStructure?: string,
  url?: string
): string[] {
  const suggestions = new Set<string>();

  // Extract from URL structure if available
  if (url && url.trim()) {
    const urlSuggestions = extractKeywordsFromUrl(url);
    urlSuggestions.forEach(kw => suggestions.add(kw));
  }

  // Extract from page title and description
  if (urlAnalysis) {
    const pageTitle = urlAnalysis.pageTitle || urlAnalysis.title;
    if (pageTitle) {
      const titleKeywords = extractKeywordsFromText(pageTitle, 1);
      titleKeywords.forEach(kw => suggestions.add(kw));
    }
    
    if (urlAnalysis.metaDescription) {
      const descKeywords = extractKeywordsFromText(urlAnalysis.metaDescription, 1);
      descKeywords.forEach(kw => suggestions.add(kw));
    }

    // Extract from main content if available
    if (urlAnalysis.mainContent) {
      const contentKeywords = extractKeywordsFromText(urlAnalysis.mainContent, 1);
      contentKeywords.forEach(kw => suggestions.add(kw));
    }

    // Extract from headings
    if (urlAnalysis.headings && urlAnalysis.headings.length > 0) {
      urlAnalysis.headings.slice(0, 2).forEach((heading: string) => {
        const headingKeywords = extractKeywordsFromText(heading, 1);
        headingKeywords.forEach(kw => suggestions.add(kw));
      });
    }
  }

  // Add intent-specific keywords
  const intentCategory = intent?.category || intent?.intentId;
  if (intentCategory) {
    const intentKeywords = getIntentSpecificKeywords(intentCategory);
    intentKeywords.forEach(kw => suggestions.add(kw));
  }

  // Add structure-specific modifiers
  if (campaignStructure) {
    const structureKeywords = getStructureBasedModifiers(campaignStructure);
    structureKeywords.forEach(kw => suggestions.add(kw));
  }

  // Convert to array and limit to 3-4 keywords
  const result = Array.from(suggestions)
    .filter(kw => kw.length > 0 && !kw.match(/^https?:\/\//))
    .slice(0, 4);

  return result.length > 0 ? result : getDefaultKeywords();
}

/**
 * Extract keywords from URL path and domain
 */
function extractKeywordsFromUrl(url: string): string[] {
  try {
    const urlObj = new URL(url);
    const keywords: string[] = [];

    // Extract from domain name
    const domain = urlObj.hostname
      .replace('www.', '')
      .replace(/\.com|\.io|\.net|\.org|\.co|\.us/i, '');
    
    if (domain && domain.length > 2) {
      keywords.push(domain);
    }

    // Extract from path
    const pathSegments = urlObj.pathname
      .split('/')
      .filter(seg => seg.length > 0 && !seg.match(/^[0-9]+$/))
      .map(seg => decodeURIComponent(seg.replace(/-/g, ' ')))
      .slice(0, 2);
    
    keywords.push(...pathSegments);

    return keywords;
  } catch {
    return [];
  }
}

/**
 * Extract key phrases from text content
 */
function extractKeywordsFromText(text: string, maxResults: number = 1): string[] {
  if (!text) return [];

  // Split into sentences and get the first few
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 2);

  const keywords: string[] = [];

  sentences.forEach(sentence => {
    // Extract key phrases (2-3 words)
    const words = sentence
      .toLowerCase()
      .split(/[\s,;:]+/)
      .filter(w => 
        w.length > 3 &&
        !isCommonWord(w)
      );

    // Get first meaningful phrase
    if (words.length >= 2) {
      const phrase = words.slice(0, 3).join(' ');
      if (phrase.length > 0) {
        keywords.push(phrase);
      }
    } else if (words.length === 1) {
      keywords.push(words[0]);
    }
  });

  return keywords.slice(0, maxResults);
}

/**
 * Get intent-specific keyword modifiers
 */
function getIntentSpecificKeywords(intent: string): string[] {
  const intentKeywordMap: Record<string, string[]> = {
    // Service intents
    'service': ['professional', 'expert', 'service', 'provider', 'company'],
    'local_service': ['near me', 'local', 'nearby', 'in', 'service'],
    'emergency_service': ['emergency', '24/7', 'urgent', 'immediate', 'fast'],
    
    // Product intents
    'product': ['buy', 'purchase', 'online', 'shop', 'order'],
    'product_comparison': ['compare', 'vs', 'best', 'difference', 'review'],
    
    // Information intents
    'informational': ['what is', 'how to', 'guide', 'learn', 'info'],
    'how_to': ['how to', 'tutorial', 'guide', 'steps', 'instructions'],
    
    // Conversion intents
    'consultation': ['consultation', 'quote', 'estimate', 'free', 'appointment'],
    'demo': ['demo', 'free trial', 'try', 'test', 'features'],
    
    // Navigational intents
    'brand': ['brand', 'official', 'site', 'home'],
  };

  return intentKeywordMap[intent.toLowerCase()] || [];
}

/**
 * Get keywords based on campaign structure
 */
function getStructureBasedModifiers(structure: string): string[] {
  const structureModifiers: Record<string, string[]> = {
    'skag': ['exact', 'targeted', 'high converting'],
    'stag': ['theme', 'group', 'related'],
    'intent': ['intent based', 'customer journey'],
    'long_tail': ['specific', 'niche', '3+ words'],
    'brand_split': ['branded', 'non-branded'],
    'seasonal': ['seasonal', 'trending', 'timely'],
    'geo': ['location based', 'regional'],
  };

  return structureModifiers[structure.toLowerCase()] || [];
}

/**
 * Check if a word is too common/generic
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'can', 'that', 'this', 'with', 'from', 'by', 'about',
    'as', 'if', 'just', 'so', 'than', 'very', 'how', 'what', 'when', 'where',
    'why', 'your', 'my', 'his', 'her', 'their', 'its', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'us', 'them', 'which', 'who', 'whom',
    'www', 'http', 'https', 'com', 'org', 'io', 'net', 'co', 'us',
  ]);

  return commonWords.has(word.toLowerCase());
}

/**
 * Get default keywords if no analysis available
 */
function getDefaultKeywords(): string[] {
  return [
    'service',
    'professional',
    'contact us',
    'learn more'
  ];
}
