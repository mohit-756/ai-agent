export type Category = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping & Retail'
  | 'Bills & Utilities'
  | 'Entertainment'
  | 'Health & Wellness'
  | 'Travel'
  | 'Education'
  | 'Services'
  | 'Income'
  | 'Others';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  type?: 'expense' | 'income'; // 'expense' (default) or 'income'
  notes?: string;
  tags?: string[];
  source?: 'manual' | 'whatsapp' | 'nlp';
  receiptUrl?: string; // Cloud database link to the physical bill image
}

export interface Budget {
  category: Category;
  allocatedAmount: number;
  spentAmount?: number;
  period: 'monthly';
}

export interface BudgetStatus {
  category: Category;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface ExpenseFilter {
  searchQuery: string;
  category: Category | 'All';
  paymentMethod: PaymentMethod | 'All';
  startDate: string;
  endDate: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'tip' | 'positive' | 'info';
  title: string;
  message: string;
  metric?: string;
  category?: Category;
  actionableText?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  cardData?: {
    type: 'metric' | 'expense-list' | 'budget-summary' | 'tip';
    title?: string;
    items?: Array<{ label: string; value: string }>;
  };
}

export interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'bot';
  body: string;
  timestamp: string;
  status?: 'delivered' | 'read' | 'sent';
  expenseAdded?: Expense;
}

export interface NLPParseResult {
  amount: number | null;
  category: Category;
  description: string;
  merchant: string;
  paymentMethod: PaymentMethod;
  date: string;
  confidence: number;
  type?: 'expense' | 'income';
}
