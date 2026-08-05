import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import type { Budget, Category } from '../../types/expense';

export class BudgetRepository {
  public static async fetchAll(): Promise<Budget[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase.from('budgets').select('*');
      if (error) throw error;
      if (!data) return [];

      return data.map((item) => ({
        category: item.category as Category,
        allocatedAmount: item.allocated_amount || item.allocatedAmount,
        period: 'monthly',
      }));
    } catch (err) {
      console.error('[BudgetRepo] fetchAll error:', err);
      return null;
    }
  }

  public static async upsert(budget: Budget): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      const { error } = await supabase.from('budgets').upsert([
        {
          category: budget.category,
          allocated_amount: budget.allocatedAmount,
          period: budget.period || 'monthly',
        },
      ]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[BudgetRepo] upsert error:', err);
      return false;
    }
  }
}
