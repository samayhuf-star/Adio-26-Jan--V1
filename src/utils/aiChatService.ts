// AI Chat Service - Handles AI model interactions and knowledge base queries

interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  url?: string;
  lastUpdated: string;
}

interface ChatContext {
  currentPage?: string;
  userAgent?: string;
  timestamp?: string;
  userId?: string;
  userEmail?: string;
}

interface AIResponse {
  content: string;
  confidence: number;
  sources?: string[];
  suggestions?: string[];
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
}

class AIChatService {
  private knowledgeBase: KnowledgeBaseEntry[] = [];
  private apiKey: string;
  private model: string = 'gpt-3.5-turbo'; // Fast and cost-effective

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Platform-specific knowledge base
    this.knowledgeBase = [
      {
        id: 'campaign-creation',
        title: 'How to Create a Campaign',
        content: `To create a campaign in Adiology:
        1. Navigate to the Campaigns section
        2. Click "Create New Campaign" or use the 1-Click Builder
        3. Choose your campaign type (Search, Display, etc.)
        4. Set your target audience and keywords
        5. Configure budget and bidding
        6. Review and launch your campaign
        
        The 1-Click Builder can create campaigns automatically based on your business goals.`,
        category: 'campaigns',
        tags: ['campaign', 'create', 'builder', 'setup'],
        url: '#campaign-builder',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'keyword-research',
        title: 'Keyword Research and Planning',
        content: `Adiology's Keyword Planner helps you:
        - Discover new keyword opportunities
        - Analyze search volume and competition
        - Get keyword suggestions based on your business
        - Create negative keyword lists
        - Mix and match keywords for better targeting
        
        Access it from the Keywords menu > Planner.`,
        category: 'keywords',
        tags: ['keywords', 'research', 'planner', 'seo'],
        url: '#keyword-planner',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'billing-plans',
        title: 'Billing and Subscription Plans',
        content: `Adiology offers flexible pricing plans:
        - Free Trial: 7 days with full access
        - Basic: $69.99/month for solo marketers (25 campaigns/month)
        - Pro: $129.99/month for growing teams (unlimited campaigns)
        - Lifetime: $49.99 one-time for unlimited access forever
        
        All plans include campaign management, keyword tools, and analytics.
        You can upgrade, downgrade, or cancel anytime from Settings > Billing.`,
        category: 'billing',
        tags: ['billing', 'pricing', 'plans', 'subscription'],
        url: '#billing',
        lastUpdated: new Date().toISOString()
      },

      {
        id: 'forms-builder',
        title: 'Forms and Lead Capture',
        content: `Build custom forms to capture leads:
        - Drag-and-drop form builder
        - Multiple field types (text, email, phone, etc.)
        - Conditional logic and validation
        - Integration with CRM systems
        - Real-time analytics and submissions
        
        Create forms from the Forms menu.`,
        category: 'forms',
        tags: ['forms', 'leads', 'capture', 'builder'],
        url: '#forms',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'analytics-reporting',
        title: 'Analytics and Reporting',
        content: `Track your marketing performance:
        - Real-time campaign metrics
        - Conversion tracking
        - ROI analysis
        - Custom reports and dashboards
        - Export data to CSV/Excel
        
        View analytics from the Dashboard or individual campaign pages.`,
        category: 'analytics',
        tags: ['analytics', 'reporting', 'metrics', 'roi'],
        url: '#dashboard',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'team-collaboration',
        title: 'Team Management and Collaboration',
        content: `Collaborate with your team:
        - Invite team members with different roles
        - Set permissions and access levels
        - Share campaigns and projects
        - Comment and review system
        - Activity tracking
        
        Manage your team from the Teams section.`,
        category: 'teams',
        tags: ['team', 'collaboration', 'permissions', 'sharing'],
        url: '#teams',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'api-integrations',
        title: 'API and Integrations',
        content: `Connect Adiology with your existing tools:
        - Google Ads integration
        - Facebook Ads connection
        - CRM integrations (Salesforce, HubSpot)
        - Analytics platforms (Google Analytics)
        - Webhook support for custom integrations
        
        Configure integrations in Settings > Integrations.`,
        category: 'integrations',
        tags: ['api', 'integrations', 'google ads', 'facebook'],
        url: '#settings',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'troubleshooting',
        title: 'Common Issues and Troubleshooting',
        content: `Common solutions:
        - Campaign not showing: Check budget and targeting settings
        - Low impressions: Expand keywords or increase bids
        - High CPC: Add negative keywords or adjust targeting
        - Tracking issues: Verify conversion tracking setup
        - Login problems: Clear browser cache or reset password
        
        For technical issues, contact support@adiology.io`,
        category: 'support',
        tags: ['troubleshooting', 'issues', 'problems', 'help'],
        url: '#support-help',
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  async generateResponse(message: string, context: ChatContext): Promise<AIResponse> {
    try {
      // Search knowledge base for relevant information
      const relevantEntries = this.searchKnowledgeBase(message);
      
      // Build context for AI
      const systemPrompt = this.buildSystemPrompt(relevantEntries, context);
      
      // Call AI model
      const aiResponse = await this.callAIModel(systemPrompt, message);
      
      // Generate suggestions and actions
      const suggestions = this.generateSuggestions(message, relevantEntries);
      const actions = this.generateActions(message, relevantEntries);
      
      return {
        content: aiResponse.content,
        confidence: aiResponse.confidence,
        sources: relevantEntries.map(entry => entry.title),
        suggestions,
        actions
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  private searchKnowledgeBase(query: string): KnowledgeBaseEntry[] {
    const queryLower = query.toLowerCase();
    const results: Array<{ entry: KnowledgeBaseEntry; score: number }> = [];

    for (const entry of this.knowledgeBase) {
      let score = 0;
      
      // Title match (highest weight)
      if (entry.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Content match
      const contentMatches = (entry.content.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
      score += contentMatches * 2;
      
      // Tag matches
      for (const tag of entry.tags) {
        if (queryLower.includes(tag) || tag.includes(queryLower)) {
          score += 5;
        }
      }
      
      // Category match
      if (queryLower.includes(entry.category)) {
        score += 3;
      }
      
      if (score > 0) {
        results.push({ entry, score });
      }
    }
    
    // Sort by relevance and return top 3
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(result => result.entry);
  }

  private buildSystemPrompt(relevantEntries: KnowledgeBaseEntry[], context: ChatContext): string {
    const knowledgeContext = relevantEntries.length > 0 
      ? `Relevant information from Adiology knowledge base:\n${relevantEntries.map(entry => 
          `- ${entry.title}: ${entry.content}`
        ).join('\n')}\n\n`
      : '';

    const userContext = context.currentPage 
      ? `User is currently on page: ${context.currentPage}\n`
      : '';

    return `You are an AI assistant for Adiology, a marketing automation platform. You help users with:
- Campaign creation and management
- Keyword research and planning
- Analytics and reporting
- Platform navigation and features
- Billing and account questions
- Technical support

${knowledgeContext}${userContext}

Guidelines:
- Be helpful, friendly, and professional
- Provide specific, actionable advice
- Reference Adiology features and capabilities
- If you don't know something, admit it and suggest contacting support
- Keep responses concise but comprehensive
- Suggest relevant actions the user can take
- Use the knowledge base information when relevant

Respond in a conversational tone as if you're a knowledgeable support agent.`;
  }

  private async callAIModel(systemPrompt: string, userMessage: string): Promise<{ content: string; confidence: number }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || 'I apologize, but I\'m having trouble generating a response right now.',
        confidence: 0.8 // Could be calculated based on various factors
      };
    } catch (error) {
      console.error('Error calling AI model:', error);
      
      // Fallback response
      return {
        content: 'I\'m sorry, I\'m having trouble connecting to my AI service right now. Please try again in a moment, or contact our support team at support@adiology.io for immediate assistance.',
        confidence: 0.1
      };
    }
  }

  private generateSuggestions(message: string, relevantEntries: KnowledgeBaseEntry[]): string[] {
    const suggestions: string[] = [];
    const messageLower = message.toLowerCase();

    // Context-based suggestions
    if (messageLower.includes('campaign')) {
      suggestions.push('How do I create a campaign?', 'Campaign optimization tips', 'Budget management help');
    }
    
    if (messageLower.includes('keyword')) {
      suggestions.push('Keyword research tools', 'Negative keywords setup', 'Keyword bidding strategies');
    }
    
    if (messageLower.includes('billing') || messageLower.includes('price')) {
      suggestions.push('View pricing plans', 'Upgrade my account', 'Billing questions');
    }
    
    if (messageLower.includes('help') || messageLower.includes('support')) {
      suggestions.push('Contact human support', 'Common troubleshooting', 'Platform tutorial');
    }

    // Add suggestions from relevant entries
    for (const entry of relevantEntries) {
      if (entry.category === 'campaigns') {
        suggestions.push('Show me campaign examples');
      } else if (entry.category === 'keywords') {
        suggestions.push('Keyword planning guide');
      }
    }

    return [...new Set(suggestions)].slice(0, 4); // Remove duplicates and limit to 4
  }

  private generateActions(message: string, relevantEntries: KnowledgeBaseEntry[]): Array<{ label: string; action: string; url?: string }> {
    const actions: Array<{ label: string; action: string; url?: string }> = [];
    const messageLower = message.toLowerCase();

    // Add actions based on relevant entries
    for (const entry of relevantEntries) {
      if (entry.url) {
        actions.push({
          label: `Go to ${entry.title}`,
          action: entry.category,
          url: entry.url
        });
      }
    }

    // Context-based actions
    if (messageLower.includes('campaign')) {
      actions.push({
        label: 'Create New Campaign',
        action: 'create_campaign',
        url: '#campaign-builder'
      });
    }
    
    if (messageLower.includes('keyword')) {
      actions.push({
        label: 'Open Keyword Planner',
        action: 'keyword_planner',
        url: '#keyword-planner'
      });
    }
    
    if (messageLower.includes('billing')) {
      actions.push({
        label: 'View Billing Settings',
        action: 'billing',
        url: '#billing'
      });
    }

    // Always offer support escalation
    if (messageLower.includes('help') || messageLower.includes('support') || messageLower.includes('problem')) {
      actions.push({
        label: 'Contact Support Team',
        action: 'support',
        url: 'mailto:support@adiology.io'
      });
    }

    return [...new Set(actions.map(a => JSON.stringify(a)))].map(a => JSON.parse(a)).slice(0, 3); // Remove duplicates and limit
  }

  // Method to update knowledge base (for admin use)
  updateKnowledgeBase(entries: KnowledgeBaseEntry[]) {
    this.knowledgeBase = entries;
  }

  // Method to add new knowledge base entry
  addKnowledgeEntry(entry: KnowledgeBaseEntry) {
    this.knowledgeBase.push(entry);
  }
}

export const aiChatService = new AIChatService();