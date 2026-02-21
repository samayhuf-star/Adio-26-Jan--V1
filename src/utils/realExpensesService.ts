import { getSessionTokenSync } from './auth';

export interface RealExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'pending' | 'sent' | 'failed' | 'paid';
  category: string;
  source: string;
  lastFourDigits?: string;
  currency: string;
}

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

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getSessionTokenSync();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, { ...options, headers });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function calculateRealExpenses(): Promise<RealExpense[]> {
  const expenses: RealExpense[] = [];
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  try {
    try {
      const data = await apiRequest(`/api/expenses/payments?startDate=${startOfMonth.toISOString()}`);

      if (data?.payments && data.payments.length > 0) {
        data.payments.forEach((p: any) => {
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

    try {
      const data = await apiRequest(`/api/expenses/subscriptions?startDate=${startOfMonth.toISOString()}`);

      if (data?.subscriptions && data.subscriptions.length > 0) {
        data.subscriptions.forEach((s: any) => {
          expenses.push({
            id: `sub-${s.id}`,
            date: new Date(s.created_at || today).toLocaleDateString(),
            description: 'Database Service',
            amount: Math.abs(parseFloat(s.amount || 49)),
            status: 'paid',
            category: 'infrastructure',
            source: 'database',
            currency: 'USD',
          });
        });
      }
    } catch (e) {
      console.warn('Error fetching subscription expenses:', e);
    }

  } catch (error) {
    console.error('Error calculating real expenses:', error);
  }

  return expenses;
}

export async function loadRealExpenses(): Promise<RealExpense[]> {
  const cached = localStorage.getItem('admin_expenses_cache');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.warn('Error parsing cached expenses');
    }
  }

  try {
    const csvResponse = await fetch('/attached_assets/transactions-googlinks-llc-to-dec082025_(2)_1765359984828.csv');
    if (csvResponse.ok) {
      const csvText = await csvResponse.text();
      const expenses = parseMercuryCSV(csvText);
      if (expenses.length > 0) {
        localStorage.setItem('admin_expenses_cache', JSON.stringify(expenses));
        console.log(`📄 Loaded ${expenses.length} expenses from Mercury CSV`);
        return expenses;
      }
    }
  } catch (e) {
    console.warn('Error loading Mercury CSV:', e);
  }

  try {
    const data = await apiRequest('/api/expenses');

    if (data?.expenses && data.expenses.length > 0) {
      const expenses = data.expenses.map((e: any) => ({
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
      console.log(`📊 Loaded ${expenses.length} expenses from API`);
      return expenses;
    }
  } catch (e) {
    console.warn('Expenses API not available');
  }

  const apiExpenses = await calculateRealExpenses();
  if (apiExpenses.length > 0) {
    localStorage.setItem('admin_expenses_cache', JSON.stringify(apiExpenses));
  }
  return apiExpenses;
}

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

    await apiRequest('/api/expenses/upload', {
      method: 'POST',
      body: JSON.stringify({ expenses: formattedExpenses }),
    });

    console.log(`✅ Uploaded ${expenses.length} expenses`);
    return true;
  } catch (error) {
    console.error('Error uploading expenses:', error);
    return false;
  }
}
