import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import type { PeerRecord } from '../../types/peer';

export class PeerRepository {
  public static async fetchAll(): Promise<PeerRecord[] | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase.from('peer_records').select('*');
      if (error) throw error;
      if (!data) return [];

      return data.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        amount: item.amount,
        originalAmount: item.original_amount || item.originalAmount || item.amount,
        type: item.type,
        description: item.description,
        date: item.date,
        dueDate: item.due_date || item.dueDate,
        status: item.status || 'pending',
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        payments: item.payments || [],
      }));
    } catch (err) {
      console.error('[PeerRepo] fetchAll error:', err);
      return null;
    }
  }

  public static async insert(record: PeerRecord): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      const { error } = await supabase.from('peer_records').insert([
        {
          name: record.name,
          amount: record.amount,
          original_amount: record.originalAmount,
          type: record.type,
          description: record.description,
          date: record.date,
          due_date: record.dueDate,
          status: record.status,
          payments: record.payments,
        },
      ]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[PeerRepo] insert error:', err);
      return false;
    }
  }
}
