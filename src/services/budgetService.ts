import type { Budget, BudgetStatus, Category, Expense } from '../types/expense';

const BUDGETS_STORAGE_KEY = 'ai_expense_tracker_budgets';

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Food & Dining', allocatedAmount: 8000, period: 'monthly' },
  { category: 'Transportation', allocatedAmount: 4000, period: 'monthly' },
  { category: 'Shopping & Retail', allocatedAmount: 6000, period: 'monthly' },
  { category: 'Bills & Utilities', allocatedAmount: 7000, period: 'monthly' },
  { category: 'Entertainment', allocatedAmount: 3000, period: 'monthly' },
  { category: 'Health & Wellness', allocatedAmount: 3000, period: 'monthly' },
  { category: 'Travel', allocatedAmount: 5000, period: 'monthly' },
  { category: 'Education', allocatedAmount: 2000, period: 'monthly' },
  { category: 'Services', allocatedAmount: 2000, period: 'monthly' },
  { category: 'Others', allocatedAmount: 2000, period: 'monthly' },
];

export class BudgetService {
  public static getBudgets(): Budget[] {
    try {
      const stored = localStorage.getItem(BUDGETS_STORAGE_KEY);
      if (!stored) {
        this.saveBudgets(DEFAULT_BUDGETS);
        return DEFAULT_BUDGETS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse budgets from localStorage', e);
      return DEFAULT_BUDGETS;
    }
  }

  public static saveBudgets(budgets: Budget[]): void {
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
  }

  public static updateCategoryBudget(category: Category, allocatedAmount: number): Budget[] {
    const budgets = this.getBudgets();
    const index = budgets.findIndex(b => b.category === category);
    if (index !== -1) {
      budgets[index].allocatedAmount = allocatedAmount;
    } else {
      budgets.push({ category, allocatedAmount, period: 'monthly' });
    }
    this.saveBudgets(budgets);
    return budgets;
  }

  public static getBudgetStatuses(expenses: Expense[]): BudgetStatus[] {
    const budgets = this.getBudgets();
    
    // Filter expenses for current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthExpenses = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    // Aggregate spent amount per category
    const spentMap = new Map<Category, number>();
    currentMonthExpenses.forEach(exp => {
      const current = spentMap.get(exp.category) || 0;
      spentMap.set(exp.category, current + exp.amount);
    });

    return budgets.map(b => {
      const spent = spentMap.get(b.category) || 0;
      const remaining = b.allocatedAmount - spent;
      const percentage = b.allocatedAmount > 0 ? Math.round((spent / b.allocatedAmount) * 100) : 0;
      
      let status: 'safe' | 'warning' | 'exceeded' = 'safe';
      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= 75) {
        status = 'warning';
      }

      return {
        category: b.category,
        allocated: b.allocatedAmount,
        spent,
        remaining,
        percentage,
        status
      };
    });
  }

  public static getTotalMonthlyBudget(): number {
    return this.getBudgets().reduce((acc, b) => acc + b.allocatedAmount, 0);
  }
}
