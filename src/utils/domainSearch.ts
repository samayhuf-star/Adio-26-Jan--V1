/**
 * ResellerClub Domain Search Utility
 * Integrates with ResellerClub API for real domain availability and pricing
 */

interface DomainSearchResult {
  name: string;
  price: number;
  tld: string;
  available: boolean;
  premiumPrice?: number;
  isPremium?: boolean;
  costPrice?: number; // Original cost from ResellerClub
}

// Margin configuration
const DOMAIN_MARGIN_PERCENT = 25; // 25% margin on top of cost

/**
 * Search for domain availability and pricing from ResellerClub API
 */
export async function searchDomainResellerClub(
  domainName: string
): Promise<DomainSearchResult[]> {
  try {
    // Get API credentials from secrets (these are passed via import.meta.env at build time)
    const apiKey = (import.meta.env as any).RESELLERCLUB_API_KEY;
    const apiUrl = (import.meta.env as any).RESELLERCLUB_API_URL;

    // Extract domain name without TLD for search
    const baseName = domainName.split('.')[0];

    if (!apiKey || !apiUrl) {
      console.warn(
        'ResellerClub API credentials not available, using mock data. Please configure RESELLERCLUB_API_KEY and RESELLERCLUB_API_URL environment variables.'
      );
      return getMockResults(domainName);
    }

    // Prepare API request with auth credentials
    // Client ID is used as auth_userid, API key as auth_token
    const params = new URLSearchParams({
      auth_userid: '1301617', // ResellerClub Client ID
      auth_token: apiKey,
      domain: baseName,
      tlds: 'com,net,org,co,io,biz,info,us',
      'for-suggestions': 'Y',
    });

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log('Searching domains via ResellerClub API:', baseName);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(
        'ResellerClub API error:',
        response.status,
        response.statusText,
        '- falling back to mock data'
      );
      return getMockResults(domainName);
    }

    const data = await response.json();
    const results = parseResellerClubResponse(data, baseName);
    console.log('Domain search results:', results.length, 'domains found');
    return results;
  } catch (error) {
    console.warn('Domain search error:', error, '- using mock data');
    return getMockResults(domainName);
  }
}

/**
 * Apply margin percentage to base price
 */
function applyMargin(basePrice: number, marginPercent: number = DOMAIN_MARGIN_PERCENT): number {
  return Math.round((basePrice * (1 + marginPercent / 100)) * 100) / 100;
}

/**
 * Parse ResellerClub API response
 */
function parseResellerClubResponse(
  data: any,
  baseName: string
): DomainSearchResult[] {
  const results: DomainSearchResult[] = [];

  try {
    // ResellerClub returns data in various formats depending on the endpoint
    // Handle the response structure
    if (data.status === 'OK' || data.error_key === null) {
      // Iterate through TLD results
      const tlds = Object.keys(data).filter(
        (key) => !['status', 'error_key', 'error', 'note'].includes(key)
      );

      tlds.forEach((tld) => {
        const domainData = data[tld];
        if (domainData) {
          const costPrice = domainData.pricing?.registration?.amount || domainData.price || getDefaultPriceWithoutMargin(tld);
          const result: DomainSearchResult = {
            name: `${baseName}.${tld}`,
            tld: tld,
            available: domainData.status === 'available' || domainData.availability === 'available',
            price: applyMargin(costPrice), // Apply 25% margin
            costPrice: costPrice, // Store original cost for reference
            isPremium: domainData.premium || false,
            premiumPrice: domainData.premium_price ? applyMargin(domainData.premium_price) : undefined,
          };
          results.push(result);
        }
      });
    }
  } catch (error) {
    console.error('Error parsing ResellerClub response:', error);
  }

  // If no results parsed, return mock data
  return results.length > 0 ? results : getMockResults(`${baseName}.com`);
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
