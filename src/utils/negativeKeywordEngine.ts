import { 
  INTENT_CATEGORIES, 
  generateIntentBasedNegativesWithCategories, 
  formatNegativeForCSV,
  groupNegativesByCategory,
  type NegativeKeywordResult,
  type IntentCategory
} from './intentModifiers';
import { 
  VERTICAL_PROFILES, 
  getVerticalModifiers, 
  getVerticalCustomCategories,
  getAllVerticals 
} from './verticalProfiles';

export interface NegativeKeywordEngineConfig {
  coreKeywords: string[];
  vertical?: string;
  competitors?: string[];
  excludeProcedures?: string[];
  includeCategories?: string[];
  excludeCategories?: string[];
  maxPerCategory?: number;
}

export interface NegativeKeywordEngineResult {
  negatives: NegativeKeywordResult[];
  groupedByCategory: Record<string, NegativeKeywordResult[]>;
  stats: {
    totalCount: number;
    byCategory: Record<string, number>;
    coreKeywordsUsed: number;
    verticalUsed: string | null;
  };
  csvFormatted: string[];
}

export function generateSmartNegatives(config: NegativeKeywordEngineConfig): NegativeKeywordEngineResult {
  const {
    coreKeywords,
    vertical,
    competitors = [],
    excludeProcedures = [],
    includeCategories,
    excludeCategories = [],
    maxPerCategory
  } = config;

  const localCategories: Record<string, IntentCategory> = JSON.parse(JSON.stringify(INTENT_CATEGORIES));

  let categoriesToUse = includeCategories || Object.keys(localCategories);
  categoriesToUse = categoriesToUse.filter(cat => !excludeCategories.includes(cat));

  const customModifiers: Record<string, string[]> = {};

  if (vertical && VERTICAL_PROFILES[vertical]) {
    const verticalMods = getVerticalModifiers(vertical);
    
    for (const [category, mods] of Object.entries(verticalMods)) {
      if (mods && mods.length > 0) {
        customModifiers[category] = [...(customModifiers[category] || []), ...mods];
      }
    }
  }

  if (competitors.length > 0) {
    customModifiers['competitor'] = [...(customModifiers['competitor'] || []), ...competitors];
    
    if (!categoriesToUse.includes('competitor')) {
      localCategories['competitor'] = {
        name: 'Competitor Searches',
        description: 'Searches for competitor brands',
        modifiers: [],
        matchType: 'phrase',
        priority: 1,
        patterns: ['prefix', 'suffix', 'standalone']
      };
      categoriesToUse.push('competitor');
    }
  }

  if (excludeProcedures.length > 0) {
    customModifiers['wrong_procedure'] = [...(customModifiers['wrong_procedure'] || []), ...excludeProcedures];
    
    if (!categoriesToUse.includes('wrong_procedure')) {
      localCategories['wrong_procedure'] = {
        name: 'Wrong Procedure / Service',
        description: 'Searches for services you do not offer',
        modifiers: [],
        matchType: 'phrase',
        priority: 2,
        patterns: ['standalone']
      };
      categoriesToUse.push('wrong_procedure');
    }
  }

  if (vertical) {
    const customCats = getVerticalCustomCategories(vertical);
    for (const [catKey, catConfig] of Object.entries(customCats)) {
      if (!categoriesToUse.includes(catKey)) {
        localCategories[catKey] = {
          name: catConfig.name,
          description: `Custom category for ${vertical}`,
          modifiers: catConfig.modifiers,
          matchType: catConfig.matchType,
          priority: 2,
          patterns: catConfig.patterns
        };
        categoriesToUse.push(catKey);
      }
    }
  }

  let negatives = generateIntentBasedNegativesWithCategories(coreKeywords, categoriesToUse, customModifiers, localCategories);

  if (maxPerCategory) {
    const grouped = groupNegativesByCategory(negatives);
    const limitedNegatives: NegativeKeywordResult[] = [];
    
    for (const [category, items] of Object.entries(grouped)) {
      limitedNegatives.push(...items.slice(0, maxPerCategory));
    }
    
    negatives = limitedNegatives;
  }

  const groupedByCategory = groupNegativesByCategory(negatives);
  
  const byCategory: Record<string, number> = {};
  for (const [category, items] of Object.entries(groupedByCategory)) {
    byCategory[category] = items.length;
  }

  const csvFormatted = negatives.map(formatNegativeForCSV);

  return {
    negatives,
    groupedByCategory,
    stats: {
      totalCount: negatives.length,
      byCategory,
      coreKeywordsUsed: coreKeywords.length,
      verticalUsed: vertical || null
    },
    csvFormatted
  };
}

export function estimateNegativeCount(
  coreKeywordCount: number,
  vertical?: string
): { min: number; max: number; average: number } {
  const baseCategories = Object.keys(INTENT_CATEGORIES).length;
  const avgModifiersPerCategory = 18;
  const patternsPerModifier = 2.5;

  let verticalBonus = 0;
  if (vertical && VERTICAL_PROFILES[vertical]) {
    const profile = VERTICAL_PROFILES[vertical];
    verticalBonus = 
      (profile.diyModifiers?.length || 0) +
      (profile.budgetModifiers?.length || 0) +
      (profile.infoModifiers?.length || 0) +
      (profile.jobModifiers?.length || 0) +
      (profile.negativeOutcomeModifiers?.length || 0) +
      (profile.locationModifiers?.length || 0);
  }

  const totalModifiers = (baseCategories * avgModifiersPerCategory) + verticalBonus;
  const estimatedPerKeyword = totalModifiers * patternsPerModifier;
  
  const dedupeRate = 0.85;
  const adjustedPerKeyword = estimatedPerKeyword * dedupeRate;

  return {
    min: Math.floor(coreKeywordCount * adjustedPerKeyword * 0.8),
    max: Math.ceil(coreKeywordCount * adjustedPerKeyword * 1.2),
    average: Math.round(coreKeywordCount * adjustedPerKeyword)
  };
}

export function getDefaultNegativesForVertical(vertical: string): string[] {
  const profile = VERTICAL_PROFILES[vertical];
  if (!profile) return [];

  const defaults = new Set<string>();

  profile.wrongProcedures?.slice(0, 10).forEach(p => defaults.add(p));
  profile.jobModifiers?.slice(0, 5).forEach(m => defaults.add(m));
  profile.diyModifiers?.slice(0, 5).forEach(m => defaults.add(m));

  return Array.from(defaults);
}

export { 
  getAllVerticals, 
  VERTICAL_PROFILES, 
  INTENT_CATEGORIES,
  type NegativeKeywordResult
};
