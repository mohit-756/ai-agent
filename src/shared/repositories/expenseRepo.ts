import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import type { Expense } from '../../types/expense';

export class ExpenseRepository {
  public static async fetchAll(): Promise<Expense[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((item) => ({
        id: item.id.toString(),
        amount: item.amount,
        category: item.category,
        description: item.description,
        merchant: item.merchant,
        paymentMethod: item.paymentmethod || item.paymentMethod || 'UPI',
        date: item.date,
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        notes: item.notes,
        source: item.source || 'manual',
      }));
    } catch (err) {
      console.error('[ExpenseRepo] fetchAll error:', err);
      return null;
    }
  }

  public static async insert(expense: Expense, idempotencyKey?: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      const payload: Record<string, any> = {
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        merchant: expense.merchant,
        paymentmethod: expense.paymentMethod,
        date: expense.date,
        notes: expense.notes,
        source: expense.source || 'manual',
      };

      if (idempotencyKey) {
        payload.idempotency_key = idempotencyKey;
      }

      const { error } = await supabase.from('expenses').insert([payload]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[ExpenseRepo] insert error:', err);
      return false;
    }
  }

  public static async update(id: string, updates: Partial<Expense>): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase || id.startsWith('exp-')) return false;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: updates.amount,
          category: updates.category,
          description: updates.description,
          merchant: updates.merchant,
          paymentmethod: updates.paymentMethod,
          date: updates.date,
          notes: updates.notes,
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[ExpenseRepo] update error:', err);
      return false;
    }
  }

  public static async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase || id.startsWith('exp-')) return false;

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[ExpenseRepo] delete error:', err);
      return false;
    }
  }
}
