/**
 * Campaign Structure Generator
 * Generates campaign structures based on selected structure type
 */

import { generateSmartAdCopy } from './adCopyGenerator';

export interface CampaignStructure {
  campaigns: Campaign[];
}

export interface Campaign {
  campaign_name: string;
  adgroups: AdGroup[];
  zip_codes?: string[];
  cities?: string[];
  states?: string[];
  targetCountry?: string;
  budget?: string;
  budget_type?: string;
  bidding_strategy?: string;
  start_date?: string;
  end_date?: string;
  location_type?: string;
  location_code?: string;
  regions?: string[];
}

export interface AdGroup {
  adgroup_name: string;
  keywords: string[];
  match_types: string[];
  ads: Ad[];
  negative_keywords?: string[];
  location_target?: string;
  zip_codes?: string[];
  cities?: string[];
  states?: string[];
}

export interface Ad {
  headline1?: string;
  headline2?: string;
  headline3?: string;
  headline4?: string;
  headline5?: string;
  headline6?: string;
  headline7?: string;
  headline8?: string;
  headline9?: string;
  headline10?: string;
  headline11?: string;
  headline12?: string;
  headline13?: string;
  headline14?: string;
  headline15?: string;
  description1?: string;
  description2?: string;
  description3?: string;
  description4?: string;
  final_url: string;
  path1?: string;
  path2?: string;
  type: 'rsa' | 'dki' | 'callonly';
  extensions?: any[]; // Extensions attached to this ad
}

export interface StructureSettings {
  structureType: string;
  campaignName: string;
  keywords: string[];
  matchTypes: { broad: boolean; phrase: boolean; exact: boolean };
  url: string;
  negativeKeywords?: string[];
  geoType?: string;
  selectedStates?: string[];
  selectedCities?: string[];
  selectedZips?: string[];
  targetCountry?: string;
  ads?: Ad[];
  intentGroups?: { [key: string]: string[] };
  selectedIntents?: string[];
  alphaKeywords?: string[];
  betaKeywords?: string[];
  funnelGroups?: { [key: string]: string[] };
  brandKeywords?: string[];
  nonBrandKeywords?: string[];
  competitorKeywords?: string[];
  smartClusters?: { [key: string]: string[] };
  startDate?: string;
  endDate?: string;
}

/**
 * Auto-classify keywords by search intent
 * Returns object with transactional, commercial, informational, navigational arrays
 */
function autoClassifyIntentGroups(keywords: string[]): { [key: string]: string[] } {
  const transactionalSignals = ['buy', 'purchase', 'order', 'price', 'cost', 'cheap', 'deal', 'discount', 'hire', 'get', 'book', 'schedule', 'quote', 'pricing', 'rates', 'affordable', 'shop', 'sale'];
  const commercialSignals = ['best', 'top', 'review', 'compare', 'vs', 'versus', 'alternative', 'comparison', 'rated', 'recommended', 'pros', 'cons', 'features'];
  const informationalSignals = ['how', 'what', 'why', 'when', 'where', 'who', 'guide', 'tutorial', 'tips', 'learn', 'example', 'definition', 'meaning', 'explain', 'ideas', 'ways'];
  const navigationalSignals = ['near me', 'in my area', 'local', 'nearby', 'closest', 'directions', 'location', 'address', 'hours', 'contact'];

  const groups: { [key: string]: string[] } = {
    transactional: [],
    commercial: [],
    informational: [],
    navigational: []
  };

  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    
    if (transactionalSignals.some(signal => kwLower.includes(signal))) {
      groups.transactional.push(kw);
    } else if (commercialSignals.some(signal => kwLower.includes(signal))) {
      groups.commercial.push(kw);
    } else if (informationalSignals.some(signal => kwLower.includes(signal))) {
      groups.informational.push(kw);
    } else if (navigationalSignals.some(signal => kwLower.includes(signal))) {
      groups.navigational.push(kw);
    } else {
      groups.transactional.push(kw);
    }
  });

  return groups;
}

/**
 * Auto-split keywords into Alpha (high-intent exact) and Beta (broad discovery)
 * Alpha: transactional/commercial keywords, Beta: informational/general keywords
 */
function autoSplitAlphaBeta(keywords: string[]): { alpha: string[]; beta: string[] } {
  const highIntentSignals = ['buy', 'purchase', 'order', 'price', 'cost', 'hire', 'get', 'book', 'quote', 'service', 'company', 'near me', 'best', 'top', 'professional'];
  
  const alpha: string[] = [];
  const beta: string[] = [];

  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (highIntentSignals.some(signal => kwLower.includes(signal))) {
      alpha.push(kw);
    } else {
      beta.push(kw);
    }
  });

  if (alpha.length === 0 && beta.length > 0) {
    const splitPoint = Math.ceil(beta.length * 0.3);
    return { alpha: beta.slice(0, splitPoint), beta: beta.slice(splitPoint) };
  }

  return { alpha, beta };
}

/**
 * Auto-classify keywords into marketing funnel stages
 * TOF (Top of Funnel): Awareness
 * MOF (Middle of Funnel): Consideration
 * BOF (Bottom of Funnel): Conversion
 */
function autoClassifyFunnelGroups(keywords: string[]): { [key: string]: string[] } {
  const tofSignals = ['what is', 'how to', 'tips', 'guide', 'learn', 'benefits', 'ideas', 'examples', 'ways to', 'introduction', 'basics', 'beginner'];
  const mofSignals = ['best', 'compare', 'vs', 'review', 'features', 'pros', 'cons', 'alternative', 'top', 'rated', 'comparison', 'difference'];
  const bofSignals = ['buy', 'order', 'price', 'quote', 'hire', 'get', 'near me', 'cost', 'book', 'schedule', 'service', 'company', 'professional', 'affordable', 'cheap'];

  const groups: { [key: string]: string[] } = {
    tof: [],
    mof: [],
    bof: []
  };

  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    
    if (bofSignals.some(signal => kwLower.includes(signal))) {
      groups.bof.push(kw);
    } else if (mofSignals.some(signal => kwLower.includes(signal))) {
      groups.mof.push(kw);
    } else if (tofSignals.some(signal => kwLower.includes(signal))) {
      groups.tof.push(kw);
    } else {
      groups.bof.push(kw);
    }
  });

  return groups;
}

/**
 * Auto-detect brand keywords from URL/campaign name
 * Extracts brand name from domain and checks keywords for brand mentions
 */
function autoDetectBrandKeywords(keywords: string[], url: string, campaignName: string): { brand: string[]; nonBrand: string[] } {
  const brandTerms: string[] = [];
  
  // Try to parse URL, adding https:// if protocol is missing
  let urlToParse = url;
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    urlToParse = 'https://' + url;
  }
  
  try {
    const urlObj = new URL(urlToParse);
    const domain = urlObj.hostname.replace('www.', '');
    const domainParts = domain.split('.');
    if (domainParts.length > 0 && domainParts[0].length > 2) {
      brandTerms.push(domainParts[0].toLowerCase());
    }
  } catch (e) {
    // URL parsing failed completely, skip URL-based brand detection
  }
  
  // Only use campaign name for brand detection if we couldn't get it from URL
  // and only use the FIRST significant word to avoid over-matching
  if (brandTerms.length === 0 && campaignName) {
    const campaignWords = campaignName.toLowerCase().split(/[\s\-_]+/);
    const commonWords = ['campaign', 'ads', 'google', 'search', 'brand', 'keywords', 'ppc', 'sem', 'marketing', 'test', 'new', 'main', 'primary', 'default'];
    const firstBrandWord = campaignWords.find(word => 
      word.length > 3 && !commonWords.includes(word)
    );
    if (firstBrandWord) {
      brandTerms.push(firstBrandWord);
    }
  }

  const brand: string[] = [];
  const nonBrand: string[] = [];

  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (brandTerms.length > 0 && brandTerms.some(term => kwLower.includes(term))) {
      brand.push(kw);
    } else {
      nonBrand.push(kw);
    }
  });

  return { brand, nonBrand };
}

/**
 * Generate competitor conquest keywords based on industry verticals
 */
function generateCompetitorKeywords(keywords: string[], url: string): string[] {
  const competitorsByVertical: { [key: string]: string[] } = {
    marketing: ['hubspot', 'salesforce', 'mailchimp', 'semrush', 'ahrefs', 'moz'],
    legal: ['avvo', 'findlaw', 'justia', 'martindale', 'lawyers.com'],
    healthcare: ['zocdoc', 'healthgrades', 'webmd', 'vitals'],
    realestate: ['zillow', 'redfin', 'trulia', 'realtor.com', 'opendoor'],
    ecommerce: ['amazon', 'ebay', 'shopify', 'etsy', 'walmart'],
    software: ['salesforce', 'microsoft', 'oracle', 'sap', 'workday'],
    telecom: ['nextiva', 'ringcentral', 'vonage', 'dialpad', 'zoom'],
    insurance: ['geico', 'progressive', 'allstate', 'state farm', 'liberty mutual'],
    finance: ['quickbooks', 'freshbooks', 'xero', 'wave', 'netsuite'],
    crm: ['hubspot crm', 'salesforce crm', 'pipedrive', 'zoho crm', 'monday']
  };

  // Extract meaningful service terms from keywords
  const serviceTerms = keywords.slice(0, 5)
    .flatMap(kw => kw.split(' '))
    .filter(w => w.length > 3)
    .slice(0, 3);

  // Detect vertical from URL and keywords
  let vertical: string | null = null;
  const urlLower = url.toLowerCase();
  const keywordsLower = keywords.map(kw => kw.toLowerCase()).join(' ');
  
  Object.keys(competitorsByVertical).forEach(v => {
    if (v !== 'default' && (urlLower.includes(v) || keywordsLower.includes(v))) {
      vertical = v;
    }
  });

  const conquestKeywords: string[] = [];

  // If we found a vertical, generate conquest keywords with real competitor names
  if (vertical) {
    const competitors = competitorsByVertical[vertical];
    competitors.slice(0, 3).forEach(comp => {
      conquestKeywords.push(`${comp} alternative`);
      conquestKeywords.push(`${comp} vs`);
      if (serviceTerms.length > 0) {
        conquestKeywords.push(`${comp} ${serviceTerms[0]}`);
      }
    });
  } else {
    // No vertical detected - generate generic conquest patterns using service terms
    // These create useful competitor-style keywords without nonsense placeholder names
    if (serviceTerms.length > 0) {
      const primaryService = serviceTerms[0];
      conquestKeywords.push(`best ${primaryService} alternative`);
      conquestKeywords.push(`${primaryService} comparison`);
      conquestKeywords.push(`top ${primaryService} companies`);
      conquestKeywords.push(`${primaryService} vs competitors`);
      conquestKeywords.push(`switch ${primaryService} provider`);
    }
  }

  return conquestKeywords;
}

/**
 * Main function to generate campaign structure
 */
export function generateCampaignStructure(
  keywords: string[],
  settings: StructureSettings
): CampaignStructure {
  const { structureType } = settings;

  switch (structureType) {
    case 'skag':
      return generateSKAG(keywords, settings);
    case 'stag':
      return generateSTAG(keywords, settings);
    case 'mix':
      return generateMIX(keywords, settings);
    case 'stag_plus':
      return generateSTAGPlus(keywords, settings);
    case 'intent':
      return generateIntentStructure(keywords, settings);
    case 'alpha_beta':
      return generateAlphaBeta(keywords, settings);
    case 'match_type':
      return generateMatchTypeSplit(keywords, settings);
    case 'geo':
      return generateGeoSegmented(keywords, settings);
    case 'funnel':
      return generateFunnelStructure(keywords, settings);
    case 'brand_split':
      return generateBrandSplit(keywords, settings);
    case 'competitor':
      return generateCompetitor(keywords, settings);
    case 'ngram':
      return generateNgramClusters(keywords, settings);
    case 'long_tail':
      return generateLongTail(keywords, settings);
    case 'seasonal':
      return generateSeasonal(keywords, settings);
    default:
      return generateSTAG(keywords, settings); // Default fallback
  }
}

/**
 * Helper function to build location_target string from settings
 */
function buildLocationTarget(settings: StructureSettings): string | undefined {
  const locations: string[] = [];
  
  if (settings.geoType === 'STATE' && settings.selectedStates && settings.selectedStates.length > 0) {
    locations.push(...settings.selectedStates);
  } else if (settings.geoType === 'CITY' && settings.selectedCities && settings.selectedCities.length > 0) {
    locations.push(...settings.selectedCities);
  } else if (settings.geoType === 'ZIP' && settings.selectedZips && settings.selectedZips.length > 0) {
    locations.push(...settings.selectedZips);
  } else if (settings.targetCountry && (settings.geoType === 'COUNTRY' || !settings.geoType || settings.geoType === '')) {
    // Include country when COUNTRY is selected or no specific geo type
    locations.push(settings.targetCountry);
  }
  
  return locations.length > 0 ? locations.join(', ') : undefined;
}

/**
 * Helper function to add location data to campaign
 */
function addLocationDataToCampaign(campaign: Campaign, settings: StructureSettings): void {
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
}

/**
 * Helper function to add location data to ad group
 */
function addLocationDataToAdGroup(adGroup: AdGroup, settings: StructureSettings): void {
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    adGroup.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    adGroup.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    adGroup.states = settings.selectedStates;
  }
}

/**
 * SKAG: Single Keyword Ad Group
 * Each keyword gets its own ad group
 */
function generateSKAG(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  const locationTarget = buildLocationTarget(settings);

  const adgroups = keywords.map((keyword) => ({
    adgroup_name: keyword,
    keywords: matchTypes.map(mt => formatKeyword(keyword, mt)),
    match_types: matchTypes,
    ads: ads,
    negative_keywords: negativeKeywords,
    location_target: locationTarget
  }));

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * STAG: Single Theme Ad Group
 * Group keywords thematically
 */
function generateSTAG(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  const locationTarget = buildLocationTarget(settings);
  
  // Simple thematic grouping: group by first word
  const groups: { [key: string]: string[] } = {};
  keywords.forEach(kw => {
    const firstWord = kw.split(' ')[0].toLowerCase();
    if (!groups[firstWord]) {
      groups[firstWord] = [];
    }
    groups[firstWord].push(kw);
  });

  const adgroups = Object.entries(groups).slice(0, 15).map(([theme, groupKeywords], idx) => ({
    adgroup_name: `Ad Group ${idx + 1} - ${theme}`,
    keywords: groupKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
    match_types: matchTypes,
    ads: ads,
    negative_keywords: negativeKeywords,
    location_target: locationTarget
  }));

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * MIX: Hybrid Structure
 * Combination of SKAG and STAG
 */
function generateMIX(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  const adgroups: AdGroup[] = [];
  
  // First 8 keywords as SKAG
  keywords.slice(0, 8).forEach((keyword) => {
    const adGroup: AdGroup = {
      adgroup_name: keyword,
      keywords: matchTypes.map(mt => formatKeyword(keyword, mt)),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    adgroups.push(adGroup);
  });

  // Rest grouped thematically
  const remaining = keywords.slice(8);
  const groups: { [key: string]: string[] } = {};
  remaining.forEach(kw => {
    const firstWord = kw.split(' ')[0].toLowerCase();
    if (!groups[firstWord]) {
      groups[firstWord] = [];
    }
    groups[firstWord].push(kw);
  });

  Object.entries(groups).forEach(([theme, groupKeywords], idx) => {
    const adGroup: AdGroup = {
      adgroup_name: `Mixed Group ${idx + 1} - ${theme}`,
      keywords: groupKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    adgroups.push(adGroup);
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * STAG+: Smart Grouping with ML/N-gram clustering
 */
function generateSTAGPlus(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Use smart clusters if available, otherwise use n-gram clustering
  const clusters = settings.smartClusters || clusterByNGram(keywords);
  
  const adgroups = Object.entries(clusters).map(([clusterName, clusterKeywords], idx) => {
    const adGroup: AdGroup = {
      adgroup_name: `Smart Group ${idx + 1} - ${clusterName}`,
      keywords: clusterKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    return adGroup;
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Intent-Based: Group by intent (Transactional, Commercial, Informational, Navigational)
 */
function generateIntentStructure(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Auto-classify keywords if intentGroups is empty or not provided
  const hasProvidedIntentGroups = settings.intentGroups && 
    Object.values(settings.intentGroups).some(arr => arr && arr.length > 0);
  const intentGroups = hasProvidedIntentGroups 
    ? settings.intentGroups! 
    : autoClassifyIntentGroups(keywords);
  
  // Respect user's selected intents if provided, otherwise show all populated groups
  const allIntentTypes = ['transactional', 'commercial', 'informational', 'navigational'];
  const selectedIntents = settings.selectedIntents && settings.selectedIntents.length > 0
    ? settings.selectedIntents
    : allIntentTypes;
  
  const adgroups: AdGroup[] = [];
  
  selectedIntents.forEach((intent) => {
    const intentKeywords = intentGroups[intent] || [];
    if (intentKeywords.length > 0) {
      const intentLabel = intent.charAt(0).toUpperCase() + intent.slice(1);
      adgroups.push({
        adgroup_name: `Intent: ${intentLabel}`,
        keywords: intentKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: getIntentBasedAds(intent, settings),
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      });
    }
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Alpha-Beta: Alpha (high-intent exact match) and Beta (broad match discovery)
 */
function generateAlphaBeta(keywords: string[], settings: StructureSettings): CampaignStructure {
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Auto-split keywords if not provided
  const hasProvidedSplit = (settings.alphaKeywords && settings.alphaKeywords.length > 0) ||
    (settings.betaKeywords && settings.betaKeywords.length > 0);
  
  let alphaKeywords: string[];
  let betaKeywords: string[];
  
  if (hasProvidedSplit) {
    alphaKeywords = settings.alphaKeywords || [];
    betaKeywords = settings.betaKeywords || keywords;
  } else {
    const split = autoSplitAlphaBeta(keywords);
    alphaKeywords = split.alpha;
    betaKeywords = split.beta;
  }
  
  const adgroups: AdGroup[] = [];
  
  // Alpha Campaign: Exact match only for high-intent keywords
  if (alphaKeywords.length > 0) {
    adgroups.push({
      adgroup_name: 'Alpha - High Intent (Exact)',
      keywords: alphaKeywords.map(kw => formatKeyword(kw, 'exact')),
      match_types: ['exact'],
      ads: getAlphaAds(settings),
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    });
  }
  
  // Beta Campaign: Broad match for discovery
  if (betaKeywords.length > 0) {
    adgroups.push({
      adgroup_name: 'Beta - Discovery (Broad)',
      keywords: betaKeywords.map(kw => formatKeyword(kw, 'broad')),
      match_types: ['broad'],
      ads: getBetaAds(settings),
      negative_keywords: [...negativeKeywords, ...alphaKeywords.map(kw => `[${kw}]`)],
      location_target: buildLocationTarget(settings)
    });
  }

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Match-Type Split: Separate campaigns/ad groups by match type
 */
function generateMatchTypeSplit(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  const adgroups: AdGroup[] = [];
  
  matchTypes.forEach((matchType) => {
    adgroups.push({
      adgroup_name: `${matchType.charAt(0).toUpperCase() + matchType.slice(1)} Match`,
      keywords: keywords.map(kw => formatKeyword(kw, matchType)),
      match_types: [matchType],
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    });
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * GEO-Segmented: One campaign per geo unit
 */
function generateGeoSegmented(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  const campaigns: Campaign[] = [];
  
  if (settings.geoType === 'STATE' && settings.selectedStates) {
    settings.selectedStates.forEach((state) => {
      campaigns.push({
        campaign_name: `${settings.campaignName} - ${state}`,
        adgroups: [{
          adgroup_name: `${state} Ad Group`,
          keywords: keywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
          match_types: matchTypes,
          ads: ads,
          negative_keywords: negativeKeywords,
          location_target: state
        }]
      });
    });
  } else if (settings.geoType === 'CITY' && settings.selectedCities) {
    settings.selectedCities.forEach((city) => {
      campaigns.push({
        campaign_name: `${settings.campaignName} - ${city}`,
        adgroups: [{
          adgroup_name: `${city} Ad Group`,
          keywords: keywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
          match_types: matchTypes,
          ads: ads,
          negative_keywords: negativeKeywords,
          location_target: city
        }]
      });
    });
  } else if (settings.geoType === 'ZIP' && settings.selectedZips) {
    settings.selectedZips.forEach((zip) => {
      campaigns.push({
        campaign_name: `${settings.campaignName} - ${zip}`,
        adgroups: [{
          adgroup_name: `ZIP ${zip} Ad Group`,
          keywords: keywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
          match_types: matchTypes,
          ads: ads,
          negative_keywords: negativeKeywords,
          location_target: zip
        }]
      });
    });
  } else {
    // Default: single campaign
    campaigns.push({
      campaign_name: settings.campaignName,
      adgroups: [{
        adgroup_name: 'Default Ad Group',
        keywords: keywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: ads,
        negative_keywords: negativeKeywords,
    location_target: buildLocationTarget(settings)
      }]
    });
  }

  return { campaigns };
}

/**
 * Funnel-Based: TOF (Awareness) / MOF (Consideration) / BOF (Conversion) grouping
 */
function generateFunnelStructure(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Auto-classify keywords if funnelGroups is empty or not provided
  const hasProvidedFunnelGroups = settings.funnelGroups && 
    Object.values(settings.funnelGroups).some(arr => arr && arr.length > 0);
  const funnelGroups = hasProvidedFunnelGroups 
    ? settings.funnelGroups! 
    : autoClassifyFunnelGroups(keywords);
  
  const adgroups: AdGroup[] = [];
  
  ['tof', 'mof', 'bof'].forEach((stage) => {
    const stageKeywords = funnelGroups[stage] || [];
    if (stageKeywords.length > 0) {
      const stageName = stage.toUpperCase();
      const adGroup: AdGroup = {
        adgroup_name: `${stageName} - ${getFunnelStageName(stage)}`,
        keywords: stageKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: getFunnelBasedAds(stage, settings),
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      };
      addLocationDataToAdGroup(adGroup, settings);
      adgroups.push(adGroup);
    }
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Brand vs Non-Brand Split - Auto-detects brand keywords from URL/campaign name
 */
function generateBrandSplit(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Auto-detect brand keywords if not provided
  const hasProvidedBrandKeywords = (settings.brandKeywords && settings.brandKeywords.length > 0) ||
    (settings.nonBrandKeywords && settings.nonBrandKeywords.length > 0);
  
  let brandKeywords: string[];
  let nonBrandKeywords: string[];
  
  if (hasProvidedBrandKeywords) {
    brandKeywords = settings.brandKeywords || [];
    nonBrandKeywords = settings.nonBrandKeywords || keywords.filter(kw => !brandKeywords.includes(kw));
  } else {
    const detected = autoDetectBrandKeywords(keywords, settings.url, settings.campaignName);
    brandKeywords = detected.brand;
    nonBrandKeywords = detected.nonBrand;
  }
  
  const adgroups: AdGroup[] = [];
  
  // Brand campaign with non-brand negatives
  if (brandKeywords.length > 0) {
    const adGroup: AdGroup = {
      adgroup_name: 'Brand Keywords',
      keywords: brandKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    adgroups.push(adGroup);
  }
  
  // Non-brand campaign with brand negatives
  if (nonBrandKeywords.length > 0) {
    const adGroup: AdGroup = {
      adgroup_name: 'Non-Brand Keywords',
      keywords: nonBrandKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: [...negativeKeywords, ...brandKeywords],
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    adgroups.push(adGroup);
  }

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Competitor Campaigns - Generate conquest keywords based on industry
 */
function generateCompetitor(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Use provided competitor keywords or auto-generate them
  let competitorKeywords: string[];
  
  if (settings.competitorKeywords && settings.competitorKeywords.length > 0) {
    competitorKeywords = settings.competitorKeywords;
  } else {
    // First check if any existing keywords match common competitor patterns
    const existingCompetitorKws = keywords.filter(kw => 
      ['alternative', 'vs', 'versus', 'compare', 'competitor', 'switch from', 'better than'].some(c => 
        kw.toLowerCase().includes(c)
      )
    );
    
    if (existingCompetitorKws.length > 0) {
      competitorKeywords = existingCompetitorKws;
    } else {
      // Generate competitor conquest keywords
      competitorKeywords = generateCompetitorKeywords(keywords, settings.url);
    }
  }
  
  const adgroups: AdGroup[] = [];
  
  if (competitorKeywords.length > 0) {
    adgroups.push({
      adgroup_name: 'Competitor Conquest',
      keywords: competitorKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: getCompetitorAds(settings),
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    });
  }

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * N-Gram Smart Clustering
 */
function generateNgramClusters(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getDefaultAds(settings);
  // Ensure all ads have final_url
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  const clusters = settings.smartClusters || clusterByNGram(keywords);
  
  const adgroups = Object.entries(clusters).map(([clusterName, clusterKeywords], idx) => ({
    adgroup_name: `Cluster ${idx + 1} - ${clusterName}`,
    keywords: clusterKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
    match_types: matchTypes,
    ads: ads,
    negative_keywords: negativeKeywords,
    location_target: buildLocationTarget(settings)
  }));

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  // Add location data at campaign level if available
  if (settings.selectedZips && settings.selectedZips.length > 0) {
    campaign.zip_codes = settings.selectedZips;
  }
  if (settings.selectedCities && settings.selectedCities.length > 0) {
    campaign.cities = settings.selectedCities;
  }
  if (settings.selectedStates && settings.selectedStates.length > 0) {
    campaign.states = settings.selectedStates;
  }
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Long-Tail Master: Focus on 4+ word keywords for lower competition & higher conversion
 * Only includes true long-tail keywords (4 or more words)
 */
function generateLongTail(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getLongTailAds(settings);
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Filter for true long-tail keywords (4+ words only)
  const longTailKeywords = keywords.filter(kw => kw.trim().split(/\s+/).length >= 4);
  
  const adgroups: AdGroup[] = [];
  
  // Group long-tail keywords by theme (first 2 words)
  if (longTailKeywords.length > 0) {
    const longTailGroups: { [key: string]: string[] } = {};
    longTailKeywords.forEach(kw => {
      const words = kw.toLowerCase().split(' ');
      const themeKey = words.slice(0, 2).join(' ');
      if (!longTailGroups[themeKey]) {
        longTailGroups[themeKey] = [];
      }
      longTailGroups[themeKey].push(kw);
    });
    
    Object.entries(longTailGroups).slice(0, 15).forEach(([theme, groupKeywords], idx) => {
      const adGroup: AdGroup = {
        adgroup_name: `Long-Tail ${idx + 1} - ${theme}`,
        keywords: groupKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: ads,
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      };
      addLocationDataToAdGroup(adGroup, settings);
      adgroups.push(adGroup);
    });
  }
  
  // If no 4+ word keywords exist, show a message that no true long-tail keywords were found
  // Create a single group with available keywords (but ideally user should generate more long-tail keywords)
  if (adgroups.length === 0) {
    // Try to find keywords with 3+ words as fallback
    const fallbackKeywords = keywords.filter(kw => kw.trim().split(/\s+/).length >= 3);
    if (fallbackKeywords.length > 0) {
      adgroups.push({
        adgroup_name: 'Long-Tail Keywords (3+ words)',
        keywords: fallbackKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: ads,
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      });
    } else {
      // Last resort: use longest keywords available
      const sortedByLength = [...keywords].sort((a, b) => 
        b.trim().split(/\s+/).length - a.trim().split(/\s+/).length
      ).slice(0, 20);
      
      adgroups.push({
        adgroup_name: 'Keywords (Consider adding longer keywords)',
        keywords: sortedByLength.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
        match_types: matchTypes,
        ads: ads,
        negative_keywords: negativeKeywords,
        location_target: buildLocationTarget(settings)
      });
    }
  }

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups
  };
  
  addLocationDataToCampaign(campaign, settings);
  
  return {
    campaigns: [campaign]
  };
}

/**
 * Seasonal Sprint: Time-based campaigns with start/end dates
 */
function generateSeasonal(keywords: string[], settings: StructureSettings): CampaignStructure {
  const matchTypes = getMatchTypes(settings.matchTypes);
  let ads = settings.ads || getSeasonalAds(settings);
  ads = ads.map(ad => ({
    ...ad,
    final_url: ad.final_url || settings.url || 'https://www.example.com'
  }));
  const negativeKeywords = settings.negativeKeywords || [];
  
  // Group keywords thematically for seasonal campaign
  const groups: { [key: string]: string[] } = {};
  keywords.forEach(kw => {
    const firstWord = kw.split(' ')[0].toLowerCase();
    if (!groups[firstWord]) {
      groups[firstWord] = [];
    }
    groups[firstWord].push(kw);
  });

  const adgroups = Object.entries(groups).slice(0, 10).map(([theme, groupKeywords], idx) => {
    const adGroup: AdGroup = {
      adgroup_name: `Seasonal ${idx + 1} - ${theme}`,
      keywords: groupKeywords.flatMap(kw => matchTypes.map(mt => formatKeyword(kw, mt))),
      match_types: matchTypes,
      ads: ads,
      negative_keywords: negativeKeywords,
      location_target: buildLocationTarget(settings)
    };
    addLocationDataToAdGroup(adGroup, settings);
    return adGroup;
  });

  const campaign: Campaign = {
    campaign_name: settings.campaignName,
    adgroups,
    start_date: settings.startDate,
    end_date: settings.endDate
  };
  
  addLocationDataToCampaign(campaign, settings);
  
  return {
    campaigns: [campaign]
  };
}

// Helper Functions

function getMatchTypes(matchTypes: { broad: boolean; phrase: boolean; exact: boolean }): string[] {
  const types: string[] = [];
  if (matchTypes.broad) types.push('broad');
  if (matchTypes.phrase) types.push('phrase');
  if (matchTypes.exact) types.push('exact');
  return types.length > 0 ? types : ['broad', 'phrase', 'exact'];
}

function formatKeyword(keyword: string, matchType: string): string {
  if (matchType === 'exact') {
    return `[${keyword}]`;
  } else if (matchType === 'phrase') {
    return `"${keyword}"`;
  }
  return keyword; // broad
}

function clusterByNGram(keywords: string[]): { [key: string]: string[] } {
  const clusters: { [key: string]: string[] } = {};
  keywords.forEach(kw => {
    const words = kw.toLowerCase().split(' ');
    const clusterKey = words[0] || 'other';
    if (!clusters[clusterKey]) {
      clusters[clusterKey] = [];
    }
    clusters[clusterKey].push(kw);
  });
  return clusters;
}

function getDefaultAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  
  // Use smart ad copy generator for Google-compliant ads
  const smartAd = generateSmartAdCopy(mainKeyword);
  
  return [{
    type: 'rsa',
    headline1: smartAd.headline1,
    headline2: smartAd.headline2,
    headline3: smartAd.headline3,
    description1: smartAd.description1,
    description2: smartAd.description2,
    final_url: settings.url
  }];
}

function getAlphaAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  return [{
    type: 'rsa',
    headline1: `${mainKeyword} - Exact Match Solution`,
    headline2: 'Precision Targeting',
    headline3: 'Optimized Performance',
    description1: `Get the exact ${mainKeyword} solution you need.`,
    description2: 'Tailored for high-converting searches.',
    final_url: settings.url
  }];
}

function getBetaAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  return [{
    type: 'rsa',
    headline1: `Best ${mainKeyword} Options`,
    headline2: 'Compare & Choose',
    headline3: 'Multiple Solutions',
    description1: `Explore various ${mainKeyword} options.`,
    description2: 'Find the perfect fit for your needs.',
    final_url: settings.url
  }];
}

function getIntentBasedAds(intent: string, settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  
  if (intent === 'high_intent') {
    return [{
      type: 'rsa',
      headline1: `Need ${mainKeyword} Now?`,
      headline2: 'Immediate Solutions',
      headline3: 'Fast Response',
      description1: `Get ${mainKeyword} immediately.`,
      description2: 'Quick and reliable service.',
      final_url: settings.url
    }];
  } else if (intent === 'research') {
    return [{
      type: 'rsa',
      headline1: `Affordable ${mainKeyword} Info`,
      headline2: 'Compare Prices',
      headline3: 'Research Options',
      description1: `Learn about ${mainKeyword} pricing.`,
      description2: 'Make informed decisions.',
      final_url: settings.url
    }];
  }
  
  return getDefaultAds(settings);
}

function getCompetitorAds(settings: StructureSettings): Ad[] {
  return [{
    type: 'rsa',
    headline1: 'Better Than Your Current Provider',
    headline2: 'Superior Solutions',
    headline3: 'Proven Results',
    description1: 'Switch to a better solution.',
    description2: 'Experience the difference.',
    final_url: settings.url
  }];
}

function getFunnelBasedAds(stage: string, settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  
  if (stage === 'tof') {
    return [{
      type: 'rsa',
      headline1: `Learn About ${mainKeyword}`,
      headline2: 'Educational Resources',
      headline3: 'Expert Guides',
      description1: `Discover everything about ${mainKeyword}.`,
      description2: 'Start your journey here.',
      final_url: settings.url
    }];
  } else if (stage === 'bof') {
    return [{
      type: 'rsa',
      headline1: `Get ${mainKeyword} Today`,
      headline2: 'Call to Action',
      headline3: 'Limited Time Offer',
      description1: `Act now and get ${mainKeyword}.`,
      description2: 'Don\'t miss out!',
      final_url: settings.url
    }];
  }
  
  return getDefaultAds(settings);
}

function getFunnelStageName(stage: string): string {
  const names: { [key: string]: string } = {
    'tof': 'Top of Funnel',
    'mof': 'Middle of Funnel',
    'bof': 'Bottom of Funnel'
  };
  return names[stage] || stage;
}

function getLongTailAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  return [{
    type: 'rsa',
    headline1: `Specific ${mainKeyword} Solutions`,
    headline2: 'Targeted Results',
    headline3: 'Low Competition Keywords',
    description1: `Find exactly what you need with our targeted ${mainKeyword} solutions.`,
    description2: 'Higher conversion rates with specific keyword targeting.',
    final_url: settings.url
  }];
}

function getSeasonalAds(settings: StructureSettings): Ad[] {
  const mainKeyword = settings.keywords[0] || 'your service';
  return [{
    type: 'rsa',
    headline1: `Limited Time ${mainKeyword} Offer`,
    headline2: 'Seasonal Special - Act Now',
    headline3: 'Exclusive Deals Available',
    description1: `Don't miss our limited-time ${mainKeyword} offer. Book today!`,
    description2: 'Seasonal promotion ends soon. Get your discount now!',
    final_url: settings.url
  }];
}
