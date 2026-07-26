import type { Expense, Category } from '../types/expense';

const EXPENSES_STORAGE_KEY = 'ai_expense_tracker_expenses';

// Keyword mapping for automated category resolution
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Food & Dining': [
    'swiggy', 'zomato', 'blinkit', 'instamart', 'zepto', 'dominos', 'pizza', 'mcdonalds', 
    'starbucks', 'kfc', 'subway', 'lunch', 'dinner', 'breakfast', 'cafe', 'restaurant', 
    'tea', 'chai', 'coffee', 'supermarket', 'grocery', 'groceries', 'bakery', 'food'
  ],
  'Transportation': [
    'uber', 'ola', 'rapido', 'metro', 'namma metro', 'auto', 'cab', 'taxi', 'fuel', 
    'petrol', 'diesel', 'fastag', 'toll', 'parking', 'bus', 'train', 'irctc'
  ],
  'Shopping & Retail': [
    'amazon', 'flipkart', 'myntra', 'ajio', 'tata cliq', 'nykaa', 'zara', 'h&m', 
    'decathlon', 'd-mart', 'dmart', 'croma', 'reliance digital', 'clothes', 'shoes', 
    'shopping', 'electronics'
  ],
  'Bills & Utilities': [
    'electricity', 'bescom', 'tata sky', 'airtel', 'jio', 'vi', 'vodafone', 'broadband', 
    'wifi', 'water bill', 'gas', 'indane', 'hp gas', 'rent', 'maintenance', 'recharge'
  ],
  'Entertainment': [
    'netflix', 'hotstar', 'prime video', 'spotify', 'youtube', 'bookmyshow', 'cinema', 
    'movie', 'gaming', 'steam', 'playstation', 'concert', 'event'
  ],
  'Health & Wellness': [
    'apollo', '1mg', 'pharmeasy', 'pharmacy', 'hospital', 'doctor', 'clinic', 'cult.fit', 
    'gym', 'fitness', 'medicines', 'lab test'
  ],
  'Travel': [
    'makemytrip', 'goibibo', 'cleartrip', 'airbnb', 'hotel', 'flight', 'resort', 
    'indigo', 'air india', 'stay', 'vacation'
  ],
  'Education': [
    'udemy', 'coursera', 'books', 'stationery', 'school', 'college', 'tuition', 
    'course', 'exam fee'
  ],
  'Services': [
    'urban company', 'dry clean', 'laundry', 'salon', 'barber', 'spa', 'plumber', 'electrician'
  ],
  'Others': ['miscellaneous', 'cash', 'transfer', 'gift', 'other']
};

/**
 * Heuristic Auto-Categorization
 */
export function autoCategorize(text: string): Category {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category as Category;
    }
  }
  return 'Others';
}

/**
 * Format Currency in INR standard format (₹)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Helper to get date relative to today (YYYY-MM-DD)
 */
function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return d.toISOString().split('T')[0];
}

// Initial realistic demo transactions
const INITIAL_TRANSACTIONS: Expense[] = [
  {
    id: 'exp-1',
    amount: 349,
    category: 'Food & Dining',
    description: 'Swiggy Lunch - Paneer Butter Masala',
    merchant: 'Swiggy',
    paymentMethod: 'UPI',
    date: getRelativeDate(0),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: 'Order with colleagues'
  },
  {
    id: 'exp-2',
    amount: 185,
    category: 'Transportation',
    description: 'Uber Auto to Office',
    merchant: 'Uber',
    paymentMethod: 'UPI',
    date: getRelativeDate(0),
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
  },
  {
    id: 'exp-3',
    amount: 1499,
    category: 'Shopping & Retail',
    description: 'Amazon Wireless Headphones',
    merchant: 'Amazon India',
    paymentMethod: 'Credit Card',
    date: getRelativeDate(1),
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'exp-4',
    amount: 649,
    category: 'Entertainment',
    description: 'Netflix Monthly Premium Subscription',
    merchant: 'Netflix',
    paymentMethod: 'Credit Card',
    date: getRelativeDate(2),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'exp-5',
    amount: 1850,
    category: 'Bills & Utilities',
    description: 'BESCOM Electricity Bill Payment',
    merchant: 'BESCOM',
    paymentMethod: 'Net Banking',
    date: getRelativeDate(3),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'exp-6',
    amount: 520,
    category: 'Health & Wellness',
    description: 'Apollo Pharmacy Medicines',
    merchant: 'Apollo Pharmacy',
    paymentMethod: 'UPI',
    date: getRelativeDate(4),
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'exp-7',
    amount: 450,
    category: 'Food & Dining',
    description: 'Zomato Weekend Dinner',
    merchant: 'Zomato',
    paymentMethod: 'UPI',
    date: getRelativeDate(5),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'exp-8',
    amount: 2200,
    category: 'Shopping & Retail',
    description: 'D-Mart Monthly Grocery Run',
    merchant: 'D-Mart',
    paymentMethod: 'Debit Card',
    date: getRelativeDate(6),
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 'exp-9',
    amount: 320,
    category: 'Transportation',
    description: 'Rapido Bike Rides (Weekly)',
    merchant: 'Rapido',
    paymentMethod: 'UPI',
    date: getRelativeDate(7),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'exp-10',
    amount: 1200,
    category: 'Bills & Utilities',
    description: 'Airtel Broadband Fiber Recharge',
    merchant: 'Airtel',
    paymentMethod: 'UPI',
    date: getRelativeDate(8),
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
  }
];

export class ExpenseService {
  public static getExpenses(): Expense[] {
    try {
      const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (!stored) {
        this.saveExpenses(INITIAL_TRANSACTIONS);
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse expenses from localStorage', e);
      return INITIAL_TRANSACTIONS;
    }
  }

  public static saveExpenses(expenses: Expense[]): void {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  }

  public static addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const expenses = this.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newExpense, ...expenses];
    this.saveExpenses(updated);
    return newExpense;
  }

  public static updateExpense(id: string, updatedFields: Partial<Expense>): Expense | null {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return null;

    const updatedExpense = { ...expenses[index], ...updatedFields };
    expenses[index] = updatedExpense;
    this.saveExpenses(expenses);
    return updatedExpense;
  }

  public static deleteExpense(id: string): boolean {
    const expenses = this.getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    if (filtered.length === expenses.length) return false;

    this.saveExpenses(filtered);
    return true;
  }

  public static resetDemoData(): Expense[] {
    this.saveExpenses(INITIAL_TRANSACTIONS);
    return INITIAL_TRANSACTIONS;
  }
}
