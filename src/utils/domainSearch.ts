/**
 * Domain Search Utility
 * Returns mock domain availability and pricing data
 */

interface DomainSearchResult {
  name: string;
  price: number;
  tld: string;
  available: boolean;
  premiumPrice?: number;
  isPremium?: boolean;
  costPrice?: number; // Original cost
}

// Margin configuration
const DOMAIN_MARGIN_PERCENT = 25; // 25% margin on top of cost

/**
 * Search for domain availability and pricing
 * Returns mock data with realistic pricing
 */
export async function searchDomainResellerClub(
  domainName: string
): Promise<DomainSearchResult[]> {
  // Always return mock results
  return getMockResults(domainName);
}

/**
 * Apply margin percentage to base price
 */
function applyMargin(basePrice: number, marginPercent: number = DOMAIN_MARGIN_PERCENT): number {
  return Math.round((basePrice * (1 + marginPercent / 100)) * 100) / 100;
}


/**
 * Get default prices for TLDs (without margin)
 */
function getDefaultPriceWithoutMargin(tld: string): number {
  const prices: { [key: string]: number } = {
    com: 8.99,
    net: 9.99,
    org: 11.99,
    co: 24.99,
    io: 34.99,
    biz: 9.99,
    info: 8.99,
    us: 7.99,
  };
  return prices[tld] || 12.99;
}

/**
 * Get default prices for TLDs (with 25% margin applied)
 */
function getDefaultPrice(tld: string): number {
  return applyMargin(getDefaultPriceWithoutMargin(tld));
}

/**
 * Generate mock results for fallback (when API is unavailable)
 */
function getMockResults(domainName: string): DomainSearchResult[] {
  const baseName = domainName.split('.')[0];
  const tlds = ['com', 'net', 'org', 'co', 'io'];

  return tlds.map((tld) => ({
    name: `${baseName}.${tld}`,
    tld: tld,
    price: getDefaultPrice(tld),
    available: Math.random() > 0.3, // 70% chance available
    isPremium: Math.random() > 0.85, // 15% chance premium
  }));
}
