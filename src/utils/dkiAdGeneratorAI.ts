export interface DKIAdContext {
  keywords: string[];
  industry: string;
  businessName: string;
  url?: string;
  location?: string;
}

export interface DKIAdResult {
  headline1: string;
  headline2: string;
  headline3: string;
  description1: string;
  description2: string;
}

function buildDKIDefault(keyword: string, maxLength: number = 30): string {
  // Ensure we have a meaningful default text (not truncated)
  let result = keyword.trim();
  
  // If keyword is too long for DKI placeholder, use first 25 chars of keyword as default
  if (result.length > maxLength) {
    result = result.substring(0, maxLength - 1).trim();
  }
  
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function getDefaultDKIAd(context: DKIAdContext): DKIAdResult {
  const mainKeyword = context.keywords[0] || context.industry || 'Service';
  // For headlines: max 30 chars (Google Ads limit)
  // For descriptions: max 90 chars (Google Ads limit)
  const headlineDefault = buildDKIDefault(mainKeyword, 28); // 28 chars + {KeyWord:} = ~39 chars total
  const descriptionDefault = buildDKIDefault(mainKeyword, 85); // 85 chars + {KeyWord:} = ~94 chars total
  
  return {
    headline1: `{KeyWord:${headlineDefault}} Experts`,
    headline2: `Best {KeyWord:${headlineDefault}} Today`,
    headline3: `Professional ${context.businessName.substring(0, 15)} Service`,
    description1: `Need {KeyWord:${descriptionDefault}}? We deliver expert, fast service. ${context.businessName} offers solutions you can trust. Contact us today.`,
    description2: `Looking for {KeyWord:${descriptionDefault}}? We provide quality service with guaranteed satisfaction. Get your free estimate now.`,
  };
}

export async function generateDKIAdWithAI(context: DKIAdContext): Promise<DKIAdResult> {
  try {
    const response = await fetch('/api/generate-dki-ad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: context.keywords,
        industry: context.industry,
        businessName: context.businessName,
        url: context.url,
        location: context.location,
      }),
    });

    if (!response.ok) {
      console.error('DKI API error:', response.status);
      return getDefaultDKIAd(context);
    }

    const result = await response.json() as DKIAdResult;
    
    if (!result.headline1 || !result.description1) {
      console.warn('Incomplete DKI response, using defaults');
      return getDefaultDKIAd(context);
    }
    
    return result;
  } catch (error) {
    console.error('Error generating DKI ad with AI:', error);
    return getDefaultDKIAd(context);
  }
}
