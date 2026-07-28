import { 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Clock, 
  Bot, 
  ChevronRight, 
  Tag, 
  Trash2, 
  Edit2, 
  Users 
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
import { PeerService } from '../services/peerService';

interface DashboardViewProps {
  expenses: Expense[];
  budgets: Budget[];
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onNavigateToTab: (tab: 'expenses' | 'budgets' | 'ai-assistant' | 'peer-ledger') => void;
  onViewReceipt?: (url: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#eab308', // Yellow
  'Transportation': '#3b82f6', // Blue
  'Shopping & Retail': '#ec4899', // Pink
  'Bills & Utilities': '#10b981', // Emerald
  'Entertainment': '#a855f7', // Purple
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
  onNavigateToTab,
  onViewReceipt
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
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/10 border border-slate-900 p-6 sm:p-7 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              <span>SpendWise Financial Agent</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-outfit font-bold tracking-tight text-white animate-fade-in">
              Hello Mohit 👋
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-xl leading-relaxed">
              Your AI Assistant has analyzed {monthExpenses.length} transactions for {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Everything is fully synced.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateToTab('ai-assistant')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition duration-200 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Consult AI Coach</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold flex items-center space-x-1 hover:bg-slate-100 transition duration-200 cursor-pointer"
            >
              <span>+ Log Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Spending */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm hover:border-slate-850 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-450 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today</span>
            <div className="p-2 rounded-xl bg-slate-950 text-slate-400 border border-slate-900">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-outfit text-white">
            {formatCurrency(todayTotal)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            {todayExpenses.length} logged today
          </p>
        </div>

        {/* This Month Total */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm hover:border-slate-850 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-450 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">This Month</span>
            <div className="p-2 rounded-xl bg-slate-950 text-slate-400 border border-slate-900">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-outfit text-white">
            {formatCurrency(monthTotal)}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-[10px] text-slate-500 font-medium">
              {budgetPercentage}% of {formatCurrency(totalAllocatedBudget)} budget
            </span>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm hover:border-slate-850 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-450 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining Pool</span>
            <div className="p-2 rounded-xl bg-slate-950 text-slate-400 border border-slate-900">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-outfit text-white">
            {formatCurrency(remainingBudget)}
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1 mt-2.5 overflow-hidden border border-slate-900">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-white" 
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>

        {/* Daily Average */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm hover:border-slate-850 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-450 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Average</span>
            <div className="p-2 rounded-xl bg-slate-950 text-slate-400 border border-slate-900">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-outfit text-white">
            {formatCurrency(dailyAverage)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            Calculated across {daysPassedInMonth} days
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
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category Breakdown</h3>
              <p className="text-[10px] text-slate-500">Monthly spend share</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('expenses')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center cursor-pointer"
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
                    innerRadius={58}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Spent']}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs">No records logged</div>
            )}
          </div>

          {/* Legend Strip */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-900">
            {pieChartData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center space-x-2 text-[10px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 truncate">{item.name}</span>
                <span className="text-slate-300 font-bold ml-auto">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Spending Bar Chart */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">7-Day Spending Pattern</h3>
              <p className="text-[10px] text-slate-500">Expenses over the past week</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" vertical={false} />
                <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Spent']}
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Transactions Feed & Quick AI Prompt Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Transactions</h3>
              <p className="text-[10px] text-slate-500">Latest logged records</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('expenses')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center cursor-pointer"
            >
              View All ({expenses.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {expenses.slice(0, 5).map((exp) => (
              <div 
                key={exp.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/50 hover:border-slate-800 transition duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ 
                      backgroundColor: `${CATEGORY_COLORS[exp.category] || '#64748b'}10`, 
                      color: CATEGORY_COLORS[exp.category] || '#94a3b8' 
                    }}
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-all flex items-center">
                      <span>{exp.description}</span>
                      {exp.receiptUrl && (
                        <button 
                          type="button"
                          onClick={() => onViewReceipt && onViewReceipt(exp.receiptUrl!)}
                          className="ml-2 inline-flex items-center text-[9px] text-emerald-400 hover:text-emerald-300 font-bold border border-emerald-500/20 px-1.5 py-0.5 rounded bg-emerald-500/5 transition-all cursor-pointer"
                        >
                          Bill ↗
                        </button>
                      )}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5 font-medium">
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span>{exp.paymentMethod}</span>
                      {exp.source === 'whatsapp' && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">via WhatsApp</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-bold text-xs sm:text-sm text-white">
                    {formatCurrency(exp.amount)}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-all duration-300">
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Peer Ledger & AI Assistant */}
        <div className="flex flex-col gap-6">
          {/* Peer Ledger Overview Card */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                  <Users className="w-4 h-4" />
                  <span>PEER LEDGER</span>
                </div>
                <button 
                  onClick={() => onNavigateToTab('peer-ledger')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center cursor-pointer"
                >
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Owed to Me</div>
                  <div className="text-sm font-bold font-outfit text-emerald-400 mt-0.5">
                    {formatCurrency(PeerService.getOwedToMe())}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">I Owe</div>
                  <div className="text-sm font-bold font-outfit text-amber-500 mt-0.5">
                    {formatCurrency(PeerService.getIOwe())}
                  </div>
                </div>
              </div>

              {/* Top 2 Pending Transactions */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Debts</div>
                {PeerService.getPeerRecords().filter(r => r.status === 'pending').slice(0, 2).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded bg-slate-950/20 text-[10px] border border-slate-900/40">
                    <div className="truncate pr-2">
                      <span className="font-semibold text-white">{r.name}</span>
                      <span className="text-slate-500 block truncate">{r.description}</span>
                    </div>
                    <span className={`font-bold shrink-0 ${r.type === 'lent' ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {r.type === 'lent' ? '+' : '-'}{formatCurrency(r.amount)}
                    </span>
                  </div>
                ))}
                {PeerService.getPeerRecords().filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center text-[10px] text-slate-500 py-2">No pending peer balances!</div>
                )}
              </div>
            </div>
          </div>

          {/* AI Assistant Quick Launcher Card */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold mb-2">
                <Bot className="w-4 h-4" />
                <span>AI COACHING</span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Financial Insights</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Ask your AI Agent about monthly trends, budget balances, or purchase approvals.
              </p>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => onNavigateToTab('ai-assistant')}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-900 hover:border-slate-800 text-[10px] text-slate-400 hover:text-white transition flex items-center justify-between cursor-pointer"
                >
                  <span>"How much did I spend this month?"</span>
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                </button>
                <button
                  onClick={() => onNavigateToTab('ai-assistant')}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-900 hover:border-slate-800 text-[10px] text-slate-400 hover:text-white transition flex items-center justify-between cursor-pointer"
                >
                  <span>"Can I afford a ₹3,000 purchase?"</span>
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('ai-assistant')}
              className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <span>Open AI Chat</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
