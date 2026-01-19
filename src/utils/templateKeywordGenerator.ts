/**
 * Template-Based Keyword Generation
 * 
 * Uses structured templates to generate high-quality keywords
 * based on service type and location, following proven patterns
 * that people actually search for.
 */

export interface KeywordResult {
  keyword: string;
  category: string;
  intent: 'very-high' | 'high' | 'medium' | 'low';
  matchType?: 'EXACT' | 'PHRASE' | 'BROAD';
}

export interface TemplateGeneratorOptions {
  businessUrl?: string;
  primaryService: string;
  specificServices?: string[];
  location?: string;
  city?: string;
  state?: string;
}

const keywordTemplates: Record<string, string[]> = {
  emergency: [
    "emergency {service} {location}",
    "24/7 {service} {location}",
    "24 hour {service} {location}",
    "{service} emergency service {location}",
    "same day {service} {location}",
    "emergency {service} repair {location}"
  ],
  
  serviceLocation: [
    "{service} {location}",
    "{service} services {location}",
    "{service} company {location}",
    "professional {service} {location}",
    "licensed {service} {location}",
    "best {service} {location}",
    "top rated {service} {location}",
    "affordable {service} {location}"
  ],
  
  specificService: [
    "{specific_service} {location}",
    "{specific_service} repair {location}",
    "{specific_service} installation {location}",
    "{specific_service} replacement {location}"
  ],
  
  costResearch: [
    "{service} cost {location}",
    "how much does {service} cost {location}",
    "{service} prices {location}",
    "{service} estimate {location}",
    "cheap {service} {location}",
    "affordable {service} {location}"
  ],
  
  research: [
    "best {service} companies {location}",
    "{service} reviews {location}",
    "top {service} contractors {location}",
    "{service} near me reviews"
  ]
};

const serviceTermsByIndustry: Record<string, { primary: string[]; specific: string[] }> = {
  plumbing: {
    primary: ["plumber", "plumbing"],
    specific: [
      "drain cleaning",
      "water heater repair",
      "leak detection",
      "pipe repair",
      "emergency plumbing",
      "sewer repair",
      "bathroom plumbing",
      "kitchen plumbing",
      "toilet repair",
      "faucet installation"
    ]
  },
  hvac: {
    primary: ["hvac", "heating", "cooling", "air conditioning"],
    specific: [
      "ac repair",
      "furnace repair",
      "hvac installation",
      "duct cleaning",
      "thermostat installation",
      "heat pump repair",
      "central air repair",
      "hvac maintenance"
    ]
  },
  electrical: {
    primary: ["electrician", "electrical"],
    specific: [
      "electrical repair",
      "outlet installation",
      "circuit breaker repair",
      "lighting installation",
      "electrical panel upgrade",
      "wiring repair",
      "ceiling fan installation",
      "generator installation"
    ]
  },
  roofing: {
    primary: ["roofer", "roofing"],
    specific: [
      "roof repair",
      "roof replacement",
      "shingle repair",
      "roof leak repair",
      "gutter installation",
      "roof inspection",
      "metal roofing",
      "flat roof repair"
    ]
  },
  landscaping: {
    primary: ["landscaper", "landscaping", "lawn care"],
    specific: [
      "lawn mowing",
      "tree trimming",
      "lawn maintenance",
      "garden design",
      "irrigation installation",
      "mulching service",
      "hedge trimming",
      "landscape design"
    ]
  },
  cleaning: {
    primary: ["cleaning", "cleaner", "maid service"],
    specific: [
      "house cleaning",
      "deep cleaning",
      "move out cleaning",
      "office cleaning",
      "carpet cleaning",
      "window cleaning",
      "post construction cleaning",
      "commercial cleaning"
    ]
  },
  pest: {
    primary: ["pest control", "exterminator"],
    specific: [
      "ant control",
      "termite treatment",
      "rodent control",
      "bed bug treatment",
      "mosquito control",
      "roach extermination",
      "wildlife removal",
      "spider control"
    ]
  },
  locksmith: {
    primary: ["locksmith", "lock"],
    specific: [
      "lockout service",
      "lock repair",
      "key replacement",
      "lock installation",
      "car lockout",
      "rekeying service",
      "safe opening",
      "security lock installation"
    ]
  },
  marketing: {
    primary: ["marketing", "advertising", "ads", "campaign"],
    specific: [
      "google ads management",
      "ppc management",
      "ad campaign builder",
      "keyword research tool",
      "campaign automation",
      "digital marketing platform",
      "ad optimization",
      "marketing automation"
    ]
  },
  software: {
    primary: ["software", "platform", "tool", "app", "saas"],
    specific: [
      "campaign management software",
      "marketing software",
      "ads automation platform",
      "ppc software",
      "advertising platform",
      "campaign builder tool",
      "keyword planner software",
      "ad management solution"
    ]
  },
  legal: {
    primary: ["lawyer", "attorney", "law firm", "legal"],
    specific: [
      "personal injury lawyer",
      "divorce attorney",
      "criminal defense lawyer",
      "estate planning attorney",
      "business lawyer",
      "immigration attorney",
      "family law attorney",
      "bankruptcy lawyer"
    ]
  },
  medical: {
    primary: ["doctor", "physician", "clinic", "medical", "healthcare"],
    specific: [
      "family doctor",
      "urgent care",
      "primary care physician",
      "medical clinic",
      "health screening",
      "wellness checkup",
      "telehealth services",
      "preventive care"
    ]
  },
  dental: {
    primary: ["dentist", "dental", "orthodontist"],
    specific: [
      "teeth cleaning",
      "dental implants",
      "teeth whitening",
      "root canal treatment",
      "dental crowns",
      "invisalign",
      "emergency dental care",
      "cosmetic dentistry"
    ]
  },
  realestate: {
    primary: ["real estate", "realtor", "property", "homes"],
    specific: [
      "homes for sale",
      "real estate agent",
      "property listings",
      "buy a house",
      "sell my home",
      "real estate investment",
      "property management",
      "mortgage services"
    ]
  },
  default: {
    primary: ["service", "services"],
    specific: []
  }
};

const locationModifiers = [
  "near me",
  "in {city}",
  "{city}",
  "{city} {state}"
];

function getIntentLevel(category: string): 'very-high' | 'high' | 'medium' | 'low' {
  const intentMap: Record<string, 'very-high' | 'high' | 'medium' | 'low'> = {
    emergency: 'very-high',
    serviceLocation: 'high',
    specificService: 'high',
    costResearch: 'medium',
    research: 'medium'
  };
  return intentMap[category] || 'low';
}

function getMatchType(category: string): 'EXACT' | 'PHRASE' | 'BROAD' {
  const matchMap: Record<string, 'EXACT' | 'PHRASE' | 'BROAD'> = {
    emergency: 'EXACT',
    serviceLocation: 'BROAD',
    specificService: 'PHRASE',
    costResearch: 'PHRASE',
    research: 'BROAD'
  };
  return matchMap[category] || 'BROAD';
}

function isValidKeyword(keyword: string, serviceTerms: string[]): boolean {
  const lower = keyword.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length < 2 || words.length > 7) return false;
  
  const uniqueWords = new Set(words);
  if (words.length !== uniqueWords.size) return false;
  
  const hasServiceTerm = serviceTerms.some(term => 
    lower.includes(term.toLowerCase())
  );
  if (!hasServiceTerm) return false;
  
  const invalidPatterns = [
    /^what is\s+\w+$/,
    /^where to\s+\w+$/,
    /^when to\s+\w+$/,
    /^why is\s+\w+$/,
    /^does\s+\w+$/,
    /^can\s+\w+$/,
    /^how to\s+\w+$/,
  ];
  
  if (invalidPatterns.some(pattern => pattern.test(lower))) {
    return false;
  }
  
  if (lower.includes('number') && !lower.includes('phone')) {
    return false;
  }
  
  const spamWords = ['cheap', 'discount', 'free', 'job', 'apply', 'brand', 'information'];
  if (spamWords.includes(lower.trim())) return false;
  
  return true;
}

const EMERGENCY_INDUSTRIES = new Set([
  'plumbing', 'hvac', 'electrical', 'roofing', 'locksmith', 'pest', 'dental'
]);

function detectIndustry(input: string): string {
  const lower = input.toLowerCase();
  
  // Check service industries FIRST with broad patterns
  if (lower.includes('plumb') || lower.includes('drain') || lower.includes('pipe')) {
    return 'plumbing';
  }
  if (lower.includes('hvac') || lower.includes('heating') || lower.includes('cooling') || 
      lower.includes('air condition') || lower.includes('furnace')) {
    return 'hvac';
  }
  if (lower.includes('electrician') || lower.includes('electrical') || lower.includes('wiring')) {
    return 'electrical';
  }
  if (lower.includes('roof') || lower.includes('gutter') || lower.includes('shingle')) {
    return 'roofing';
  }
  if (lower.includes('lawyer') || lower.includes('attorney') || lower.includes('law firm') || 
      lower.includes('legal')) {
    return 'legal';
  }
  if (lower.includes('doctor') || lower.includes('physician') || lower.includes('clinic') || 
      lower.includes('hospital') || lower.includes('medical') || lower.includes('healthcare')) {
    return 'medical';
  }
  if (lower.includes('dentist') || lower.includes('dental') || lower.includes('orthodont')) {
    return 'dental';
  }
  if (lower.includes('real estate') || lower.includes('realtor') || lower.includes('homes for sale')) {
    return 'realestate';
  }
  if (lower.includes('landscap') || lower.includes('lawn') || lower.includes('garden') || lower.includes('tree')) {
    return 'landscaping';
  }
  if (lower.includes('cleaning') || lower.includes('maid') || lower.includes('janitorial')) {
    return 'cleaning';
  }
  if (lower.includes('pest') || lower.includes('exterminator') || lower.includes('termite')) {
    return 'pest';
  }
  if (lower.includes('locksmith') || lower.includes('lock') || lower.includes('key')) {
    return 'locksmith';
  }
  
  // Marketing/Advertising - checked AFTER service industries
  if (lower.includes('google ads') || lower.includes('campaign builder') || lower.includes('ppc') || 
      lower.includes('adwords') || lower.includes('ad campaign') || lower.includes('keyword planner') ||
      lower.includes('advertising platform') || lower.includes('ads automation')) {
    return 'marketing';
  }
  
  // Software/SaaS - checked AFTER service industries
  if (lower.includes('saas') || lower.includes('software as a service') || 
      lower.includes('enterprise software') || lower.includes('automation software') ||
      lower.includes('crm software') || lower.includes('workflow automation')) {
    return 'software';
  }
  
  return 'default';
}

export function generateTemplateKeywords(options: TemplateGeneratorOptions): KeywordResult[] {
  const {
    businessUrl = '',
    primaryService,
    specificServices = [],
    location = 'near me',
    city = '',
    state = ''
  } = options;

  const keywords: KeywordResult[] = [];
  const addedKeywords = new Set<string>();
  
  const industry = detectIndustry(primaryService + ' ' + businessUrl);
  const industryTerms = serviceTermsByIndustry[industry] || serviceTermsByIndustry.default;
  
  const allServiceTerms = [
    primaryService.toLowerCase(),
    ...industryTerms.primary,
    ...industryTerms.specific,
    ...specificServices.map(s => s.toLowerCase())
  ];
  
  const uniqueServiceTerms = [...new Set(allServiceTerms)].filter(t => t.length > 0);
  
  const processedLocation = location
    .replace('{city}', city || '')
    .replace('{state}', state || '')
    .trim() || 'near me';

  for (const category in keywordTemplates) {
    if (category === 'specificService') continue;
    
    if (category === 'emergency' && !EMERGENCY_INDUSTRIES.has(industry)) {
      continue;
    }
    
    keywordTemplates[category].forEach(template => {
      const keyword = template
        .replace('{service}', primaryService.toLowerCase())
        .replace('{location}', processedLocation)
        .replace(/\s+/g, ' ')
        .trim();
      
      if (isValidKeyword(keyword, uniqueServiceTerms) && !addedKeywords.has(keyword.toLowerCase())) {
        addedKeywords.add(keyword.toLowerCase());
        keywords.push({
          keyword,
          category,
          intent: getIntentLevel(category),
          matchType: getMatchType(category)
        });
      }
    });
  }

  const allSpecificServices = [
    ...industryTerms.specific,
    ...specificServices
  ].filter((v, i, a) => a.indexOf(v) === i);

  allSpecificServices.forEach(specific => {
    keywordTemplates.specificService.forEach(template => {
      const keyword = template
        .replace('{specific_service}', specific.toLowerCase())
        .replace('{location}', processedLocation)
        .replace(/\s+/g, ' ')
        .trim();
      
      if (isValidKeyword(keyword, uniqueServiceTerms) && !addedKeywords.has(keyword.toLowerCase())) {
        addedKeywords.add(keyword.toLowerCase());
        keywords.push({
          keyword,
          category: 'specificService',
          intent: 'high',
          matchType: 'PHRASE'
        });
      }
    });
  });

  industryTerms.primary.forEach(serviceTerm => {
    if (serviceTerm.toLowerCase() === primaryService.toLowerCase()) return;
    
    const categoriesToUse = EMERGENCY_INDUSTRIES.has(industry)
      ? ['serviceLocation', 'emergency', 'costResearch']
      : ['serviceLocation', 'costResearch', 'research'];
    
    categoriesToUse.forEach(category => {
      keywordTemplates[category].slice(0, 3).forEach(template => {
        const keyword = template
          .replace('{service}', serviceTerm.toLowerCase())
          .replace('{location}', processedLocation)
          .replace(/\s+/g, ' ')
          .trim();
        
        if (isValidKeyword(keyword, uniqueServiceTerms) && !addedKeywords.has(keyword.toLowerCase())) {
          addedKeywords.add(keyword.toLowerCase());
          keywords.push({
            keyword,
            category,
            intent: getIntentLevel(category),
            matchType: getMatchType(category)
          });
        }
      });
    });
  });

  return keywords;
}

export function getKeywordsByIntent(keywords: KeywordResult[]): Record<string, KeywordResult[]> {
  return {
    'very-high': keywords.filter(k => k.intent === 'very-high'),
    'high': keywords.filter(k => k.intent === 'high'),
    'medium': keywords.filter(k => k.intent === 'medium'),
    'low': keywords.filter(k => k.intent === 'low')
  };
}

export function getKeywordsByCategory(keywords: KeywordResult[]): Record<string, KeywordResult[]> {
  const result: Record<string, KeywordResult[]> = {};
  keywords.forEach(k => {
    if (!result[k.category]) {
      result[k.category] = [];
    }
    result[k.category].push(k);
  });
  return result;
}

export { keywordTemplates, serviceTermsByIndustry, locationModifiers };
