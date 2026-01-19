import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

export interface ExtensionGenerationContext {
  url: string;
  keywords: string[];
  vertical: string;
  intent?: string;
  cta?: string;
  businessName: string;
  ads?: any[];
}

/**
 * Generate realistic extensions using AI based on context
 */
export async function generateExtensionsWithAI(
  context: ExtensionGenerationContext,
  extensionType: string
): Promise<any> {
  try {
    const mainKeyword = context.keywords[0] || context.vertical;
    const adSummary = context.ads?.slice(0, 2).map(ad => 
      ad.headline1 || ad.headlines?.[0] || ''
    ).join(' | ');

    const prompt = `You are a Google Ads expert. Generate realistic, appropriate ${extensionType} extensions for:
- Business: ${context.businessName}
- Website: ${context.url}
- Main Keyword: ${mainKeyword}
- Vertical: ${context.vertical}
- Intent: ${context.intent || 'general'}
- CTA: ${context.cta || 'Contact'}
- Ad Headlines: ${adSummary}

Generate ${extensionType} extension content that is:
1. Specific to this business/vertical (NOT generic)
2. Keyword-relevant 
3. Action-oriented
4. Concise and Google Ads compliant

Return ONLY a JSON object (no markdown, no extra text) with this structure:
${getExtensionSchema(extensionType)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return getDefaultExtension(extensionType, context);
  } catch (error) {
    console.error('Error generating extension with AI:', error);
    return getDefaultExtension(extensionType, context);
  }
}

function getExtensionSchema(type: string): string {
  switch (type) {
    case 'snippet':
      return `{"header": "string (e.g., 'Services')", "values": ["item1", "item2", "item3"]}`;
    case 'callout':
      return `{"callouts": ["item1", "item2", "item3"]}`;
    case 'sitelink':
      return `{"sitelinks": [{"text": "link text", "description": "description"}, ...]}`;
    case 'call':
      return `{"phone": "phone number (e.g., +1-555-123-4567)"}`;
    case 'message':
      return `{"message": "message text"}`;
    case 'promotion':
      return `{"promotionText": "promotion text (e.g., 'Save 20% today')"}`;
    default:
      return `{"text": "extension text"}`;
  }
}

function getDefaultExtension(type: string, context: ExtensionGenerationContext): any {
  const keyword = context.keywords[0] || 'service';
  
  switch (type) {
    case 'snippet':
      return {
        header: 'Services',
        values: [
          `${keyword} Specialists`,
          `Expert ${keyword}`,
          `Professional ${keyword} Help`
        ]
      };
    case 'callout':
      return {
        callouts: [
          `24/7 ${context.cta || 'Support'}`,
          'Free Consultation',
          'Expert Service Team'
        ]
      };
    case 'sitelink':
      return {
        sitelinks: [
          { text: context.cta || 'Contact Us', description: 'Get in touch today' },
          { text: 'Our Services', description: `Learn about our ${keyword} services` }
        ]
      };
    case 'call':
      return { phone: '(555) 123-4567' };
    case 'message':
      return { message: `Message us about ${keyword}` };
    case 'promotion':
      return { promotionText: `Special ${keyword} offer available now` };
    default:
      return { text: `${context.businessName} ${type}` };
  }
}
