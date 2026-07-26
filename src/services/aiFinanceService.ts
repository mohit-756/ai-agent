import type { Expense, Budget, Category, PaymentMethod, AIInsight, ChatMessage, NLPParseResult } from '../types/expense';
import { autoCategorize, formatCurrency } from './expenseService';
import { BudgetService } from './budgetService';

export class AIFinanceService {

  /**
   * Natural Language Parser Engine
   * Converts queries like "Spent ₹250 on Swiggy lunch via UPI" into structured data.
   */
  public static parseNaturalLanguageExpense(text: string): NLPParseResult {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        amount: null,
        category: 'Others',
        description: '',
        merchant: '',
        paymentMethod: 'UPI',
        date: new Date().toISOString().split('T')[0],
        confidence: 0
      };
    }

    // 1. Amount Extraction (matches ₹250, Rs 250, Rs. 250, INR 250, 250rs, or standalone numbers)
    let amount: number | null = null;
    const amountRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rs|rupees|inr|₹)?/i;
    const amountMatch = trimmed.match(amountRegex);

    if (amountMatch) {
      const rawNum = (amountMatch[1] || amountMatch[2]).replace(/,/g, '');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }

    // 2. Category Auto Detection
    const category: Category = autoCategorize(trimmed);

    // 3. Payment Method Detection
    let paymentMethod: PaymentMethod = 'UPI';
    const lower = trimmed.toLowerCase();
    if (lower.includes('credit card') || lower.includes('cc')) {
      paymentMethod = 'Credit Card';
    } else if (lower.includes('debit card') || lower.includes('dc')) {
      paymentMethod = 'Debit Card';
    } else if (lower.includes('cash')) {
      paymentMethod = 'Cash';
    } else if (lower.includes('netbanking') || lower.includes('net banking')) {
      paymentMethod = 'Net Banking';
    }

    // 4. Date Detection (yesterday, today)
    const today = new Date();
    let dateStr = today.toISOString().split('T')[0];
    if (lower.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      dateStr = yesterday.toISOString().split('T')[0];
    }

    // 5. Merchant & Description extraction
    let merchant = '';
    const merchants = [
      'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'Instamart', 'Uber', 'Ola', 'Rapido', 
      'Amazon', 'Flipkart', 'Myntra', 'Netflix', 'Spotify', 'Apollo', 'D-Mart', 'BESCOM', 'Airtel'
    ];
    for (const m of merchants) {
      if (lower.includes(m.toLowerCase())) {
        merchant = m;
        break;
      }
    }

    // Clean up description
    let description = trimmed;
    description = description.replace(/^(spent|paid|bought|add|expense|for|on)\s+/i, '');
    if (merchant && !description.toLowerCase().includes(merchant.toLowerCase())) {
      description = `${merchant} - ${description}`;
    }

    const confidence = amount ? (merchant ? 0.95 : 0.85) : 0.4;

    return {
      amount,
      category,
      description: description || 'Miscellaneous Expense',
      merchant,
      paymentMethod,
      date: dateStr,
      confidence
    };
  }

  /**
   * Automated Smart Insights Engine
   */
  public static generateSpendingInsights(expenses: Expense[], _budgets: Budget[]): AIInsight[] {
    const insights: AIInsight[] = [];
    if (!expenses.length) return insights;

    const budgetStatuses = BudgetService.getBudgetStatuses(expenses);
    
    // Check overbudget or warning categories
    budgetStatuses.forEach(b => {
      if (b.status === 'exceeded') {
        insights.push({
          id: `insight-over-${b.category}`,
          type: 'warning',
          title: `Budget Exceeded: ${b.category}`,
          message: `You've spent ${formatCurrency(b.spent)} out of your ${formatCurrency(b.allocated)} monthly limit.`,
          metric: `${b.percentage}% spent`,
          category: b.category,
          actionableText: 'Review and cut non-essential purchases in this category.'
        });
      } else if (b.status === 'warning') {
        insights.push({
          id: `insight-warn-${b.category}`,
          type: 'warning',
          title: `Budget Warning: ${b.category}`,
          message: `You've used ${b.percentage}% of your limit (${formatCurrency(b.spent)} / ${formatCurrency(b.allocated)}).`,
          metric: `${formatCurrency(b.remaining)} remaining`,
          category: b.category,
          actionableText: 'Nearing safety threshold. Monitor upcoming orders.'
        });
      }
    });

    // Highest Category Spending Insight
    const categoryTotals = new Map<Category, number>();
    expenses.forEach(e => {
      const cur = categoryTotals.get(e.category) || 0;
      categoryTotals.set(e.category, cur + e.amount);
    });

    let maxCategory: Category = 'Others';
    let maxAmount = 0;
    categoryTotals.forEach((amt, cat) => {
      if (amt > maxAmount) {
        maxAmount = amt;
        maxCategory = cat;
      }
    });

    if (maxAmount > 0) {
      const totalSpent = Array.from(categoryTotals.values()).reduce((a, b) => a + b, 0);
      const categoryShare = Math.round((maxAmount / totalSpent) * 100);

      insights.push({
        id: 'insight-top-category',
        type: 'info',
        title: `Top Expense Category: ${maxCategory}`,
        message: `${maxCategory} accounts for ${categoryShare}% of your total spending (${formatCurrency(maxAmount)}).`,
        metric: `${categoryShare}% of total`,
        category: maxCategory,
        actionableText: `Setting a strict limit on ${maxCategory} could save you up to ${formatCurrency(Math.round(maxAmount * 0.15))} monthly.`
      });
    }

    // Positive Savings Reinforcement
    const safeBudgets = budgetStatuses.filter(b => b.spent > 0 && b.percentage < 50);
    if (safeBudgets.length > 0) {
      insights.push({
        id: 'insight-positive-budget',
        type: 'positive',
        title: 'Great Financial Control!',
        message: `You are keeping spending well under control in ${safeBudgets.length} categories, including ${safeBudgets[0].category}.`,
        metric: 'Under 50% spent',
        actionableText: 'Keep up the healthy financial discipline!'
      });
    }

    return insights;
  }

  /**
   * Context-Aware Conversational AI Assistant
   */
  public static queryExpenseAssistant(
    userQuery: string,
    expenses: Expense[],
    _budgets: Budget[]
  ): ChatMessage {
    const q = userQuery.toLowerCase().trim();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const monthTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    const budgetStatuses = BudgetService.getBudgetStatuses(expenses);
    const totalAllocatedBudget = budgetStatuses.reduce((acc, b) => acc + b.allocated, 0);

    // 1. Total Spending Queries ("how much did i spend", "total spending", "month spending")
    if (q.includes('how much') && (q.includes('spend') || q.includes('total') || q.includes('month'))) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `You have spent **${formatCurrency(monthTotal)}** so far this month across ${monthExpenses.length} transactions. Your total monthly budget is **${formatCurrency(totalAllocatedBudget)}**, leaving **${formatCurrency(Math.max(0, totalAllocatedBudget - monthTotal))}** remaining.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cardData: {
          type: 'metric',
          title: 'Monthly Spending Overview',
          items: [
            { label: 'Total Spent', value: formatCurrency(monthTotal) },
            { label: 'Total Allocated Budget', value: formatCurrency(totalAllocatedBudget) },
            { label: 'Remaining Balance', value: formatCurrency(Math.max(0, totalAllocatedBudget - monthTotal)) }
          ]
        }
      };
    }

    // 2. Affordability Queries ("can i afford", "can i buy", "should i buy")
    const affordMatch = q.match(/(?:can i afford|can i buy|should i buy|afford)\s*(?:a|an)?\s*(?:₹|rs\.?)?\s*(\d+)/i);
    if (affordMatch) {
      const itemCost = parseFloat(affordMatch[1]);
      const remainingBudget = totalAllocatedBudget - monthTotal;

      if (remainingBudget >= itemCost) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `✅ **Yes, you can afford it!** Buying this for **${formatCurrency(itemCost)}** will leave you with **${formatCurrency(remainingBudget - itemCost)}** in your remaining monthly budget pool of ${formatCurrency(remainingBudget)}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cardData: {
            type: 'metric',
            title: 'Purchase Impact Assessment',
            items: [
              { label: 'Item Price', value: formatCurrency(itemCost) },
              { label: 'Current Remaining Budget', value: formatCurrency(remainingBudget) },
              { label: 'Budget After Purchase', value: formatCurrency(remainingBudget - itemCost) }
            ]
          }
        };
      } else {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Caution recommended.** Buying this for **${formatCurrency(itemCost)}** exceeds your remaining budget of **${formatCurrency(remainingBudget)}** by **${formatCurrency(itemCost - remainingBudget)}**. Consider postponing this purchase until next month.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    // 3. Category Specific Queries
    let matchedCat: Category | null = null;
    if (q.includes('food') || q.includes('swiggy') || q.includes('zomato') || q.includes('dining')) matchedCat = 'Food & Dining';
    else if (q.includes('transport') || q.includes('uber') || q.includes('ola') || q.includes('cab')) matchedCat = 'Transportation';
    else if (q.includes('shopping') || q.includes('amazon') || q.includes('clothes')) matchedCat = 'Shopping & Retail';
    else if (q.includes('bills') || q.includes('electricity') || q.includes('recharge')) matchedCat = 'Bills & Utilities';
    else if (q.includes('movie') || q.includes('netflix') || q.includes('entertainment')) matchedCat = 'Entertainment';

    if (matchedCat) {
      const catExpenses = monthExpenses.filter(e => e.category === matchedCat);
      const catTotal = catExpenses.reduce((acc, e) => acc + e.amount, 0);
      const status = budgetStatuses.find(b => b.category === matchedCat);

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `In **${matchedCat}**, you have spent **${formatCurrency(catTotal)}** this month across ${catExpenses.length} transactions. ${status ? `Your allocated limit is ${formatCurrency(status.allocated)} (${status.percentage}% used).` : ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cardData: {
          type: 'metric',
          title: `${matchedCat} Insights`,
          items: [
            { label: 'Category Spent', value: formatCurrency(catTotal) },
            { label: 'Budget Limit', value: status ? formatCurrency(status.allocated) : 'N/A' },
            { label: 'Status', value: status ? status.status.toUpperCase() : 'SAFE' }
          ]
        }
      };
    }

    // 4. Overspending / Highest Category Query
    if (q.includes('overspend') || q.includes('highest') || q.includes('top category') || q.includes('where am i spending')) {
      const sortedBudgets = [...budgetStatuses].sort((a, b) => b.percentage - a.percentage);
      const highest = sortedBudgets[0];

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Your highest spending ratio is in **${highest.category}** where you have spent **${formatCurrency(highest.spent)}** out of your **${formatCurrency(highest.allocated)}** budget (**${highest.percentage}%** used).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cardData: {
          type: 'metric',
          title: 'Top Budget Consumption',
          items: [
            { label: 'Category', value: highest.category },
            { label: 'Spent Amount', value: formatCurrency(highest.spent) },
            { label: 'Budget Usage', value: `${highest.percentage}%` }
          ]
        }
      };
    }

    // 5. Saving Tips & Advice
    if (q.includes('tip') || q.includes('save') || q.includes('advice') || q.includes('reduce')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `💡 **AI Smart Financial Advice for You:**\n\n1. **Food Orders**: Consolidating Swiggy/Zomato orders can save ~₹1,200 monthly on delivery & surges.\n2. **Subscriptions**: Audit auto-renewals like Netflix/Prime to ensure you only pay for active services.\n3. **UPI Quick Add**: Keep using the Natural Language Bar to catch micro-purchases before they add up!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // General Fallback Conversational Response
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `I'm your AI Expense Assistant! I have analyzed your ${expenses.length} transactions totaling **${formatCurrency(monthTotal)}**. You can ask me:\n- *"How much did I spend this month?"*\n- *"Can I afford a ₹2,500 purchase?"*\n- *"How much on Food & Dining?"*\n- *"Where am I overspending?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}
