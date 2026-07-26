import React from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Clock, 
  Bot, 
  ChevronRight,
  Sparkles,
  Tag,
  Trash2,
  Edit2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';
import type { Expense, Budget, Category } from '../types/expense';
import { formatCurrency } from '../services/expenseService';
import { BudgetService } from '../services/budgetService';
import { AIInsightsCard } from './AIInsightsCard';
import { AIFinanceService } from '../services/aiFinanceService';

interface DashboardViewProps {
  expenses: Expense[];
  budgets: Budget[];
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onNavigateToTab: (tab: 'expenses' | 'budgets' | 'analytics' | 'ai-assistant') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b', // Amber
  'Transportation': '#3b82f6', // Blue
  'Shopping & Retail': '#ec4899', // Pink
  'Bills & Utilities': '#10b981', // Emerald
  'Entertainment': '#8b5cf6', // Purple
  'Health & Wellness': '#ef4444', // Red
  'Travel': '#06b6d4', // Cyan
  'Education': '#6366f1', // Indigo
  'Services': '#14b8a6', // Teal
  'Others': '#64748b' // Slate
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  budgets,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
  onNavigateToTab
}) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Today's Expenses
  const todayExpenses = expenses.filter(e => e.date === todayStr);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 2. Month's Expenses
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 3. Budget Metrics
  const totalAllocatedBudget = BudgetService.getTotalMonthlyBudget();
  const remainingBudget = Math.max(0, totalAllocatedBudget - monthTotal);
  const budgetPercentage = Math.min(100, Math.round((monthTotal / totalAllocatedBudget) * 100));

  // 4. Daily Average
  const daysPassedInMonth = Math.max(1, now.getDate());
  const dailyAverage = Math.round(monthTotal / daysPassedInMonth);

  // 5. Category Breakdown for Pie Chart
  const categoryMap = new Map<Category, number>();
  monthExpenses.forEach(e => {
    const cur = categoryMap.get(e.category) || 0;
    categoryMap.set(e.category, cur + e.amount);
  });

  const pieChartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || '#94a3b8'
  }));

  // 6. Last 7 Days Spending for Bar Chart
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayTotal = expenses
      .filter(e => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      day: dayName,
      date: dateStr,
      amount: dayTotal
    };
  });

  // Insights
  const insights = AIFinanceService.generateSpendingInsights(expenses, budgets);

  return (
    <div className="space-y-6 pb-12">

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 p-6 sm:p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>AI AGENT DASHBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hello Mohit 👋
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Here is your financial status for {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Your AI Assistant has analyzed {monthExpenses.length} transactions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigateToTab('ai-assistant')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/40 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/25 transition duration-200"
            >
              <Bot className="w-4 h-4 text-indigo-200" />
              <span>Ask AI Assistant</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-purple-500/25 transition duration-200"
            >
              <span>+ Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Spending */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Spending</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatCurrency(todayTotal)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {todayExpenses.length} transaction{todayExpenses.length !== 1 ? 's' : ''} today
          </p>
        </div>

        {/* This Month Total */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">This Month</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatCurrency(monthTotal)}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs font-medium text-slate-400">
              {budgetPercentage}% of {formatCurrency(totalAllocatedBudget)}
            </span>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Remaining Budget</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {formatCurrency(remainingBudget)}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                budgetPercentage > 90 ? 'bg-red-500' : budgetPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} 
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>

        {/* Daily Average */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Average</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatCurrency(dailyAverage)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {daysPassedInMonth} days in {now.toLocaleDateString('en-US', { month: 'short' })}
          </p>
        </div>

      </div>

      {/* AI Automated Insights Cards */}
      <AIInsightsCard 
        insights={insights} 
        onSelectCategory={() => onNavigateToTab('budgets')} 
      />

      {/* Recharts Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Pie Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Category Breakdown</h3>
              <p className="text-xs text-slate-400">Spending distribution this month</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('analytics')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center"
            >
              Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Spent']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs">No transactions recorded yet</div>
            )}
          </div>

          {/* Legend Strip */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
            {pieChartData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center space-x-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 truncate">{item.name}</span>
                <span className="text-slate-400 font-bold ml-auto">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Spending Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">7-Day Spending Pattern</h3>
              <p className="text-xs text-slate-400">Daily expenses over the last week</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Spent']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Transactions Feed & Quick AI Prompt Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Latest logged expenses</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('expenses')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center"
            >
              View All ({expenses.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {expenses.slice(0, 5).map((exp) => (
              <div 
                key={exp.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition duration-150 group"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ 
                      backgroundColor: `${CATEGORY_COLORS[exp.category] || '#64748b'}20`, 
                      color: CATEGORY_COLORS[exp.category] || '#94a3b8' 
                    }}
                  >
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                      {exp.description}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span>{exp.paymentMethod}</span>
                      <span>•</span>
                      <span>{exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-sm text-white">
                    {formatCurrency(exp.amount)}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition">
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant Quick Launcher Card */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold mb-2">
              <Bot className="w-4 h-4" />
              <span>AI AGENT ASSISTANT</span>
            </div>
            <h3 className="text-base font-bold text-white">Need Quick Financial Advice?</h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Ask your AI Agent anything about your monthly spending, budget limits, or if you can afford upcoming expenses.
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => onNavigateToTab('ai-assistant')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 hover:border-indigo-500 text-xs text-slate-200 hover:text-white transition flex items-center justify-between"
              >
                <span>"How much did I spend this month?"</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => onNavigateToTab('ai-assistant')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 hover:border-indigo-500 text-xs text-slate-200 hover:text-white transition flex items-center justify-between"
              >
                <span>"Can I afford a ₹3,000 purchase?"</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              </button>
              <button
                onClick={() => onNavigateToTab('ai-assistant')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70 hover:border-indigo-500 text-xs text-slate-200 hover:text-white transition flex items-center justify-between"
              >
                <span>"Give me budget saving tips"</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('ai-assistant')}
            className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/30"
          >
            <span>Open AI Chat Agent</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
