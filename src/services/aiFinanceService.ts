import type { Expense, Budget, Category, PaymentMethod, AIInsight, ChatMessage, NLPParseResult } from '../types/expense';
import { autoCategorize, formatCurrency } from './expenseService';
import { BudgetService } from './budgetService';
import { PeerService } from './peerService';

export function parseFlexibleDate(str: string): string {
  const clean = str.trim().replace(/[^0-9-/]/g, '');
  
  // 1. Matches YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }
  
  // 2. Matches DD-MM-YYYY or DD/MM/YYYY
  const dmy = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  // 3. Matches DD-MM-YY or DD/MM/YY
  const dmyShort = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{2})$/);
  if (dmyShort) {
    const year = parseInt(dmyShort[3]) < 50 ? `20${dmyShort[3]}` : `19${dmyShort[3]}`;
    return `${year}-${dmyShort[2]}-${dmyShort[1]}`;
  }

  return clean;
}

export class AIFinanceService {

  /**
   * Natural Language Parser for Real-Life Notes, Tasks, Reminders & Ideas
   */
  public static parseNaturalLanguageMemory(text: string): {
    isMemory: boolean;
    category: 'note' | 'reminder' | 'idea' | 'task';
    content: string;
  } {
    const trimmed = text.trim();
    if (!trimmed) return { isMemory: false, category: 'note', content: '' };

    const lower = trimmed.toLowerCase();

    // Check for real-life keywords
    const isReminder = /\b(remind|reminder|appointment|schedule|scheduled|due|meeting|alarm|doctor|call|dentist)\b/i.test(lower);
    const isTask = /\b(buy|todo|task|groceries|shopping list|clean|fix|send|mail|finish|do)\b/i.test(lower) && !/\b(spent|paid|₹|rs|inr)\b/i.test(lower);
    const isIdea = /\b(idea|thought|feature|project|concept|what if)\b/i.test(lower);
    const isNote = /\b(note|memo|remember|journal|log|met|discussed)\b/i.test(lower);

    // If it has monetary amount (e.g. ₹250 or spent 500), it's financial
    const hasMoneyAmount = /(?:₹|rs\.?|inr)\s*\d+|\d+\s*(?:rs|rupees|inr|₹)/i.test(lower) || /\b(spent|paid|borrowed|lent)\b/i.test(lower);

    if ((isReminder || isTask || isIdea || isNote) && !hasMoneyAmount) {
      let category: 'note' | 'reminder' | 'idea' | 'task' = 'note';
      if (isReminder) category = 'reminder';
      else if (isTask) category = 'task';
      else if (isIdea) category = 'idea';

      return {
        isMemory: true,
        category,
        content: trimmed
      };
    }

    return { isMemory: false, category: 'note', content: trimmed };
  }

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
   * Natural Language Parser for Peer Records
   * Extracts lent/borrowed records from text like "Lent ₹500 to Sneha for cab"
   */
  public static parseNaturalLanguagePeerRecord(text: string): {
    isPeerRecord: boolean;
    type?: 'lent' | 'borrowed';
    peerName?: string;
    amount?: number;
    description?: string;
    date?: string;
    dueDate?: string;
  } {
    const lower = text.toLowerCase();

    // Check if text has structured key-value template format (e.g. contains colons and split pipes or newlines)
    const isStructured = lower.includes(':') && (lower.includes('|') || lower.includes('\n'));
    if (isStructured) {
      const segments = text.split(/[|\n]+/);
      let parsedAmount = 0;
      let parsedType: 'lent' | 'borrowed' = 'lent';
      let parsedName = '';
      let parsedDesc = '';
      let parsedDate = '';
      let parsedDueDate = '';
      let isPeer = false;

      for (const seg of segments) {
        const parts = seg.split(':');
        if (parts.length < 2) continue;
        const key = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(':').trim();

        if (key.includes('lent') || key.includes('lend') || key.includes('given')) {
          parsedType = 'lent';
          parsedAmount = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
          isPeer = true;
        } else if (key.includes('borrowed') || key.includes('borrow') || key.includes('owe') || key.includes('taken')) {
          parsedType = 'borrowed';
          parsedAmount = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
          isPeer = true;
        } else if (key === 'amount') {
          parsedAmount = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
        } else if (key === 'name' || key === 'person' || key === 'who' || key === 'peer') {
          parsedName = val;
          isPeer = true;
        } else if (key === 'desc' || key === 'description' || key === 'for') {
          parsedDesc = val;
        } else if (key === 'date' || key === 'when') {
          parsedDate = val;
        } else if (key === 'due' || key === 'remind') {
          parsedDueDate = val;
        }
      }

      if (isPeer && parsedAmount > 0) {
        let recDate = new Date().toISOString().split('T')[0];
        if (parsedDate.toLowerCase().includes('yesterday')) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          recDate = yesterday.toISOString().split('T')[0];
        } else if (parsedDate.trim()) {
          recDate = parseFlexibleDate(parsedDate);
        }

        let dueD: string | undefined = undefined;
        if (parsedDueDate.toLowerCase().includes('tomorrow') || parsedDueDate.toLowerCase().includes('tommorow')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dueD = tomorrow.toISOString().split('T')[0];
        } else if (parsedDueDate.toLowerCase().includes('next week')) {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          dueD = nextWeek.toISOString().split('T')[0];
        } else if (parsedDueDate.trim()) {
          dueD = parseFlexibleDate(parsedDueDate);
        }

        return {
          isPeerRecord: true,
          type: parsedType,
          peerName: parsedName || 'Friend',
          amount: parsedAmount,
          description: parsedDesc || `${parsedType === 'lent' ? 'Lent' : 'Borrowed'} split`,
          date: recDate,
          dueDate: dueD
        };
      }
    }
    
    // Check if message matches peer transaction or reminder patterns
    const isLent = /\blent\b|\blend\b|\bgave\b.*\bto\b|\bgiven\b.*\bto\b|\bsplit\b.*\bwith\b|\bowes\b.*\bme\b/.test(lower);
    const isBorrowed = /\bborrowed\b|\bborrow\b|\btook\b.*\bfrom\b|\breceived\b.*\bfrom\b|\bi\b.*\bowe\b/.test(lower);
    const isReminder = /\bremind\b.*\b(take|pay|get|give|return|collect|ask)\b/.test(lower);
    
    const isPeerRecord = isLent || isBorrowed || isReminder;
    
    if (!isPeerRecord) {
      return { isPeerRecord: false };
    }
    
    // Extract amount
    let amount: number | null = null;
    const amountRegex = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rs|rupees|inr|₹)?/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      const rawNum = (amountMatch[1] || amountMatch[2]).replace(/,/g, '');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
    
    if (!amount) {
      return { isPeerRecord: false };
    }
    
    // Determine type: lent or borrowed
    let type: 'lent' | 'borrowed' = 'lent';
    if (isBorrowed) {
      type = 'borrowed';
    } else if (isReminder && (lower.includes('pay') || lower.includes('give') || lower.includes('return to'))) {
      type = 'borrowed';
    } else if (isReminder && (lower.includes('take') || lower.includes('get') || lower.includes('collect') || lower.includes('ask'))) {
      type = 'lent';
    }
    
    // Try to extract peer name and description
    let peerName = 'Friend';
    let description = 'Peer Split';
    
    // Patterns for matching names
    const toRegex = /(?:lent|gave|given|split\s+with|to)\s+(?:money\s+to\s+|to\s+)?([a-zA-Z]+)(?:\s+|$|\d)/i;
    const fromRegex = /(?:borrowed|took|received|from)\s+(?:money\s+from\s+|from\s+)?([a-zA-Z]+)(?:\s+|$|\d)/i;
    
    let nameMatch = null;
    if (type === 'lent') {
      nameMatch = text.match(toRegex);
    } else {
      nameMatch = text.match(fromRegex);
    }
    
    if (nameMatch && nameMatch[1]) {
      const candidate = nameMatch[1].trim();
      const lowerCandidate = candidate.toLowerCase();
      const stopWords = ['money', 'cash', 'yesterday', 'today', 'tomorrow', 'tommorow', 'due', 'remind', 'him', 'her', 'them', 'me', 'to', 'for', 'from'];
      if (candidate.length > 0 && !/\d/.test(candidate) && !stopWords.includes(lowerCandidate)) {
        peerName = candidate;
      }
    }
    
    // If still Friend, search uppercase word or keyword bounds
    if (peerName === 'Friend') {
      const words = text.split(/\s+/);
      const nameKeywords = ['to', 'from', 'with'];
      for (let i = 0; i < words.length - 1; i++) {
        if (nameKeywords.includes(words[i].toLowerCase())) {
          const nextWord = words[i+1].replace(/[^a-zA-Z]/g, '');
          if (nextWord && nextWord[0] === nextWord[0].toUpperCase()) {
            peerName = nextWord;
            break;
          }
        }
      }
    }
    
    // Capitalize peerName first letter
    if (peerName && peerName !== 'Friend') {
      peerName = peerName.charAt(0).toUpperCase() + peerName.slice(1);
    }
    
    // Parse Record Date (Yesterday, flexible formats)
    let recordDate = new Date().toISOString().split('T')[0];
    if (lower.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      recordDate = yesterday.toISOString().split('T')[0];
    } else {
      const dateMatch = lower.match(/\bon\s+([\d]{2,4}[-/][\d]{2}[-/][\d]{2,4})\b/);
      if (dateMatch) {
        recordDate = parseFlexibleDate(dateMatch[1]);
      }
    }

    // Parse Due Date / Reminder (due tomorrow, due next week, due flexible formats, remind tomorrow/tommorow)
    let dueDateStr: string | undefined = undefined;
    if (lower.includes('tomorrow') || lower.includes('tommorow') || lower.includes('remind tomorrow') || lower.includes('remind tommorow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDateStr = tomorrow.toISOString().split('T')[0];
    } else if (lower.includes('next week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      dueDateStr = nextWeek.toISOString().split('T')[0];
    } else {
      const dueMatch = lower.match(/\bdue\s+([\d]{2,4}[-/][\d]{2}[-/][\d]{2,4})\b/);
      if (dueMatch) {
        dueDateStr = parseFlexibleDate(dueMatch[1]);
      }
    }

    // Parse description: anything after "for" (exclude date/due clauses)
    const forRegex = /\bfor\s+([a-zA-Z0-9\s]+?)(?:\s+on|\s+due|$)/i;
    const forMatch = text.match(forRegex);
    if (forMatch && forMatch[1]) {
      description = forMatch[1].trim();
    } else {
      // Clean up all helper tags
      description = text.replace(amountRegex, '')
        .replace(/\b(?:lent|borrowed|to|from|for|split|with|on|due|yesterday|tomorrow|tommorow|remind|me|take|give|money|cash|him|her|them)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remove name if included
      if (peerName && peerName !== 'Friend') {
        const nameEscaped = peerName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        description = description.replace(new RegExp('\\b' + nameEscaped + '\\b', 'gi'), '');
      }
      
      description = description.replace(/\s+/g, ' ').trim();
      
      if (description.length > 25) {
        description = description.slice(0, 25) + '...';
      }
    }
    
    if (peerName.toLowerCase().includes(' for ')) {
      peerName = peerName.split(/ for /i)[0].trim();
    }
    
    return {
      isPeerRecord: true,
      type,
      peerName,
      amount,
      description: description || (type === 'lent' ? `Lent to ${peerName}` : `Borrowed from ${peerName}`),
      date: recordDate,
      dueDate: dueDateStr
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

    // Peer balances check
    if (q.includes('who owes me') || q.includes('owe me') || q.includes('lent') || q.includes('receivables') || q.includes('debts')) {
      const records = PeerService.getPeerRecords().filter(r => r.type === 'lent' && r.status === 'pending');
      const totalOwed = PeerService.getOwedToMe();

      if (records.length === 0) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `🎉 **Good news!** No one owes you any money at the moment. Your peer lending ledger is completely clear.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      // Group by peer
      const peerTotals: Record<string, number> = {};
      records.forEach(r => {
        peerTotals[r.name] = (peerTotals[r.name] || 0) + r.amount;
      });

      const items = Object.entries(peerTotals).map(([name, val]) => ({
        label: name,
        value: formatCurrency(val)
      }));

      const listText = Object.entries(peerTotals)
        .map(([name, val]) => `• **${name}** owes you **${formatCurrency(val)}**`)
        .join('\n');

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Here is who owes you money (Total: **${formatCurrency(totalOwed)}**):\n\n${listText}\n\nYou can manage reminders or mark them settled in the **Peer Ledger** tab.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cardData: {
          type: 'metric',
          title: 'People Who Owe You',
          items
        }
      };
    }

    if (q.includes('i owe') || q.includes('payables') || q.includes('who do i owe') || q.includes('borrowed')) {
      const records = PeerService.getPeerRecords().filter(r => r.type === 'borrowed' && r.status === 'pending');
      const totalIOwe = PeerService.getIOwe();

      if (records.length === 0) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: `✅ **All clear!** You don't owe money to anyone right now.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }

      // Group by peer
      const peerTotals: Record<string, number> = {};
      records.forEach(r => {
        peerTotals[r.name] = (peerTotals[r.name] || 0) + r.amount;
      });

      const items = Object.entries(peerTotals).map(([name, val]) => ({
        label: `Owed to ${name}`,
        value: formatCurrency(val)
      }));

      const listText = Object.entries(peerTotals)
        .map(([name, val]) => `• You owe **${name}** **${formatCurrency(val)}**`)
        .join('\n');

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Here is who you owe money to (Total: **${formatCurrency(totalIOwe)}**):\n\n${listText}\n\nYou can log paybacks once settled.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cardData: {
          type: 'metric',
          title: 'My Outstanding Debts',
          items
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
