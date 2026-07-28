export interface PaymentHistory {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface PeerRecord {
  id: string;
  name: string;
  amount: number; // current outstanding amount
  originalAmount: number; // initial amount lent/borrowed
  type: 'lent' | 'borrowed'; // 'lent' = they took money from me (peer owes me); 'borrowed' = I took money from them (I owe peer)
  description: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD (optional deadline)
  status: 'pending' | 'settled';
  createdAt: string;
  payments: PaymentHistory[];
}

export interface PeerSummary {
  name: string;
  netBalance: number; // positive = they owe me; negative = I owe them
  records: PeerRecord[];
}
