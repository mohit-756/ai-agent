import type { PeerRecord, PeerSummary } from '../types/peer';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const PEER_STORAGE_KEY = 'ai_expense_tracker_peer_records';

const INITIAL_PEER_RECORDS: PeerRecord[] = [];

export class PeerService {
  public static getPeerRecords(): PeerRecord[] {
    try {
      const stored = localStorage.getItem(PEER_STORAGE_KEY);
      if (!stored) {
        this.savePeerRecords(INITIAL_PEER_RECORDS);
        return INITIAL_PEER_RECORDS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse peer records from localStorage', e);
      return INITIAL_PEER_RECORDS;
    }
  }

  public static clearAllData(): PeerRecord[] {
    localStorage.removeItem(PEER_STORAGE_KEY);
    this.savePeerRecords([]);
    return [];
  }

  public static savePeerRecords(records: PeerRecord[]): void {
    localStorage.setItem(PEER_STORAGE_KEY, JSON.stringify(records));
  }

  /**
   * Sync peer records from cloud database (Supabase) in background
   */
  public static async syncFromCloud(): Promise<PeerRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('peer_records')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        if (data) {
          const cloudRecords: PeerRecord[] = data.map(item => ({
            id: item.id.toString(),
            name: item.name,
            amount: Number(item.amount),
            originalAmount: Number(item.original_amount ?? item.originalAmount ?? item.amount),
            type: item.type as 'lent' | 'borrowed',
            description: item.description || '',
            date: item.date,
            dueDate: item.due_date || item.dueDate || undefined,
            status: (item.status as 'pending' | 'settled') || 'pending',
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
            payments: item.payments || []
          }));

          // Merge cloud records with demo local records if not present
          const localRecords = this.getPeerRecords();
          const cloudIds = new Set(cloudRecords.map(r => r.id));
          const localOnlyDemo = localRecords.filter(r => r.id.startsWith('peer-') && !cloudIds.has(r.id));
          const merged = [...cloudRecords, ...localOnlyDemo];

          this.savePeerRecords(merged);
          return merged;
        }
      } catch (err) {
        console.error('Failed to sync peer records from Supabase:', err);
      }
    }
    return this.getPeerRecords();
  }

  public static addPeerRecord(recordData: Omit<PeerRecord, 'id' | 'createdAt' | 'status' | 'payments' | 'amount'>): PeerRecord {
    const records = this.getPeerRecords();
    const newRecord: PeerRecord = {
      ...recordData,
      id: `peer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      amount: recordData.originalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      payments: []
    };

    const updated = [newRecord, ...records];
    this.savePeerRecords(updated);

    // Sync in background to Supabase
    if (isSupabaseConfigured && supabase) {
      supabase.from('peer_records').insert([{
        name: newRecord.name,
        amount: newRecord.amount,
        original_amount: newRecord.originalAmount,
        type: newRecord.type,
        description: newRecord.description,
        date: newRecord.date,
        due_date: newRecord.dueDate || null,
        status: newRecord.status
      }]).then(({ error }) => {
        if (error) console.error('Error syncing addPeerRecord to Supabase:', error);
      });
    }

    return newRecord;
  }

  public static updatePeerRecord(id: string, updatedFields: Partial<PeerRecord>): PeerRecord | null {
    const records = this.getPeerRecords();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;

    const existing = records[index];
    
    // If original amount changes, recalculate outstanding amount based on existing payments
    let amount = existing.amount;
    if (updatedFields.originalAmount !== undefined) {
      const totalPaid = existing.payments.reduce((sum, p) => sum + p.amount, 0);
      amount = Math.max(0, updatedFields.originalAmount - totalPaid);
    }

    const updatedRecord: PeerRecord = {
      ...existing,
      ...updatedFields,
      amount,
      status: amount === 0 ? 'settled' : 'pending'
    };

    records[index] = updatedRecord;
    this.savePeerRecords(records);

    // Sync in background to Supabase
    if (isSupabaseConfigured && supabase && !id.startsWith('peer-')) {
      supabase.from('peer_records')
        .update({
          name: updatedRecord.name,
          amount: updatedRecord.amount,
          original_amount: updatedRecord.originalAmount,
          type: updatedRecord.type,
          description: updatedRecord.description,
          date: updatedRecord.date,
          due_date: updatedRecord.dueDate || null,
          status: updatedRecord.status
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error syncing updatePeerRecord to Supabase:', error);
        });
    }

    return updatedRecord;
  }

  public static deletePeerRecord(id: string): boolean {
    const records = this.getPeerRecords();
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length === records.length) return false;
    this.savePeerRecords(filtered);

    // Sync in background to Supabase
    if (isSupabaseConfigured && supabase && !id.startsWith('peer-')) {
      supabase.from('peer_records')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error syncing deletePeerRecord to Supabase:', error);
        });
    }

    return true;
  }

  /**
   * Log a payback (full or partial) for an outstanding peer transaction
   */
  public static recordPayback(id: string, paybackAmount: number, date: string, notes?: string): PeerRecord | null {
    const records = this.getPeerRecords();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;

    const existing = records[index];
    if (existing.status === 'settled') return existing;

    const newPayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      amount: paybackAmount,
      date,
      notes
    };

    const updatedPayments = [...existing.payments, newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const newOutstanding = Math.max(0, existing.originalAmount - totalPaid);

    const updatedRecord: PeerRecord = {
      ...existing,
      payments: updatedPayments,
      amount: newOutstanding,
      status: newOutstanding === 0 ? 'settled' : 'pending'
    };

    records[index] = updatedRecord;
    this.savePeerRecords(records);

    // Sync in background to Supabase
    if (isSupabaseConfigured && supabase && !id.startsWith('peer-')) {
      supabase.from('peer_records')
        .update({
          amount: updatedRecord.amount,
          status: updatedRecord.status
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error syncing recordPayback to Supabase:', error);
        });
    }

    return updatedRecord;
  }

  /**
   * Remove a payback payment and recalculate outstanding amount
   */
  public static removePayback(recordId: string, paymentId: string): PeerRecord | null {
    const records = this.getPeerRecords();
    const index = records.findIndex(r => r.id === recordId);
    if (index === -1) return null;

    const existing = records[index];
    const updatedPayments = existing.payments.filter(p => p.id !== paymentId);
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const newOutstanding = Math.max(0, existing.originalAmount - totalPaid);

    const updatedRecord: PeerRecord = {
      ...existing,
      payments: updatedPayments,
      amount: newOutstanding,
      status: newOutstanding === 0 ? 'settled' : 'pending'
    };

    records[index] = updatedRecord;
    this.savePeerRecords(records);

    // Sync in background to Supabase
    if (isSupabaseConfigured && supabase && !recordId.startsWith('peer-')) {
      supabase.from('peer_records')
        .update({
          amount: updatedRecord.amount,
          status: updatedRecord.status
        })
        .eq('id', recordId)
        .then(({ error }) => {
          if (error) console.error('Error syncing removePayback to Supabase:', error);
        });
    }

    return updatedRecord;
  }

  public static getOwedToMe(): number {
    return this.getPeerRecords()
      .filter(r => r.type === 'lent' && r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  public static getIOwe(): number {
    return this.getPeerRecords()
      .filter(r => r.type === 'borrowed' && r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  public static getNetBalance(): number {
    return this.getOwedToMe() - this.getIOwe();
  }

  public static getGroupedSummaries(): PeerSummary[] {
    const records = this.getPeerRecords();
    const peerMap = new Map<string, PeerRecord[]>();

    records.forEach(r => {
      // Use case-insensitive grouping, but preserve name casing
      const nameKey = r.name.trim();
      const existing = peerMap.get(nameKey) || [];
      peerMap.set(nameKey, [...existing, r]);
    });

    const summaries: PeerSummary[] = [];

    peerMap.forEach((peerRecords, name) => {
      let netBalance = 0;
      peerRecords.forEach(r => {
        if (r.status === 'pending') {
          if (r.type === 'lent') {
            netBalance += r.amount;
          } else {
            netBalance -= r.amount;
          }
        }
      });

      summaries.push({
        name,
        netBalance,
        records: peerRecords.sort((a, b) => b.date.localeCompare(a.date))
      });
    });

    // Sort by name
    return summaries.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Updates all records containing oldName to newName
   */
  public static renamePeer(oldName: string, newName: string): void {
    const records = this.getPeerRecords();
    const cleanedOld = oldName.trim().toLowerCase();
    const cleanedNew = newName.trim();

    const updated = records.map(r => {
      if (r.name.trim().toLowerCase() === cleanedOld) {
        return { ...r, name: cleanedNew };
      }
      return r;
    });

    this.savePeerRecords(updated);
  }

  public static resetDemoData(): PeerRecord[] {
    this.savePeerRecords(INITIAL_PEER_RECORDS);
    return INITIAL_PEER_RECORDS;
  }
}
