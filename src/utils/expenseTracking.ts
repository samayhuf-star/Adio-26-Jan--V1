/**
 * Real-time Expense Tracking
 * Fetches actual usage data from third-party services
 */

export interface ServiceExpense {
  name: string;
  icon: string;
  description: string;
  monthlyBudget: number;
  currentSpend: number;
  status: 'active' | 'free_tier' | 'inactive' | 'no_key' | 'error' | 'not_configured';
  lastBilled: string;
  currency?: string;
  isManual?: boolean;
  apiConnected?: boolean;
}

// OpenAI Expense Tracking
export async function fetchOpenAIExpenses(): Promise<Partial<ServiceExpense>> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) return { currentSpend: 0, status: 'inactive' };

    const response = await fetch('https://api.openai.com/dashboard/billing/usage', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        currentSpend: (data.total_usage || 0) / 100,
        lastBilled: new Date().toISOString().split('T')[0]
      };
    }
  } catch (error) {
    console.error('Failed to fetch OpenAI expenses:', error);
  }
  return { currentSpend: 0, status: 'inactive' };
}

// Stripe Expense Tracking
// NOTE: This should use a server-side endpoint to avoid exposing secret keys
// The secret key should NEVER be exposed to client-side code
export async function fetchStripeExpenses(): Promise<Partial<ServiceExpense>> {
  try {
    // Use server-side endpoint instead of direct Stripe API calls
    // This prevents exposing secret keys to the client
    const response = await fetch('/api/stripe/expenses', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        currentSpend: data.currentSpend || 0,
        lastBilled: data.lastBilled || new Date().toISOString().split('T')[0],
        status: data.status || 'active'
      };
    }
  } catch (error) {
    console.error('Failed to fetch Stripe expenses:', error);
  }
  return { currentSpend: 0, status: 'inactive' };
}

// Supabase Expense Tracking
export async function fetchSupabaseExpenses(): Promise<Partial<ServiceExpense>> {
  try {
    const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!projectRef || !apiKey) return { currentSpend: 0, status: 'inactive' };

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/usage`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        currentSpend: data.monthly_active_users?.estimated_cost || 49.00,
        lastBilled: new Date().toISOString().split('T')[0]
      };
    }
  } catch (error) {
    console.error('Failed to fetch Supabase expenses:', error);
  }
  return { currentSpend: 0, status: 'inactive' };
}

// Vercel Expense Tracking
export async function fetchVercelExpenses(): Promise<Partial<ServiceExpense>> {
  try {
    const token = import.meta.env.VITE_VERCEL_TOKEN;
    if (!token) return { currentSpend: 0, status: 'inactive' };

    const response = await fetch('https://api.vercel.com/v3/billing/usage', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        currentSpend: data.total || 20.00,
        lastBilled: new Date().toISOString().split('T')[0]
      };
    }
  } catch (error) {
    console.error('Failed to fetch Vercel expenses:', error);
  }
  return { currentSpend: 0, status: 'inactive' };
}



// GitHub Expenses (monthly)
export async function fetchGitHubExpenses(): Promise<Partial<ServiceExpense>> {
  try {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (!token) return { currentSpend: 0, status: 'inactive' };

    const response = await fetch('https://api.github.com/user/billing/actions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      const monthlyUsage = (data.total_minutes_used || 0) * 0.008; // $0.008 per minute for public repos
      
      return {
        currentSpend: monthlyUsage,
        lastBilled: new Date().toISOString().split('T')[0],
        status: monthlyUsage > 0 ? 'active' : 'free_tier'
      };
    }
  } catch (error) {
    console.error('Failed to fetch GitHub expenses:', error);
  }
  return { currentSpend: 0, status: 'inactive' };
}

// Fetch all expenses from secure backend API
export async function fetchAllExpenses(): Promise<ServiceExpense[]> {
  try {
    // Use backend API to fetch billing data securely
    const response = await fetch('/api/admin/services-billing');
    if (response.ok) {
      const services = await response.json();
      console.log('📊 Fetched billing data from backend:', services.length, 'services');
      return services.map((s: any) => ({
        name: s.name,
        icon: getServiceIcon(s.name),
        description: s.description,
        monthlyBudget: s.monthlyBudget,
        currentSpend: s.currentSpend || 0,
        status: s.status || 'inactive',
        lastBilled: s.lastBilled || 'N/A',
        isManual: s.isManual ?? true,
        apiConnected: s.apiConnected ?? false
      }));
    }
  } catch (error) {
    console.error('Error fetching billing from backend:', error);
  }

  // Fallback to client-side fetching if backend fails
  const [openai, stripe, supabase, vercel, github] = await Promise.allSettled([
    fetchOpenAIExpenses(),
    fetchStripeExpenses(),
    fetchSupabaseExpenses(),
    fetchVercelExpenses(),
    fetchGitHubExpenses()
  ]);

  return [
    {
      name: 'OpenAI',
      icon: '🤖',
      description: 'AI & GPT API',
      monthlyBudget: 500,
      currentSpend: (openai.status === 'fulfilled' ? openai.value.currentSpend : 0) || 0,
      status: (openai.status === 'fulfilled' ? openai.value.status : 'inactive') || 'inactive',
      lastBilled: (openai.status === 'fulfilled' ? openai.value.lastBilled : new Date().toISOString().split('T')[0]) || new Date().toISOString().split('T')[0]
    },
    {
      name: 'Supabase',
      icon: '⚡',
      description: 'Database & Auth',
      monthlyBudget: 75,
      currentSpend: (supabase.status === 'fulfilled' ? supabase.value.currentSpend : 0) || 0,
      status: (supabase.status === 'fulfilled' ? supabase.value.status : 'inactive') || 'inactive',
      lastBilled: (supabase.status === 'fulfilled' ? supabase.value.lastBilled : new Date().toISOString().split('T')[0]) || new Date().toISOString().split('T')[0]
    },
    {
      name: 'Stripe',
      icon: '💳',
      description: 'Payment Processing',
      monthlyBudget: 200,
      currentSpend: (stripe.status === 'fulfilled' ? stripe.value.currentSpend : 0) || 0,
      status: (stripe.status === 'fulfilled' ? stripe.value.status : 'inactive') || 'inactive',
      lastBilled: (stripe.status === 'fulfilled' ? stripe.value.lastBilled : new Date().toISOString().split('T')[0]) || new Date().toISOString().split('T')[0]
    },
    {
      name: 'Vercel',
      icon: '▲',
      description: 'Hosting & Deployments',
      monthlyBudget: 50,
      currentSpend: (vercel.status === 'fulfilled' ? vercel.value.currentSpend : 0) || 0,
      status: (vercel.status === 'fulfilled' ? vercel.value.status : 'inactive') || 'inactive',
      lastBilled: (vercel.status === 'fulfilled' ? vercel.value.lastBilled : new Date().toISOString().split('T')[0]) || new Date().toISOString().split('T')[0]
    },
    {
      name: 'GitHub',
      icon: '🐙',
      description: 'CI/CD & Actions',
      monthlyBudget: 50,
      currentSpend: (github.status === 'fulfilled' ? github.value.currentSpend : 0) || 0,
      status: (github.status === 'fulfilled' ? github.value.status : 'inactive') || 'inactive',
      lastBilled: (github.status === 'fulfilled' ? github.value.lastBilled : new Date().toISOString().split('T')[0]) || new Date().toISOString().split('T')[0]
    }
  ];
}

// Helper to get service icons
function getServiceIcon(name: string): string {
  const icons: Record<string, string> = {
    'OpenAI': '🤖',
    'Supabase': '⚡',
    'Stripe': '💳',
    'Vercel': '▲',
    'GitHub': '🐙'
  };
  return icons[name] || '📦';
}
