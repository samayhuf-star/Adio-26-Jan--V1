import { supabase } from './supabase/client';

export interface RealExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'pending' | 'sent' | 'failed' | 'paid';
  category: string;
  source: string; // API source: stripe, openai, vercel, github, supabase, etc.
  lastFourDigits?: string;
  currency: string;
}

// Parse Mercury CSV format transactions
export function parseMercuryCSV(csvText: string): RealExpense[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const dateIdx = headers.findIndex(h => h.includes('Date'));
  const descIdx = headers.findIndex(h => h.includes('Description'));
  const amountIdx = headers.findIndex(h => h.includes('Amount'));
  const statusIdx = headers.findIndex(h => h.includes('Status'));
  const categoryIdx = headers.findIndex(h => h.includes('Mercury Category'));
  const currencyIdx = headers.findIndex(h => h.includes('Original Currency'));
  const lastFourIdx = headers.findIndex(h => h.includes('Last Four Digits'));

  const expenses: RealExpense[] = [];
  const serviceMap: Record<string, string> = {
    'OPENAI': 'openai',
    'STRIPE': 'stripe',
    'VERCEL': 'vercel',
    'GITHUB': 'github',
    'SUPABASE': 'supabase',
    'ANTHROPIC': 'anthropic',
    'TWILIO': 'twilio',
    'SENDGRID': 'sendgrid',
    'DIGITALOCEAN': 'digitalocean',
    'FLY.IO': 'fly',
    'FIGMA': 'figma',
    'CURSOR': 'cursor',
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length < 3) continue;

    const description = parts[descIdx]?.trim() || '';
    const amountStr = parts[amountIdx]?.trim() || '0';
    const amount = Math.abs(parseFloat(amountStr));

    if (amount === 0) continue;

    const status = parts[statusIdx]?.trim().toLowerCase() || 'pending';
    const date = parts[dateIdx]?.trim() || '';
    const category = parts[categoryIdx]?.trim() || 'Software';
    const currency = parts[currencyIdx]?.trim() || 'USD';
    const lastFour = parts[lastFourIdx]?.trim() || '';

    // Determine source/service
    let source = 'other';
    for (const [key, value] of Object.entries(serviceMap)) {
      if (description.toUpperCase().includes(key) || (parts[5] && parts[5].toUpperCase().includes(key))) {
        source = value;
        break;
      }
    }

    const expense: RealExpense = {
      id: `${date}-${description}-${amount}`,
      date,
      description,
      amount,
      status: status as any,
      category,
      source,
      lastFourDigits: lastFour,
      currency,
    };

    expenses.push(expense);
  }

  return expenses;
}

// Calculate real expenses from active APIs
export async function calculateRealExpenses(): Promise<RealExpense[]> {
  const expenses: RealExpense[] = [];
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  try {
    // Get Stripe expenses
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (payments && payments.length > 0) {
        payments.forEach((p: any) => {
          expenses.push({
            id: `stripe-${p.id}`,
            date: new Date(p.created_at).toLocaleDateString(),
            description: `Stripe Payment - ${p.type || 'Charge'}`,
            amount: Math.abs(parseFloat(p.amount || 0)),
            status: 'paid',
            category: 'payments',
            source: 'stripe',
            currency: 'USD',
          });
        });
      }
    } catch (e) {
      console.warn('Error fetching Stripe expenses:', e);
    }

    // Get Supabase expenses (from database)
    try {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .gte('created_at', startOfMonth.toISOString());

      if (subs && subs.length > 0) {
        subs.forEach((s: any) => {
          expenses.push({
            id: `supabase-${s.id}`,
            date: new Date(s.created_at || today).toLocaleDateString(),
            description: 'Supabase Database Service',
            amount: Math.abs(parseFloat(s.amount || 49)),
            status: 'paid',
            category: 'infrastructure',
            source: 'supabase',
            currency: 'USD',
          });
        });
      }
    } catch (e) {
      console.warn('Error fetching Supabase expenses:', e);
    }

  } catch (error) {
    console.error('Error calculating real expenses:', error);
  }

  return expenses;
}

// Load expenses from CSV file, Supabase, or APIs
export async function loadRealExpenses(): Promise<RealExpense[]> {
  // Try to load from localStorage cache first
  const cached = localStorage.getItem('admin_expenses_cache');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.warn('Error parsing cached expenses');
    }
  }

  try {
    // Try to load Mercury CSV file
    const csvResponse = await fetch('/attached_assets/transactions-googlinks-llc-to-dec082025_(2)_1765359984828.csv');
    if (csvResponse.ok) {
      const csvText = await csvResponse.text();
      const expenses = parseMercuryCSV(csvText);
      if (expenses.length > 0) {
        // Cache to localStorage
        localStorage.setItem('admin_expenses_cache', JSON.stringify(expenses));
        console.log(`📄 Loaded ${expenses.length} expenses from Mercury CSV`);
        return expenses;
      }
    }
  } catch (e) {
    console.warn('Error loading Mercury CSV:', e);
  }

  try {
    // Try to load from expenses table
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      const expenses = data.map((e: any) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        amount: Math.abs(parseFloat(e.amount || 0)),
        status: e.status || 'paid',
        category: e.category || 'software',
        source: e.source || 'other',
        currency: e.currency || 'USD',
      }));
      localStorage.setItem('admin_expenses_cache', JSON.stringify(expenses));
      console.log(`📊 Loaded ${expenses.length} expenses from Supabase`);
      return expenses;
    }
  } catch (e) {
    console.warn('Expenses table not available');
  }

  // Fallback to calculating from APIs
  const apiExpenses = await calculateRealExpenses();
  if (apiExpenses.length > 0) {
    localStorage.setItem('admin_expenses_cache', JSON.stringify(apiExpenses));
  }
  return apiExpenses;
}

// Upload CSV expenses to Supabase
export async function uploadCSVExpenses(expenses: RealExpense[]): Promise<boolean> {
  try {
    const formattedExpenses = expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      status: e.status,
      category: e.category,
      source: e.source,
      currency: e.currency,
      metadata: {
        lastFourDigits: e.lastFourDigits,
      }
    }));

    const { error } = await supabase
      .from('expenses')
      .upsert(formattedExpenses, { onConflict: 'id' });

    if (error) {
      console.error('Error uploading expenses:', error);
      return false;
    }

    console.log(`✅ Uploaded ${expenses.length} expenses to Supabase`);
    return true;
  } catch (error) {
    console.error('Error uploading expenses:', error);
    return false;
  }
}
