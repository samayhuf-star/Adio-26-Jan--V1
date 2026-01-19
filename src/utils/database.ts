import { supabase } from './supabase/client';

const API_BASE = '/api';

interface DbResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function fetchFromDatabase<T>(table: string): Promise<DbResult<T[]>> {
  try {
    const response = await fetch(`${API_BASE}/db/${table}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${table}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return { success: false, error: String(error) };
  }
}

export async function insertToDatabase<T>(table: string, record: Partial<T>): Promise<DbResult<T>> {
  try {
    const response = await fetch(`${API_BASE}/db/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      throw new Error(`Failed to insert into ${table}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { success: false, error: String(error) };
  }
}

export async function updateInDatabase<T>(table: string, id: string, updates: Partial<T>): Promise<DbResult<T>> {
  try {
    const response = await fetch(`${API_BASE}/db/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ${table}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return { success: false, error: String(error) };
  }
}

export async function deleteFromDatabase(table: string, id: string): Promise<DbResult<boolean>> {
  try {
    const response = await fetch(`${API_BASE}/db/${table}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete from ${table}`);
    }
    return { success: true, data: true };
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return { success: false, error: String(error) };
  }
}

export async function loadAdminUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

export async function loadAdminTemplates() {
  try {
    const response = await fetch(`${API_BASE}/admin/templates`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return await response.json();
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

export async function loadAdminDeployments() {
  try {
    const response = await fetch(`${API_BASE}/admin/deployments`);
    if (!response.ok) throw new Error('Failed to fetch deployments');
    return await response.json();
  } catch (error) {
    console.error('Error loading deployments:', error);
    return [];
  }
}

export async function loadAdminWebsites() {
  try {
    const response = await fetch(`${API_BASE}/admin/websites`);
    if (!response.ok) throw new Error('Failed to fetch websites');
    return await response.json();
  } catch (error) {
    console.error('Error loading websites:', error);
    return [];
  }
}

export async function loadSupportTickets() {
  try {
    const response = await fetch(`${API_BASE}/admin/tickets`);
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return await response.json();
  } catch (error) {
    console.error('Error loading tickets:', error);
    return [];
  }
}

export async function loadCampaignStructures() {
  try {
    const response = await fetch(`${API_BASE}/admin/structures`);
    if (!response.ok) throw new Error('Failed to fetch structures');
    return await response.json();
  } catch (error) {
    console.error('Error loading structures:', error);
    return [];
  }
}

export async function loadAdminExpenses() {
  try {
    const response = await fetch(`${API_BASE}/admin/expenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return await response.json();
  } catch (error) {
    console.error('Error loading expenses:', error);
    return [];
  }
}
