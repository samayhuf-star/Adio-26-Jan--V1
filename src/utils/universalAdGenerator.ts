/**
 * Universal Ad Architect - 4-Pillar Bucket System
 * 
 * High-performance Google Responsive Search Ads (RSA) generator
 * Designed for any industry while adhering to Google's 2025 Ad Rank algorithms
 * 
 * 4-PILLAR SYSTEM:
 * 1. RELEVANCE (4 Headlines) - DKI syntax, match search intent
 * 2. BENEFITS & SOLUTIONS (4 Headlines) - Results-focused, not product-focused
 * 3. TRUST & SOCIAL PROOF (4 Headlines) - Numbers, ratings, certifications
 * 4. CALL TO ACTION (3 Headlines) - Strong, varied action verbs
 * 
 * DESCRIPTIONS:
 * - Desc 1: {KeyWord:Default} + USP + CTA
 * - Desc 2: Problem + Solution + Trust Signal
 * - Desc 3: Offer-focused + Urgency
 * - Desc 4: Narrative "After State" (user success)
 * 
 * GUARDRAILS:
 * - 27-Character Target for headlines (clean mobile display)
 * - Diversity Check: No two headlines start with same 3 words
 * - No truncation: Every line is a complete thought
 */

import { CHARACTER_LIMITS, buildDKIDefault, applyDKICapitalization, sanitizeAdText, formatHeadline, formatDescription, areHeadlinesSimilar } from './googleAdsRules';

export interface UniversalAdInput {
  industry: string;
  keywords: string[];
  uniqueValueProposition?: string;
  audiencePainPoint?: string;
  businessName: string;
  location?: string;
  baseUrl?: string;
  phoneNumber?: string;
}

export interface UniversalRSA {
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  displayPath: string[];
  pillarBreakdown: {
    relevance: string[];
    benefits: string[];
    trust: string[];
    cta: string[];
  };
}

export interface UniversalDKIAd {
  headline1: string;
  headline2: string;
  headline3: string;
  description1: string;
  description2: string;
  finalUrl: string;
  displayPath: string[];
}

export interface UniversalCallAd {
  businessName: string;
  headline1: string;
  headline2: string;
  description1: string;
  description2: string;
  phoneNumber: string;
  verificationUrl: string;
  displayPath: string[];
}

const HEADLINE_TARGET = 27;
const HEADLINE_MAX = 30;
const DESCRIPTION_MAX = 90;
const DKI_DEFAULT_MAX = 18;

function cleanKeyword(keyword: string): string {
  if (!keyword) return '';
  return keyword
    .replace(/^\[(.+)\]$/, '$1')
    .replace(/^"(.+)"$/, '$1')
    .replace(/^\+/, '')
    .trim();
}

function cleanKeywords(keywords: string[]): string[] {
  return keywords.map(kw => cleanKeyword(kw)).filter(kw => kw.length > 0);
}

function titleCase(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function truncateToTarget(text: string, target: number = HEADLINE_TARGET, max: number = HEADLINE_MAX): string {
  if (text.length <= target) return text;
  if (text.length <= max) return text;
  
  const words = text.split(' ');
  let result = '';
  
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length <= target) {
      result = candidate;
    } else {
      break;
    }
  }
  
  return result || text.substring(0, target);
}

function truncateDescription(text: string, max: number = DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  
  const words = text.split(' ');
  let result = '';
  
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length <= max) {
      result = candidate;
    } else {
      break;
    }
  }
  
  return result || text.substring(0, max);
}

function getFirstThreeWords(text: string): string {
  return text.split(' ').slice(0, 3).join(' ').toLowerCase();
}

function ensureDiversity(headlines: string[]): string[] {
  const usedPrefixes = new Set<string>();
  const uniqueHeadlines: string[] = [];
  
  for (const headline of headlines) {
    const prefix = getFirstThreeWords(headline);
    if (!usedPrefixes.has(prefix)) {
      usedPrefixes.add(prefix);
      uniqueHeadlines.push(headline);
    }
  }
  
  return uniqueHeadlines;
}

function buildDKIHeadline(keyword: string): string {
  const cleanKw = cleanKeyword(keyword);
  const defaultText = cleanKw.length <= DKI_DEFAULT_MAX 
    ? titleCase(cleanKw)
    : titleCase(cleanKw.split(' ').slice(0, 2).join(' ')).substring(0, DKI_DEFAULT_MAX);
  
  return `{KeyWord:${defaultText}}`;
}

function generatePillar1Relevance(input: UniversalAdInput): string[] {
  const keywords = cleanKeywords(input.keywords);
  const mainKw = keywords[0] || input.industry;
  const secondKw = keywords[1] || mainKw;
  const thirdKw = keywords[2] || mainKw;
  
  const headlines: string[] = [];
  
  const kwTitle = titleCase(mainKw);
  const secondKwTitle = titleCase(secondKw);
  
  headlines.push(truncateToTarget(`${kwTitle} Services`));
  headlines.push(truncateToTarget(`Professional ${kwTitle}`));
  headlines.push(truncateToTarget(`Expert ${kwTitle} Help`));
  headlines.push(truncateToTarget(`${kwTitle} Near You`));
  
  if (secondKw !== mainKw) {
    headlines.push(truncateToTarget(`${secondKwTitle} Experts`));
  }
  
  if (input.location) {
    headlines.push(truncateToTarget(`${input.location} ${kwTitle}`));
  }
  
  return ensureDiversity(headlines).slice(0, 4);
}

function generatePillar2Benefits(input: UniversalAdInput): string[] {
  const keywords = cleanKeywords(input.keywords);
  const mainKw = keywords[0] || input.industry;
  const industry = input.industry.toLowerCase();
  
  const benefitTemplates = getBenefitsByIndustry(industry, mainKw);
  
  const headlines: string[] = [];
  
  for (const benefit of benefitTemplates) {
    headlines.push(truncateToTarget(benefit));
  }
  
  if (input.audiencePainPoint) {
    const painSolution = generatePainSolution(input.audiencePainPoint);
    headlines.push(truncateToTarget(painSolution));
  }
  
  return ensureDiversity(headlines).slice(0, 4);
}

function getBenefitsByIndustry(industry: string, keyword: string): string[] {
  const kwTitle = titleCase(keyword);
  
  const industryBenefits: Record<string, string[]> = {
    plumbing: [
      'Fix Your Leak Fast',
      'Stop Water Damage Today',
      'Save on Repairs Now',
      'No More Plumbing Issues',
      'Lower Your Water Bills',
      'End Drain Problems Fast'
    ],
    electrical: [
      'Safe Electrical Repairs',
      'Stop Flickering Lights',
      'Upgrade Your Wiring',
      'Prevent Electrical Fires',
      'Lower Energy Bills Now',
      'Fix Power Issues Fast'
    ],
    hvac: [
      'Stay Comfortable Always',
      'Lower Energy Costs Now',
      'Fix AC Problems Fast',
      'No More Hot Summers',
      'End Heating Issues Today',
      'Save on Utility Bills'
    ],
    roofing: [
      'Stop Roof Leaks Today',
      'Protect Your Home Now',
      'End Water Damage Fast',
      'Extend Roof Lifespan',
      'No More Leak Worries',
      'Save on Repairs Long-term'
    ],
    legal: [
      'Get Your Max Settlement',
      'Protect Your Rights Now',
      'Win Your Case Today',
      'Get Fair Compensation',
      'Fight for What You Deserve',
      'Justice Within Reach'
    ],
    dental: [
      'Smile With Confidence',
      'Pain-Free Dental Care',
      'Get Your Best Smile',
      'End Tooth Pain Today',
      'Healthy Teeth for Life',
      'Affordable Dental Care'
    ],
    medical: [
      'Feel Better Today',
      'Get Expert Care Now',
      'Your Health First',
      'Quick Recovery Starts Here',
      'Better Health Awaits',
      'Compassionate Care Always'
    ],
    saas: [
      'Automate Your Workflow',
      'Save Hours Every Week',
      'Boost Team Productivity',
      'Streamline Operations',
      'Scale Your Business',
      'Reduce Manual Work'
    ],
    marketing: [
      'Rank #1 on Google',
      'Double Your Traffic',
      'More Leads Every Month',
      'Grow Your Revenue Fast',
      'Outrank Competitors',
      'Dominate Your Market'
    ],
    ecommerce: [
      'Shop Quality Products',
      'Best Prices Guaranteed',
      'Fast Free Shipping',
      'Save on Every Order',
      'Premium at Low Prices',
      'Shop Now Save More'
    ],
    travel: [
      'Book Dream Vacations',
      'Save on Travel Deals',
      'Explore More Pay Less',
      'Best Travel Prices',
      'Adventure Awaits You',
      'Unforgettable Trips Await'
    ],
    realestate: [
      'Find Your Dream Home',
      'Sell Fast Top Dollar',
      'Best Deals in Town',
      'Move In Ready Homes',
      'Expert Home Guidance',
      'Your Perfect Home Awaits'
    ],
    fitness: [
      'Transform Your Body',
      'Reach Your Goals Fast',
      'Get Fit Feel Great',
      'Results in Weeks',
      'Your Best Shape Ever',
      'Stronger Every Day'
    ],
    finance: [
      'Grow Your Wealth Now',
      'Smart Money Decisions',
      'Secure Your Future',
      'Better Financial Health',
      'Save More Earn More',
      'Expert Money Guidance'
    ]
  };
  
  const matchedIndustry = Object.keys(industryBenefits).find(key => 
    industry.includes(key) || key.includes(industry)
  );
  
  if (matchedIndustry) {
    return industryBenefits[matchedIndustry];
  }
  
  return [
    `Get Results with ${kwTitle}`,
    `${kwTitle} Made Easy`,
    `Better ${kwTitle} Solutions`,
    `Quality ${kwTitle} Results`,
    `Expert ${kwTitle} Service`,
    `${kwTitle} Done Right`
  ];
}

function generatePainSolution(painPoint: string): string {
  const pain = painPoint.toLowerCase();
  
  if (pain.includes('time') || pain.includes('slow') || pain.includes('wait')) {
    return 'Get Results Fast';
  }
  if (pain.includes('cost') || pain.includes('expensive') || pain.includes('price')) {
    return 'Affordable Solutions';
  }
  if (pain.includes('quality') || pain.includes('poor') || pain.includes('bad')) {
    return 'Premium Quality Always';
  }
  if (pain.includes('trust') || pain.includes('scam') || pain.includes('reliable')) {
    return 'Trusted by Thousands';
  }
  
  return 'We Solve Your Problems';
}

function generatePillar3Trust(input: UniversalAdInput): string[] {
  const industry = input.industry.toLowerCase();
  const keywords = cleanKeywords(input.keywords);
  const mainKw = keywords[0] || input.industry;
  
  const trustSignals: string[] = [];
  
  trustSignals.push('5-Star Google Rating');
  trustSignals.push('Trusted Since 2010');
  trustSignals.push('Licensed & Insured');
  trustSignals.push('Over 10,000 Customers');
  trustSignals.push('A+ BBB Rating');
  trustSignals.push('100% Satisfaction');
  
  if (industry.includes('legal') || industry.includes('lawyer')) {
    trustSignals.push('No Fee Unless We Win');
    trustSignals.push('Free Case Evaluation');
  }
  
  if (industry.includes('plumb') || industry.includes('electric') || industry.includes('hvac') || industry.includes('roof')) {
    trustSignals.push('24/7 Emergency Service');
    trustSignals.push('Same-Day Service');
    trustSignals.push('Veteran Owned Business');
  }
  
  if (industry.includes('saas') || industry.includes('software') || industry.includes('tech')) {
    trustSignals.push('SOC2 Type II Certified');
    trustSignals.push('Enterprise Ready');
    trustSignals.push('GDPR Compliant');
  }
  
  if (industry.includes('market') || industry.includes('seo') || industry.includes('agency')) {
    trustSignals.push('Google Premier Partner');
    trustSignals.push('Meta Business Partner');
  }
  
  if (industry.includes('medical') || industry.includes('dental') || industry.includes('health')) {
    trustSignals.push('Board Certified');
    trustSignals.push('Award Winning Care');
  }
  
  return ensureDiversity(trustSignals.map(t => truncateToTarget(t))).slice(0, 4);
}

function generatePillar4CTA(input: UniversalAdInput): string[] {
  const keywords = cleanKeywords(input.keywords);
  const mainKw = keywords[0] || input.industry;
  const kwTitle = titleCase(mainKw);
  const industry = input.industry.toLowerCase();
  
  const ctaTemplates: string[] = [];
  
  ctaTemplates.push(truncateToTarget('Get Your Free Quote'));
  ctaTemplates.push(truncateToTarget('Book Now Save More'));
  ctaTemplates.push(truncateToTarget('Start Your Free Trial'));
  ctaTemplates.push(truncateToTarget('Claim Your Discount'));
  ctaTemplates.push(truncateToTarget('Schedule Today'));
  ctaTemplates.push(truncateToTarget('Call Now for Help'));
  
  if (industry.includes('legal') || industry.includes('lawyer')) {
    ctaTemplates.push('Free Case Review');
    ctaTemplates.push('Get Legal Help Now');
  }
  
  if (industry.includes('saas') || industry.includes('software')) {
    ctaTemplates.push('Start Free Trial Now');
    ctaTemplates.push('Get Started Today');
    ctaTemplates.push('Sign Up Free');
  }
  
  if (industry.includes('market') || industry.includes('seo')) {
    ctaTemplates.push('Get My Free Audit');
    ctaTemplates.push('Request Proposal');
  }
  
  if (industry.includes('plumb') || industry.includes('electric') || industry.includes('hvac')) {
    ctaTemplates.push('Schedule Repair Now');
    ctaTemplates.push('Get Same-Day Service');
  }
  
  return ensureDiversity(ctaTemplates).slice(0, 3);
}

function generateDescriptions(input: UniversalAdInput): string[] {
  const keywords = cleanKeywords(input.keywords);
  const mainKw = keywords[0] || input.industry;
  const kwTitle = titleCase(mainKw);
  const industry = input.industry.toLowerCase();
  const businessName = input.businessName;
  const location = input.location || '';
  const usp = input.uniqueValueProposition || 'quality service and expert solutions';
  const painPoint = input.audiencePainPoint || 'finding reliable service';
  
  const descriptions: string[] = [];
  
  const desc1 = truncateDescription(
    `Looking for ${kwTitle}? ${businessName} offers ${usp}. Get your free quote today and see the difference.`
  );
  descriptions.push(desc1);
  
  const desc2 = truncateDescription(
    `Tired of ${painPoint}? Our expert team delivers proven results. Licensed, insured, and trusted by thousands.`
  );
  descriptions.push(desc2);
  
  const desc3 = truncateDescription(
    `Save 20% on your first ${kwTitle} service. Limited time offer. Book now and get same-day availability.`
  );
  descriptions.push(desc3);
  
  const locationPhrase = location ? ` in ${location}` : '';
  const desc4 = truncateDescription(
    `Imagine having reliable ${kwTitle}${locationPhrase} done right the first time. That's what ${businessName} delivers every day.`
  );
  descriptions.push(desc4);
  
  return descriptions;
}

function buildDisplayPath(input: UniversalAdInput): string[] {
  const keywords = cleanKeywords(input.keywords);
  const mainKw = keywords[0] || input.industry;
  
  const path1 = titleCase(mainKw.split(' ')[0]).substring(0, 15);
  const path2 = input.location 
    ? input.location.split(' ')[0].substring(0, 15)
    : 'Services';
  
  return [path1, path2];
}

function buildFinalUrl(input: UniversalAdInput): string {
  if (input.baseUrl) {
    const url = input.baseUrl.startsWith('http') 
      ? input.baseUrl 
      : `https://${input.baseUrl}`;
    return url.replace(/\/$/, '');
  }
  return 'https://example.com';
}

export function generateUniversalRSA(input: UniversalAdInput): UniversalRSA {
  const pillar1 = generatePillar1Relevance(input);
  const pillar2 = generatePillar2Benefits(input);
  const pillar3 = generatePillar3Trust(input);
  const pillar4 = generatePillar4CTA(input);
  
  let allHeadlines = [...pillar1, ...pillar2, ...pillar3, ...pillar4];
  
  // Apply Google Ads compliance validation and sanitization
  allHeadlines = allHeadlines.map(h => {
    const sanitized = sanitizeAdText(h);
    return formatHeadline(sanitized);
  }).filter(h => h.length > 0);
  
  // Ensure substantial differences between headlines (Google requirement)
  allHeadlines = ensureDiversity(allHeadlines);
  
  // Additional diversity check using Google's similarity rules
  const finalHeadlines: string[] = [];
  for (const headline of allHeadlines) {
    const isTooSimilar = finalHeadlines.some(existing => areHeadlinesSimilar(headline, existing));
    if (!isTooSimilar) {
      finalHeadlines.push(headline);
    }
  }
  
  // Generate varied fallback headlines if needed to reach optimal count (10-15)
  const keywords = cleanKeywords(input.keywords);
  const fallbackTemplates = [
    (kw: string) => `${titleCase(kw)} Experts`,
    (kw: string) => `Best ${titleCase(kw)} Team`,
    (kw: string) => `${titleCase(kw)} Specialists`,
    (kw: string) => `Top ${titleCase(kw)} Pros`,
    (kw: string) => `Quality ${titleCase(kw)}`,
    (kw: string) => `Reliable ${titleCase(kw)}`,
    (kw: string) => `Certified ${titleCase(kw)}`,
    (kw: string) => `Award Winning ${titleCase(kw)}`,
    (kw: string) => `Premium ${titleCase(kw)}`,
    (kw: string) => `Leading ${titleCase(kw)}`,
  ];
  
  let templateIndex = 0;
  while (finalHeadlines.length < 15 && templateIndex < fallbackTemplates.length) {
    const kwIndex = templateIndex % Math.max(1, keywords.length);
    const extraKw = keywords[kwIndex] || input.industry;
    const candidate = formatHeadline(sanitizeAdText(fallbackTemplates[templateIndex](extraKw)));
    
    // Only add if it passes Google's similarity check
    const isTooSimilar = finalHeadlines.some(existing => areHeadlinesSimilar(candidate, existing));
    if (!isTooSimilar && candidate.length > 0) {
      finalHeadlines.push(candidate);
    }
    templateIndex++;
  }
  
  // Ensure minimum 3 headlines (Google requirement)
  while (finalHeadlines.length < 3) {
    const fallback = formatHeadline(`${input.businessName} Service`);
    if (!finalHeadlines.includes(fallback)) {
      finalHeadlines.push(fallback);
    } else {
      finalHeadlines.push(formatHeadline(`Professional ${input.industry}`));
      break;
    }
  }
  
  // Generate descriptions with validation
  let descriptions = generateDescriptions(input);
  descriptions = descriptions.map(d => {
    const sanitized = sanitizeAdText(d);
    return formatDescription(sanitized);
  }).filter(d => d.length > 0);
  
  // Ensure minimum 2 descriptions (Google requirement)
  while (descriptions.length < 2) {
    const fallback = formatDescription(`Professional ${input.industry} services. Contact us today for expert solutions.`);
    if (!descriptions.includes(fallback)) {
      descriptions.push(fallback);
    } else {
      descriptions.push(formatDescription(`Quality service guaranteed. Get your free quote now.`));
      break;
    }
  }
  
  const displayPath = buildDisplayPath(input);
  const finalUrl = buildFinalUrl(input);
  
  return {
    headlines: finalHeadlines.slice(0, 15), // Max 15 headlines
    descriptions: descriptions.slice(0, 4), // Max 4 descriptions
    finalUrl,
    displayPath,
    pillarBreakdown: {
      relevance: pillar1,
      benefits: pillar2,
      trust: pillar3,
      cta: pillar4
    }
  };
}

export function generateUniversalDKI(input: UniversalAdInput): UniversalDKIAd {
  const keywords = cleanKeywords(input.keywords);
  const mainKw = keywords[0] || input.industry;
  const kwTitle = titleCase(mainKw);
  const businessName = input.businessName;
  
  const headline1 = buildDKIHeadline(mainKw);
  const headline2 = truncateToTarget(`${businessName} Experts`);
  const headline3 = truncateToTarget('Get Your Free Quote');
  
  const description1 = truncateDescription(
    `Looking for ${kwTitle}? ${businessName} offers expert service at fair prices. Licensed & insured. Call now!`
  );
  const description2 = truncateDescription(
    `Trusted ${kwTitle} professionals. 5-star rated. Same-day service available. Get your free estimate today.`
  );
  
  return {
    headline1,
    headline2,
    headline3,
    description1,
    description2,
    finalUrl: buildFinalUrl(input),
    displayPath: buildDisplayPath(input)
  };
}

export function generateUniversalCallAd(input: UniversalAdInput): UniversalCallAd {
  const keywords = cleanKeywords(input.keywords);
  const mainKw = keywords[0] || input.industry;
  const kwTitle = titleCase(mainKw);
  const businessName = input.businessName.substring(0, 25);
  
  const headline1 = truncateToTarget(`${kwTitle} - Call Now`);
  const headline2 = truncateToTarget('24/7 Service Available');
  
  const description1 = truncateDescription(
    `Professional ${kwTitle} services. Licensed & insured. Free estimates. Call now for immediate assistance!`
  );
  const description2 = truncateDescription(
    `${businessName} - Your trusted ${kwTitle} experts. Fast response. Fair prices. Satisfaction guaranteed.`
  );
  
  return {
    businessName,
    headline1,
    headline2,
    description1,
    description2,
    phoneNumber: input.phoneNumber || '(555) 123-4567',
    verificationUrl: buildFinalUrl(input),
    displayPath: buildDisplayPath(input)
  };
}

export function generateUniversalAds(input: UniversalAdInput, adType: 'RSA' | 'DKI' | 'CALL'): UniversalRSA | UniversalDKIAd | UniversalCallAd {
  switch (adType) {
    case 'RSA':
      return generateUniversalRSA(input);
    case 'DKI':
      return generateUniversalDKI(input);
    case 'CALL':
      return generateUniversalCallAd(input);
    default:
      return generateUniversalRSA(input);
  }
}
