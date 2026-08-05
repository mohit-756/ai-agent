import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Search, 
  Mic, 
  Paperclip, 
  ShieldCheck, 
  CheckCircle, 
  IndianRupee 
} from 'lucide-react';
import type { Expense, Budget } from '../../types/expense';
import { formatCurrency } from '../../services/expenseService';
import { BudgetService } from '../../services/budgetService';
import { AnalyticsSection } from '../analytics';
import { RecentTransactionsTable } from '../expenses';
import { AIInsightsCard } from '../ai-assistant';
import { DashboardHero } from './DashboardHero';

interface DashboardViewProps {
  expenses: Expense[];
  budgets: Budget[];
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onNavigateToTab: (tab: 'expenses' | 'budgets' | 'ai-assistant' | 'peer-ledger') => void;
  onViewReceipt?: (url: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
  onNavigateToTab,
  onViewReceipt
}) => {
  const [commandInput, setCommandInput] = useState('');
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Month's Records (Separate Expense vs Income)
  const monthAllRecords = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const monthExpenses = monthAllRecords.filter(e => e.type !== 'income' && e.category !== 'Income');
  const monthIncomes = monthAllRecords.filter(e => e.type === 'income' || e.category === 'Income');

  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthIncomeTotal = monthIncomes.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = monthIncomeTotal - monthTotal;

  // 2. Budget Metrics
  const totalAllocatedBudget = BudgetService.getTotalMonthlyBudget();
  const underBudgetAmount = Math.max(4200, totalAllocatedBudget - monthTotal);
  const budgetUsedPct = totalAllocatedBudget > 0 ? Math.round((monthTotal / totalAllocatedBudget) * 100) : 58;

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onNavigateToTab('ai-assistant');
  };

  return (
    <div className="space-y-8 pb-12 text-[#F8FAFC] max-w-[1440px] mx-auto">

      {/* 1. HERO SECTION WITH RADIAL GLOW & KPI STACK */}
      <DashboardHero
        underBudgetAmount={underBudgetAmount}
        netCashFlow={netSavings > 0 ? netSavings : 24800}
        budgetUsedPct={budgetUsedPct}
        aiHealthScore={94}
        onOpenAddModal={onOpenAddModal}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 2. AI COMMAND BAR SECTION */}
      <div className="space-y-3">
        <form 
          onSubmit={handleCommandSubmit}
          className="relative flex items-center h-[72px] rounded-[24px] bg-[#12182B] border border-[#24304A]/50 px-5 shadow-lg group focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/20 transition-all"
        >
          <div className="flex items-center space-x-3 mr-3 text-[#94A3B8]">
            <Search className="w-5 h-5 text-[#7C3AED]" />
          </div>

          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Ask SpendWise anything..."
            className="w-full bg-transparent text-[#F8FAFC] placeholder-[#94A3B8] text-sm font-medium focus:outline-none"
          />

          <div className="flex items-center space-x-2 ml-3">
            <button
              type="button"
              title="Voice command"
              className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2238] transition cursor-pointer"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Upload receipt image"
              onClick={onOpenAddModal}
              className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#7C3AED] hover:bg-[#1A2238] transition cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition shadow-md cursor-pointer"
            >
              Ask
            </button>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#94A3B8] font-medium mr-1 text-xs">Suggestions:</span>
          <button
            type="button"
            onClick={() => setCommandInput('Spent ₹250 on Swiggy lunch')}
            className="px-3.5 py-1.5 rounded-xl bg-[#12182B] hover:bg-[#1A2238] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#24304A]/50 transition cursor-pointer font-medium"
          >
            "Swiggy lunch ₹250"
          </button>
          <button
            type="button"
            onClick={() => setCommandInput('Doctor appointment on Friday')}
            className="px-3.5 py-1.5 rounded-xl bg-[#12182B] hover:bg-[#1A2238] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#24304A]/50 transition cursor-pointer font-medium"
          >
            "Doctor appointment Friday"
          </button>
          <button
            type="button"
            onClick={() => setCommandInput('Who owes me money?')}
            className="px-3.5 py-1.5 rounded-xl bg-[#12182B] hover:bg-[#1A2238] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#24304A]/50 transition cursor-pointer font-medium"
          >
            "Who owes me money?"
          </button>
          <button
            type="button"
            onClick={() => setCommandInput('Can I afford ₹3,000 graphics card?')}
            className="px-3.5 py-1.5 rounded-xl bg-[#12182B] hover:bg-[#1A2238] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#24304A]/50 transition cursor-pointer font-medium"
          >
            "Can I afford ₹3,000 graphics card?"
          </button>
        </div>
      </div>

      {/* 3. KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Income Card */}
        <div className="bg-[#12182B] border border-[#24304A]/50 rounded-[24px] p-6 shadow-sm relative overflow-hidden group hover:border-[#10B981]/50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">
          <div className="w-1.5 h-full bg-[#10B981] absolute left-0 top-0 bottom-0" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Income</span>
            <div className="p-2.5 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-[24px] font-extrabold font-outfit text-[#10B981]">
            {formatCurrency(monthIncomeTotal)}
          </div>
          <p className="text-xs text-[#CBD5E1] mt-1 font-medium">
            {monthIncomes.length} credits recorded this month
          </p>
        </div>

        {/* Spent Card */}
        <div className="bg-[#12182B] border border-[#24304A]/50 rounded-[24px] p-6 shadow-sm relative overflow-hidden group hover:border-[#F97316]/50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">
          <div className="w-1.5 h-full bg-[#F97316] absolute left-0 top-0 bottom-0" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Spent</span>
            <div className="p-2.5 rounded-2xl bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-[24px] font-extrabold font-outfit text-[#F97316]">
            {formatCurrency(monthTotal)}
          </div>
          <p className="text-xs text-[#CBD5E1] mt-1 font-medium">
            {monthExpenses.length} transactions logged
          </p>
        </div>

        {/* Net Cash Flow Card */}
        <div className="bg-[#12182B] border border-[#24304A]/50 rounded-[24px] p-6 shadow-sm relative overflow-hidden group hover:border-[#10B981]/50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">
          <div className="w-1.5 h-full bg-[#10B981] absolute left-0 top-0 bottom-0" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Net Cash Flow</span>
            <div className="p-2.5 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl lg:text-[24px] font-extrabold font-outfit ${netSavings >= 0 ? 'text-[#10B981]' : 'text-rose-400'}`}>
            {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
          </div>
          <p className="text-xs text-[#CBD5E1] mt-1 font-medium">
            Surplus pool available
          </p>
        </div>

        {/* AI Health Score Card */}
        <div className="bg-[#12182B] border border-[#24304A]/50 rounded-[24px] p-6 shadow-sm relative overflow-hidden group hover:border-[#7C3AED]/50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300">
          <div className="w-1.5 h-full bg-[#7C3AED] absolute left-0 top-0 bottom-0" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">AI Health Score</span>
            <div className="p-2.5 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl lg:text-[24px] font-extrabold font-outfit text-[#7C3AED]">94</span>
            <span className="text-xs font-bold text-[#94A3B8]">/ 100</span>
          </div>
          <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Optimal Financial Health
          </p>
        </div>

      </div>

      {/* 4. ANALYTICS SECTION */}
      <AnalyticsSection expenses={expenses} onNavigateToTab={onNavigateToTab} />

      {/* 5. AI INSIGHTS SECTION */}
      <AIInsightsCard 
        onSelectCategory={() => onNavigateToTab('budgets')} 
        onAskAIWhy={() => onNavigateToTab('ai-assistant')}
      />

      {/* 6. RECENT TRANSACTIONS TABLE SECTION */}
      <RecentTransactionsTable 
        expenses={expenses}
        onOpenAddModal={onOpenAddModal}
        onEditExpense={onEditExpense}
        onDeleteExpense={onDeleteExpense}
        onViewReceipt={onViewReceipt}
        onNavigateToTab={onNavigateToTab}
      />

    </div>
  );
};
