import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const openaiBaseUrl = import.meta.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

let client: OpenAI | null = null;

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: openaiApiKey,
      baseURL: openaiBaseUrl || undefined,
      dangerouslyAllowBrowser: true
    });
  }
  return client;
}

interface TemplateFieldMapping {
  [key: string]: string;
}

export const templateFields: TemplateFieldMapping = {
  'hero.heading': 'Hero Heading',
  'hero.subheading': 'Hero Subheading',
  'hero.ctaText': 'Hero CTA Button',
  'features.heading': 'Features Heading',
  'services.heading': 'Services Heading',
  'services.subheading': 'Services Subheading',
  'testimonials.heading': 'Testimonials Heading',
  'cta.heading': 'CTA Heading',
  'cta.subheading': 'CTA Subheading',
  'cta.ctaText': 'CTA Button',
  'contact.phone': 'Contact Phone',
  'contact.email': 'Contact Email',
  'contact.hours': 'Contact Hours',
  'footer.companyName': 'Company Name',
  'footer.tagline': 'Company Tagline',
  'footer.address': 'Company Address',
  'footer.copyright': 'Copyright Text',
  'styles.primaryColor': 'Primary Color',
  'styles.secondaryColor': 'Secondary Color',
  'styles.spacing': 'Spacing',
  'styles.sectionPadding': 'Section Padding',
  'styles.cardPadding': 'Card Padding',
};

const fieldsList = Object.entries(templateFields)
  .map(([path, label]) => `- ${label} (${path})`)
  .join('\n');

export interface SuggestionOption {
  id: string;
  title: string;
  description: string;
  changes: Record<string, any>;
}

export interface SuggestionsResponse {
  greeting: string;
  suggestions: SuggestionOption[];
}

export async function generateSuggestions(
  userMessage: string,
  templateData: any,
  selectedElementPath?: string
): Promise<SuggestionsResponse> {
  try {
    const currentValues = buildTemplateContext(templateData, selectedElementPath);
    
    const systemPrompt = `You are a friendly website helper that makes editing websites super easy. You analyze what the user wants and provide 3-4 specific options they can apply.

Available things you can change on the website:
${fieldsList}

Current website info:
${currentValues}

Your job is to:
1. Understand what the user wants in plain English
2. Generate 3-4 SPECIFIC options with different variations the user can choose from
3. Each option should have a clear title, description, and the actual changes to make

IMPORTANT LANGUAGE RULES:
- NEVER use technical terms like: hero, CTA, heading, subheading, padding, spacing, section, element, field, primary color
- Instead use: main title, button, description, tagline, the look, colors
- Be conversational and warm like you're helping a friend
- Titles should be SHORT (2-4 words) like "MAIN TITLE" or "GET STARTED BUTTON"

IMPORTANT: Always respond with a JSON object in this exact format:
{
  "greeting": "A brief, friendly intro describing what options you're showing. Keep it short - one sentence.",
  "suggestions": [
    {
      "id": "1",
      "title": "SHORT TITLE IN CAPS",
      "description": "Brief description of what this option will do",
      "changes": {
        "field.path": "new value"
      }
    },
    {
      "id": "2",
      "title": "ANOTHER SHORT TITLE",
      "description": "Brief description of this variation",
      "changes": {
        "field.path": "different value"
      }
    }
  ]
}

For color changes, provide 3-4 color scheme options (blue, purple, orange, green, etc).
For text changes, provide 3-4 different variations of the text.
For button text, provide action-oriented variations.

Make each option distinct and useful. The user will click "Apply" on the one they like best.`;

    const client = getClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return generateFallbackSuggestions(userMessage, templateData);
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      greeting: result.greeting || "Here are some options for you:",
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error('Template AI processing error:', error);
    return generateFallbackSuggestions(userMessage, templateData);
  }
}

function buildTemplateContext(templateData: any, selectedElementPath?: string): string {
  const context: string[] = [];
  
  if (selectedElementPath) {
    const keys = selectedElementPath.split('.');
    let value = templateData;
    for (const key of keys) {
      value = value?.[key];
    }
    context.push(`User is currently looking at: ${selectedElementPath} which says "${value}"`);
  }

  context.push(`Main title on the page: "${templateData.hero?.heading}"`);
  context.push(`Tagline: "${templateData.hero?.subheading}"`);
  context.push(`Button text: "${templateData.hero?.ctaText}"`);
  context.push(`Website colors: "${templateData.styles?.primaryColor}"`);
  context.push(`Phone: "${templateData.contact?.phone}"`);
  context.push(`Email: "${templateData.contact?.email}"`);
  context.push(`Business hours: "${templateData.contact?.hours}"`);
  context.push(`Company name: "${templateData.footer?.companyName}"`);

  return context.join('\n');
}

function generateFallbackSuggestions(
  userMessage: string,
  templateData: any
): SuggestionsResponse {
  const lowerMessage = userMessage.toLowerCase();
  
  // Color changes
  if (lowerMessage.includes('color') || lowerMessage.includes('brand') || lowerMessage.includes('scheme') || lowerMessage.includes('theme')) {
    return {
      greeting: "Here are some color schemes you might like:",
      suggestions: [
        {
          id: '1',
          title: 'OCEAN BLUE',
          description: 'A professional blue gradient that builds trust',
          changes: { 'styles.primaryColor': '#3B82F6', 'styles.secondaryColor': '#2563EB' }
        },
        {
          id: '2',
          title: 'ROYAL PURPLE',
          description: 'An elegant purple theme that stands out',
          changes: { 'styles.primaryColor': '#8B5CF6', 'styles.secondaryColor': '#7C3AED' }
        },
        {
          id: '3',
          title: 'SUNSET ORANGE',
          description: 'A warm, energetic orange gradient',
          changes: { 'styles.primaryColor': '#F97316', 'styles.secondaryColor': '#EA580C' }
        },
        {
          id: '4',
          title: 'FOREST GREEN',
          description: 'A fresh, natural green theme',
          changes: { 'styles.primaryColor': '#22c55e', 'styles.secondaryColor': '#16a34a' }
        }
      ]
    };
  }

  // Button/CTA changes
  if (lowerMessage.includes('button') || lowerMessage.includes('cta') || lowerMessage.includes('action') || lowerMessage.includes('call to action')) {
    return {
      greeting: "Here are some button text options:",
      suggestions: [
        {
          id: '1',
          title: 'GET STARTED BUTTON',
          description: 'Change the button to "Get Started Now"',
          changes: { 'hero.ctaText': 'Get Started Now' }
        },
        {
          id: '2',
          title: 'CONTACT US BUTTON',
          description: 'Change the button to "Contact Us Today"',
          changes: { 'hero.ctaText': 'Contact Us Today' }
        },
        {
          id: '3',
          title: 'LEARN MORE BUTTON',
          description: 'Change the button to "Learn More"',
          changes: { 'hero.ctaText': 'Learn More' }
        },
        {
          id: '4',
          title: 'FREE QUOTE BUTTON',
          description: 'Change the button to "Get Free Quote"',
          changes: { 'hero.ctaText': 'Get Free Quote' }
        }
      ]
    };
  }

  // Title/Heading changes
  if (lowerMessage.includes('title') || lowerMessage.includes('heading') || lowerMessage.includes('hero') || lowerMessage.includes('compelling') || lowerMessage.includes('engaging')) {
    return {
      greeting: "Here are some main title options:",
      suggestions: [
        {
          id: '1',
          title: 'PROFESSIONAL TITLE',
          description: 'Use a trust-building professional headline',
          changes: { 'hero.heading': 'Transform Your Business Today' }
        },
        {
          id: '2',
          title: 'ACTION TITLE',
          description: 'Use an action-oriented headline',
          changes: { 'hero.heading': 'Start Your Journey With Us' }
        },
        {
          id: '3',
          title: 'BENEFIT TITLE',
          description: 'Highlight the key benefit',
          changes: { 'hero.heading': 'Achieve More, Worry Less' }
        },
        {
          id: '4',
          title: 'SIMPLE TITLE',
          description: 'Keep it simple and direct',
          changes: { 'hero.heading': 'Your Success Starts Here' }
        }
      ]
    };
  }

  // Image replacements
  if (lowerMessage.includes('image') || lowerMessage.includes('photo') || lowerMessage.includes('picture') || lowerMessage.includes('placeholder')) {
    return {
      greeting: "Here are some ways to improve your images:",
      suggestions: [
        {
          id: '1',
          title: 'PROFESSIONAL PHOTOS',
          description: 'Use high-quality business photography',
          changes: { 'hero_image': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop' }
        },
        {
          id: '2',
          title: 'TEAM PHOTOS',
          description: 'Showcase your team members',
          changes: { 'hero_image': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop' }
        },
        {
          id: '3',
          title: 'PRODUCT SHOTS',
          description: 'Display your products clearly',
          changes: { 'hero_image': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop' }
        }
      ]
    };
  }

  // Typography/Font changes
  if (lowerMessage.includes('font') || lowerMessage.includes('typography') || lowerMessage.includes('text') || lowerMessage.includes('readable')) {
    return {
      greeting: "Here are some typography improvements:",
      suggestions: [
        {
          id: '1',
          title: 'LARGER HEADINGS',
          description: 'Make titles bigger and more impactful',
          changes: { }
        },
        {
          id: '2',
          title: 'BETTER SPACING',
          description: 'Add more breathing room between sections',
          changes: { 'styles.sectionPadding': '4rem' }
        },
        {
          id: '3',
          title: 'CLEANER LOOK',
          description: 'Simplify fonts for better readability',
          changes: { }
        }
      ]
    };
  }

  // Default fallback
  return {
    greeting: "What would you like to change? Here are some popular options:",
    suggestions: [
      {
        id: '1',
        title: 'CHANGE COLORS',
        description: 'Update your website colors to a fresh new look',
        changes: { 'styles.primaryColor': '#3B82F6', 'styles.secondaryColor': '#2563EB' }
      },
      {
        id: '2',
        title: 'UPDATE MAIN TITLE',
        description: 'Change the main headline on your page',
        changes: { 'hero.heading': 'Transform Your Business Today' }
      },
      {
        id: '3',
        title: 'IMPROVE BUTTON TEXT',
        description: 'Make your button more action-oriented',
        changes: { 'hero.ctaText': 'Get Started Now', 'cta.ctaText': 'Contact Us Today' }
      }
    ]
  };
}

export async function processTemplateEditRequest(
  userMessage: string,
  templateData: any,
  selectedElementPath?: string
): Promise<{ changes: Record<string, any>; explanation: string; reasoning?: string }> {
  try {
    const currentValues = buildTemplateContext(templateData, selectedElementPath);
    
    const systemPrompt = `You are a friendly website helper that makes editing websites super easy. You speak in simple, everyday language - NO technical jargon.

Available things you can change on the website:
${fieldsList}

Current website info:
${currentValues}

Your job is to:
1. Understand what the user wants in plain English
2. Make the changes they're asking for
3. Explain what you did in simple words anyone can understand

IMPORTANT LANGUAGE RULES:
- NEVER use words like: hero, CTA, heading, subheading, padding, spacing, section, element, field, primary color
- Instead use: main title, button, description, the space between things, the look, colors
- Be conversational and warm like you're helping a friend
- When asking for more info, give simple examples or options

IMPORTANT: Always respond with a JSON object in this exact format:
{
  "changes": {
    "field.path": "new value",
    "another.field": "another value"
  },
  "explanation": "A simple, friendly explanation anyone can understand",
  "reasoning": "Brief note about what was interpreted"
}

If you cannot make specific changes, return an empty changes object.
If the user's request is unclear, ask a simple question like:
- "Got it! Would you like me to change the main title, the colors, or something else?"
- "Sure thing! What words would you like me to use instead?"
- "Happy to help! Do you want to update the phone number, business hours, or address?"

NEVER ask users to mention "specific elements" or use any technical terms.`;

    const client = getClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        changes: {},
        explanation: responseText || "I'd love to help! Could you tell me a bit more about what you'd like to change? For example, you could say 'change the phone number to...' or 'make the colors blue'.",
        reasoning: "No JSON response found"
      };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      changes: result.changes || {},
      explanation: result.explanation || "Changes processed",
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('Template AI processing error:', error);
    
    return processSimpleTemplateRequest(userMessage, templateData, selectedElementPath);
  }
}

function processSimpleTemplateRequest(
  userMessage: string,
  templateData: any,
  selectedElementPath?: string
): { changes: Record<string, any>; explanation: string } {
  const changes: Record<string, any> = {};
  const lowerMessage = userMessage.toLowerCase();

  if (selectedElementPath && userMessage.trim()) {
    changes[selectedElementPath] = userMessage.trim();
    return {
      changes,
      explanation: `Updated field to: "${userMessage}"`
    };
  }

  if (lowerMessage.includes('blue') || (lowerMessage.includes('color') && lowerMessage.includes('blue'))) {
    changes['styles.primaryColor'] = '#3B82F6';
    changes['styles.secondaryColor'] = '#2563EB';
  } else if (lowerMessage.includes('red')) {
    changes['styles.primaryColor'] = '#EF4444';
    changes['styles.secondaryColor'] = '#DC2626';
  } else if (lowerMessage.includes('purple')) {
    changes['styles.primaryColor'] = '#8B5CF6';
    changes['styles.secondaryColor'] = '#7C3AED';
  } else if (lowerMessage.includes('orange') || lowerMessage.includes('warm')) {
    changes['styles.primaryColor'] = '#F97316';
    changes['styles.secondaryColor'] = '#EA580C';
  } else if (lowerMessage.includes('green')) {
    changes['styles.primaryColor'] = '#22c55e';
    changes['styles.secondaryColor'] = '#16a34a';
  }

  if (lowerMessage.includes('spacing') || lowerMessage.includes('padding')) {
    if (lowerMessage.includes('tight') || lowerMessage.includes('compact') || lowerMessage.includes('reduce') || lowerMessage.includes('less')) {
      changes['styles.spacing'] = 'compact';
      changes['styles.sectionPadding'] = '2rem';
      changes['styles.cardPadding'] = '0.75rem';
    } else if (lowerMessage.includes('spacious') || lowerMessage.includes('more')) {
      changes['styles.spacing'] = 'spacious';
      changes['styles.sectionPadding'] = '5rem';
      changes['styles.cardPadding'] = '2rem';
    }
  }

  if (lowerMessage.includes('heading') && (lowerMessage.includes('update') || lowerMessage.includes('change'))) {
    if (lowerMessage.includes('hero') || lowerMessage.includes('main')) {
      changes['hero.heading'] = 'Transform Your Space Today';
    }
  }

  if (lowerMessage.includes('cta') || (lowerMessage.includes('button') && lowerMessage.includes('call'))) {
    changes['hero.ctaText'] = 'Get Started Now';
    changes['cta.ctaText'] = 'Contact Us Today';
  }

  if (Object.keys(changes).length === 0) {
    return {
      changes: {},
      explanation: "Got it! What would you like me to change? I can update things like:\n\n• The main title or descriptions\n• Your phone number or business hours\n• The colors on your website\n• The text on your buttons\n\nJust let me know what you'd like!"
    };
  }

  const changedFields = Object.keys(changes)
    .map(path => templateFields[path] || path)
    .join(', ');

  return {
    changes,
    explanation: `Updated ${changedFields}. Let me know if you'd like to refine anything!`
  };
}
