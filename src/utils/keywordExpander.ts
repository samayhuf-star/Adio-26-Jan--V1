/**
 * Keyword Expander Utility
 * Generates 100-150 high-quality keywords following Google Ads best practices
 * 
 * Target Distribution (for 130 keywords):
 * - 40% High-intent buyer keywords (~52 keywords)
 * - 30% Long-tail commercial/pricing keywords (~39 keywords)
 * - 15% Problem-solution keywords (~20 keywords)
 * - 10% Brand/trust keywords (~13 keywords)
 * - 5% Urgency keywords (~6 keywords)
 */

interface KeywordExpansionConfig {
  baseService: string;
  serviceVariations: string[];
  problems: string[];
  targetTotal?: number;
}

const URGENCY_MODIFIERS = [
  "emergency", "24 hour", "same day", "urgent", "after hours", 
  "weekend", "immediate", "fast", "quick"
];

const TRUST_MODIFIERS = [
  "licensed", "certified", "insured", "professional", "trusted",
  "top rated", "best rated", "5 star", "reliable", "experienced",
  "quality", "master", "bonded"
];

const LOCATION_MODIFIERS = [
  "near me", "local", "nearby", "in my area", "close to me"
];

const ACTION_MODIFIERS = [
  "hire", "find", "get", "need"
];

const PRICING_MODIFIERS = [
  "cost", "price", "quote", "estimate", "rates"
];

function addKeyword(arr: string[], kw: string, limit: number): boolean {
  if (arr.length >= limit) return false;
  arr.push(kw);
  return true;
}

export function expandKeywords(config: KeywordExpansionConfig): string[] {
  const { baseService, serviceVariations, problems, targetTotal = 130 } = config;

  // Calculate exact limits - ensure they sum to targetTotal
  const highIntentLimit = Math.floor(targetTotal * 0.40);
  const commercialLimit = Math.floor(targetTotal * 0.30);
  const problemLimit = Math.floor(targetTotal * 0.15);
  const trustLimit = Math.floor(targetTotal * 0.10);
  const urgencyLimit = targetTotal - highIntentLimit - commercialLimit - problemLimit - trustLimit;

  const highIntentKeywords: string[] = [];
  const commercialKeywords: string[] = [];
  const problemKeywords: string[] = [];
  const trustKeywords: string[] = [];
  const urgencyKeywords: string[] = [];

  // 1. HIGH-INTENT BUYER KEYWORDS (40%) - Mix location and action modifiers
  const halfHighIntent = Math.floor(highIntentLimit / 2);
  
  // First half: location-based keywords
  outerLoop1: for (const service of serviceVariations) {
    for (const loc of LOCATION_MODIFIERS) {
      if (!addKeyword(highIntentKeywords, `${service} ${loc}`, halfHighIntent)) break outerLoop1;
    }
  }
  
  // Second half: action-based and service keywords
  outerLoop2: for (const service of serviceVariations.slice(0, 10)) {
    for (const action of ACTION_MODIFIERS) {
      if (!addKeyword(highIntentKeywords, `${action} ${service}`, highIntentLimit)) break outerLoop2;
    }
  }
  for (const service of serviceVariations.slice(0, 8)) {
    if (!addKeyword(highIntentKeywords, `${service} company`, highIntentLimit)) break;
    if (!addKeyword(highIntentKeywords, `${service} contractor`, highIntentLimit)) break;
    if (!addKeyword(highIntentKeywords, `${service} service`, highIntentLimit)) break;
  }

  // 2. LONG-TAIL COMMERCIAL/PRICING KEYWORDS (30%)
  outerLoop3: for (const service of serviceVariations.slice(0, 8)) {
    for (const price of PRICING_MODIFIERS) {
      if (!addKeyword(commercialKeywords, `${service} ${price}`, commercialLimit)) break outerLoop3;
    }
  }
  for (const service of serviceVariations.slice(0, 6)) {
    if (!addKeyword(commercialKeywords, `how much does ${service} cost`, commercialLimit)) break;
    if (!addKeyword(commercialKeywords, `${service} price per hour`, commercialLimit)) break;
    if (!addKeyword(commercialKeywords, `free ${service} quote`, commercialLimit)) break;
    if (!addKeyword(commercialKeywords, `${service} estimate near me`, commercialLimit)) break;
  }

  // 3. PROBLEM-SOLUTION KEYWORDS (15%)
  for (const problem of problems) {
    if (!addKeyword(problemKeywords, `${problem} repair`, problemLimit)) break;
    if (!addKeyword(problemKeywords, `fix ${problem}`, problemLimit)) break;
    if (!addKeyword(problemKeywords, `${problem} service near me`, problemLimit)) break;
  }

  // 4. BRAND/TRUST KEYWORDS (10%)
  for (const trust of TRUST_MODIFIERS) {
    if (!addKeyword(trustKeywords, `${trust} ${baseService}`, trustLimit)) break;
  }
  for (const trust of TRUST_MODIFIERS.slice(0, 6)) {
    if (!addKeyword(trustKeywords, `${trust} ${baseService} near me`, trustLimit)) break;
  }

  // 5. URGENCY KEYWORDS (5%)
  for (const urgency of URGENCY_MODIFIERS) {
    if (!addKeyword(urgencyKeywords, `${urgency} ${baseService}`, urgencyLimit)) break;
  }
  for (const urgency of URGENCY_MODIFIERS.slice(0, 3)) {
    if (!addKeyword(urgencyKeywords, `${urgency} ${baseService} near me`, urgencyLimit)) break;
  }

  // Combine all keywords - no final slice needed since limits enforced per-category
  return [
    ...highIntentKeywords,
    ...commercialKeywords,
    ...problemKeywords,
    ...trustKeywords,
    ...urgencyKeywords
  ];
}

export const INDUSTRY_KEYWORD_CONFIGS: Record<string, KeywordExpansionConfig> = {
  electrician: {
    baseService: "electrician",
    serviceVariations: [
      "electrician", "electrical contractor", "electrical service", 
      "electrical repair", "wiring service", "electrical installation",
      "lighting installation", "outlet repair", "circuit breaker repair",
      "panel upgrade", "EV charger installation", "ceiling fan installation",
      "smoke detector installation", "electrical wiring", "power restoration",
      "fuse box repair", "generator installation", "electrical inspection",
      "rewiring service", "electrical maintenance"
    ],
    problems: [
      "no power", "power outage", "flickering lights", "tripped breaker",
      "electrical fire", "sparking outlet", "buzzing sound electrical",
      "dead outlet", "overloaded circuit", "dimming lights",
      "faulty wiring", "short circuit", "electrical surge", "ground fault"
    ]
  },
  
  plumber: {
    baseService: "plumber",
    serviceVariations: [
      "plumber", "plumbing service", "plumbing contractor", "plumbing repair",
      "drain cleaning", "pipe repair", "leak repair", "water heater repair",
      "toilet repair", "faucet repair", "sewer line repair", "garbage disposal repair",
      "water line repair", "gas line service", "bathroom plumbing", "kitchen plumbing",
      "sump pump service", "water filtration", "tankless water heater", "septic service"
    ],
    problems: [
      "clogged drain", "leaky pipe", "burst pipe", "no hot water", "low water pressure",
      "running toilet", "backed up sewer", "water leak", "gas leak", "frozen pipe",
      "dripping faucet", "slow drain", "toilet overflow", "water damage"
    ]
  },
  
  hvac: {
    baseService: "hvac",
    serviceVariations: [
      "hvac", "ac repair", "air conditioning repair", "heating repair", "furnace repair",
      "hvac service", "ac installation", "heating installation", "hvac contractor",
      "air conditioner service", "heat pump repair", "ductwork service", "ac maintenance",
      "furnace installation", "central air repair", "mini split installation",
      "hvac tune up", "air duct cleaning", "thermostat installation", "hvac replacement"
    ],
    problems: [
      "ac not cooling", "no heat", "furnace not working", "ac blowing warm air",
      "hvac noise", "ac leaking water", "thermostat not working", "uneven heating",
      "high energy bills", "poor air quality", "ac frozen", "furnace cycling",
      "weak airflow", "ac compressor issues"
    ]
  },
  
  roofing: {
    baseService: "roofer",
    serviceVariations: [
      "roofer", "roofing contractor", "roofing service", "roof repair",
      "roof replacement", "roof installation", "shingle repair", "roof leak repair",
      "storm damage repair", "roof inspection", "gutter installation", "roof maintenance",
      "flat roof repair", "metal roofing", "tile roofing", "slate roofing",
      "roof coating", "roof ventilation", "skylight installation", "chimney flashing"
    ],
    problems: [
      "roof leak", "missing shingles", "storm damage", "roof damage", "sagging roof",
      "water damage ceiling", "hail damage roof", "ice dam", "roof moss",
      "cracked tiles", "worn shingles", "roof emergency"
    ]
  },
  
  locksmith: {
    baseService: "locksmith",
    serviceVariations: [
      "locksmith", "lock service", "key service", "lock repair", "lock replacement",
      "lockout service", "key cutting", "lock installation", "rekey locks",
      "automotive locksmith", "commercial locksmith", "residential locksmith",
      "safe locksmith", "master key system", "smart lock installation",
      "deadbolt installation", "lock change", "security locks", "emergency locksmith"
    ],
    problems: [
      "locked out", "lost keys", "broken key", "stuck lock", "key stuck in lock",
      "car lockout", "house lockout", "office lockout", "safe lockout",
      "broken lock", "lock not working", "key wont turn", "lock jammed"
    ]
  }
};

export function getExpandedKeywordsForIndustry(industry: string): string[] {
  const config = INDUSTRY_KEYWORD_CONFIGS[industry.toLowerCase()];
  if (!config) {
    return [];
  }
  return expandKeywords(config);
}

export function generateAdGroups(keywords: string[], maxKeywordsPerGroup: number = 20): Array<{ name: string; keywords: string[] }> {
  const adGroups: Array<{ name: string; keywords: string[] }> = [];
  
  const themeGroups: Record<string, string[]> = {
    "High Intent - Near Me": [],
    "Emergency & Urgent": [],
    "Cost & Pricing": [],
    "Service Types": [],
    "Problem Solutions": [],
    "Trust & Quality": [],
    "Residential": [],
    "Commercial": []
  };
  
  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (kwLower.includes("near me") || kwLower.includes("local") || kwLower.includes("nearby")) {
      themeGroups["High Intent - Near Me"].push(kw);
    } else if (kwLower.includes("emergency") || kwLower.includes("urgent") || kwLower.includes("24 hour") || kwLower.includes("same day")) {
      themeGroups["Emergency & Urgent"].push(kw);
    } else if (kwLower.includes("cost") || kwLower.includes("price") || kwLower.includes("quote") || kwLower.includes("estimate") || kwLower.includes("rate")) {
      themeGroups["Cost & Pricing"].push(kw);
    } else if (kwLower.includes("fix") || kwLower.includes("repair") || kwLower.includes("problem") || kwLower.includes("broken")) {
      themeGroups["Problem Solutions"].push(kw);
    } else if (kwLower.includes("licensed") || kwLower.includes("certified") || kwLower.includes("professional") || kwLower.includes("best") || kwLower.includes("top")) {
      themeGroups["Trust & Quality"].push(kw);
    } else if (kwLower.includes("residential") || kwLower.includes("home") || kwLower.includes("house")) {
      themeGroups["Residential"].push(kw);
    } else if (kwLower.includes("commercial") || kwLower.includes("business") || kwLower.includes("office")) {
      themeGroups["Commercial"].push(kw);
    } else {
      themeGroups["Service Types"].push(kw);
    }
  });
  
  Object.entries(themeGroups).forEach(([name, groupKeywords]) => {
    if (groupKeywords.length === 0) return;
    
    if (groupKeywords.length <= maxKeywordsPerGroup) {
      adGroups.push({ name, keywords: groupKeywords });
    } else {
      for (let i = 0; i < groupKeywords.length; i += maxKeywordsPerGroup) {
        const chunk = groupKeywords.slice(i, i + maxKeywordsPerGroup);
        const groupNum = Math.floor(i / maxKeywordsPerGroup) + 1;
        adGroups.push({ name: `${name} ${groupNum}`, keywords: chunk });
      }
    }
  });
  
  return adGroups;
}
