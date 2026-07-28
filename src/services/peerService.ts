import type { PeerRecord, PeerSummary } from '../types/peer';

const PEER_STORAGE_KEY = 'ai_expense_tracker_peer_records';

function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return d.toISOString().split('T')[0];
}

const INITIAL_PEER_RECORDS: PeerRecord[] = [
  {
    id: 'peer-1',
    name: 'Rohit Sharma',
    amount: 1200,
    originalAmount: 1200,
    type: 'lent',
    description: 'Cricket match tickets split',
    date: getRelativeDate(3),
    dueDate: getRelativeDate(-2), // overdue
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    payments: []
  },
  {
    id: 'peer-2',
    name: 'Sneha Patel',
    amount: 500,
    originalAmount: 500,
    type: 'lent',
    description: 'Cafe coffee & desserts',
    date: getRelativeDate(1),
    dueDate: getRelativeDate(2), // due in future
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    payments: []
  },
  {
    id: 'peer-3',
    name: 'Amit Verma',
    amount: 1500,
    originalAmount: 1500,
    type: 'borrowed',
    description: 'Electricity bill split share',
    date: getRelativeDate(5),
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    payments: []
  },
  {
    id: 'peer-4',
    name: 'Rohit Sharma',
    amount: 0,
    originalAmount: 800,
    type: 'lent',
    description: 'Weekend lunch buffet',
    date: getRelativeDate(4),
    status: 'settled',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    payments: [
      {
        id: 'pay-1',
        amount: 800,
        date: getRelativeDate(1),
        notes: 'Paid back via GPay'
      }
    ]
  }
];

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

  public static savePeerRecords(records: PeerRecord[]): void {
    localStorage.setItem(PEER_STORAGE_KEY, JSON.stringify(records));
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
    return updatedRecord;
  }

  public static deletePeerRecord(id: string): boolean {
    const records = this.getPeerRecords();
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length === records.length) return false;
    this.savePeerRecords(filtered);
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
