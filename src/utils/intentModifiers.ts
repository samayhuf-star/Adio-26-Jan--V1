export interface IntentCategory {
  name: string;
  description: string;
  modifiers: string[];
  matchType: 'phrase' | 'exact' | 'broad';
  priority: number;
  patterns: ('prefix' | 'suffix' | 'standalone')[];
}

export const INTENT_CATEGORIES: Record<string, IntentCategory> = {
  diy: {
    name: 'DIY / Self-Help',
    description: 'People looking to do it themselves without professional help',
    modifiers: [
      'diy', 'do it yourself', 'how to', 'tutorial', 'guide',
      'at home', 'home remedy', 'natural', 'exercises', 'tips',
      'tricks', 'hacks', 'alternative', 'without surgery', 'non surgical',
      'self', 'homemade', 'yourself', 'step by step', 'instructions'
    ],
    matchType: 'phrase',
    priority: 1,
    patterns: ['prefix', 'suffix']
  },

  budget: {
    name: 'Budget / Price Sensitive',
    description: 'Price shoppers unlikely to convert for premium services',
    modifiers: [
      'free', 'cheap', 'cheapest', 'discount', 'coupon',
      'deal', 'affordable', 'low cost', 'budget', 'inexpensive',
      'bargain', 'sale', 'promo', 'economy', 'value',
      'wholesale', 'bulk', 'clearance', 'markdown', 'reduced'
    ],
    matchType: 'phrase',
    priority: 1,
    patterns: ['prefix', 'suffix']
  },

  info_seeker: {
    name: 'Information Seekers',
    description: 'Research phase users not ready to buy',
    modifiers: [
      'cost', 'price', 'how much', 'pricing', 'rates',
      'before and after', 'pictures', 'photos', 'images', 'gallery',
      'reviews', 'testimonials', 'ratings', 'comparison', 'vs',
      'what is', 'definition', 'meaning', 'explained', 'wiki'
    ],
    matchType: 'phrase',
    priority: 2,
    patterns: ['prefix', 'suffix', 'standalone']
  },

  job_seeker: {
    name: 'Job / Career Seekers',
    description: 'People looking for employment, not services',
    modifiers: [
      'jobs', 'job', 'career', 'careers', 'hiring',
      'employment', 'salary', 'training', 'certification', 'course',
      'classes', 'school', 'degree', 'license', 'apprentice',
      'internship', 'resume', 'interview', 'work as', 'become a'
    ],
    matchType: 'phrase',
    priority: 1,
    patterns: ['prefix', 'suffix', 'standalone']
  },

  negative_outcome: {
    name: 'Negative Outcomes / Complaints',
    description: 'People researching problems, lawsuits, or complaints',
    modifiers: [
      'lawsuit', 'sue', 'malpractice', 'gone wrong', 'failed',
      'botched', 'disaster', 'horror story', 'complaint', 'scam',
      'fraud', 'ripoff', 'warning', 'danger', 'risk',
      'side effects', 'complications', 'death', 'injured', 'recall'
    ],
    matchType: 'phrase',
    priority: 2,
    patterns: ['prefix', 'suffix']
  },

  wrong_location: {
    name: 'Wrong Location',
    description: 'Searches for locations you do not serve',
    modifiers: [
      'abroad', 'overseas', 'international', 'mexico', 'thailand',
      'india', 'turkey', 'costa rica', 'colombia', 'dominican republic',
      'medical tourism', 'travel for', 'fly to', 'vacation', 'destination'
    ],
    matchType: 'phrase',
    priority: 3,
    patterns: ['prefix', 'suffix']
  },

  educational: {
    name: 'Educational / Academic',
    description: 'Students and researchers, not customers',
    modifiers: [
      'study', 'research', 'paper', 'thesis', 'academic',
      'journal', 'statistics', 'data', 'report', 'analysis',
      'case study', 'scholarly', 'peer reviewed', 'history of', 'evolution of'
    ],
    matchType: 'phrase',
    priority: 3,
    patterns: ['prefix', 'suffix']
  },

  unqualified: {
    name: 'Unqualified Leads',
    description: 'Leads that typically do not convert',
    modifiers: [
      'insurance', 'covered', 'medicare', 'medicaid', 'payment plan',
      'financing', 'loan', 'charity', 'pro bono', 'sliding scale',
      'nonprofit', 'government', 'grant', 'assistance', 'help paying'
    ],
    matchType: 'phrase',
    priority: 2,
    patterns: ['prefix', 'suffix']
  }
};

export interface NegativeKeywordResult {
  keyword: string;
  category: string;
  matchType: 'phrase' | 'exact' | 'broad';
  source: string;
}

export function generateIntentBasedNegatives(
  coreKeywords: string[],
  categories: string[] = Object.keys(INTENT_CATEGORIES),
  customModifiers: Record<string, string[]> = {}
): NegativeKeywordResult[] {
  return generateIntentBasedNegativesWithCategories(coreKeywords, categories, customModifiers, INTENT_CATEGORIES);
}

export function generateIntentBasedNegativesWithCategories(
  coreKeywords: string[],
  categories: string[],
  customModifiers: Record<string, string[]>,
  categoryMap: Record<string, IntentCategory>
): NegativeKeywordResult[] {
  const results: NegativeKeywordResult[] = [];
  const seen = new Set<string>();

  for (const keyword of coreKeywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    for (const categoryKey of categories) {
      const category = categoryMap[categoryKey];
      if (!category) continue;

      const modifiers = [
        ...category.modifiers,
        ...(customModifiers[categoryKey] || [])
      ];

      for (const modifier of modifiers) {
        const normalizedModifier = modifier.toLowerCase().trim();

        for (const pattern of category.patterns) {
          let negativeKeyword = '';

          switch (pattern) {
            case 'prefix':
              negativeKeyword = `${normalizedModifier} ${normalizedKeyword}`;
              break;
            case 'suffix':
              negativeKeyword = `${normalizedKeyword} ${normalizedModifier}`;
              break;
            case 'standalone':
              negativeKeyword = normalizedModifier;
              break;
          }

          negativeKeyword = negativeKeyword.trim();

          if (!seen.has(negativeKeyword) && negativeKeyword.length > 0) {
            seen.add(negativeKeyword);
            results.push({
              keyword: negativeKeyword,
              category: category.name,
              matchType: category.matchType,
              source: `${normalizedKeyword} + ${normalizedModifier}`
            });
          }
        }
      }
    }
  }

  results.sort((a, b) => {
    const categoryA = Object.values(categoryMap).find(c => c.name === a.category);
    const categoryB = Object.values(categoryMap).find(c => c.name === b.category);
    return (categoryA?.priority || 99) - (categoryB?.priority || 99);
  });

  return results;
}

export function formatNegativeForCSV(result: NegativeKeywordResult): string {
  switch (result.matchType) {
    case 'exact':
      return `[${result.keyword}]`;
    case 'phrase':
      return `"${result.keyword}"`;
    case 'broad':
    default:
      return result.keyword;
  }
}

export function groupNegativesByCategory(
  negatives: NegativeKeywordResult[]
): Record<string, NegativeKeywordResult[]> {
  return negatives.reduce((acc, neg) => {
    if (!acc[neg.category]) {
      acc[neg.category] = [];
    }
    acc[neg.category].push(neg);
    return acc;
  }, {} as Record<string, NegativeKeywordResult[]>);
}
