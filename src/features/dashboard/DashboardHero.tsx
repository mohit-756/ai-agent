import React from 'react';
import { 
  Sparkles, 
  Bot, 
  Plus, 
  Wallet, 
  PieChart, 
  ShieldCheck 
} from 'lucide-react';
import { formatCurrency } from '../../services/expenseService';

interface DashboardHeroProps {
  underBudgetAmount?: number;
  netCashFlow?: number;
  budgetUsedPct?: number;
  aiHealthScore?: number;
  onOpenAddModal: () => void;
  onNavigateToTab: (tab: 'expenses' | 'budgets' | 'ai-assistant' | 'peer-ledger') => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  underBudgetAmount = 4200,
  netCashFlow = 24800,
  budgetUsedPct = 58,
  aiHealthScore = 94,
  onOpenAddModal,
  onNavigateToTab
}) => {
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#0B1020] via-[#12182B] to-[#1E1B4B] border border-white/[0.08] p-6 sm:p-8 shadow-2xl transition-all duration-300">
      
      {/* Subtle Radial Glow behind Hero */}
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#7C3AED]/15 blur-3xl pointer-events-none" />
      <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        
        {/* Left Column: Greeting & AI Subtitle */}
        <div className="space-y-3 flex-1">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#7C3AED] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Native Financial Agent</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-outfit font-extrabold tracking-tight text-[#F8FAFC]">
            Good morning, Mohit 👋
          </h1>

          <p className="text-[#CBD5E1] text-sm sm:text-base max-w-xl font-medium leading-relaxed">
            You’re <span className="text-emerald-400 font-bold">₹{underBudgetAmount.toLocaleString('en-IN')} under budget</span> this month. Your AI agent has optimized 3 upcoming recurring splits.
          </p>
        </div>

        {/* Right Column: KPI Stack (16px glass cards) + Action Buttons Below */}
        <div className="space-y-4 shrink-0 w-full lg:w-auto">
          
          {/* Small KPI Stack (3 Glass Cards with 16px radius) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* KPI Card 1: Net Cash Flow */}
            <div className="bg-[#12182B]/60 backdrop-blur-md border border-white/[0.08] rounded-[16px] p-3.5 shadow-sm space-y-1 hover:border-[#10B981]/40 transition">
              <div className="flex items-center justify-between space-x-2 text-[#94A3B8]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Net Cash Flow</span>
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-extrabold font-outfit text-emerald-400">
                +{formatCurrency(netCashFlow)}
              </div>
            </div>

            {/* KPI Card 2: Budget Used */}
            <div className="bg-[#12182B]/60 backdrop-blur-md border border-white/[0.08] rounded-[16px] p-3.5 shadow-sm space-y-1 hover:border-[#3B82F6]/40 transition">
              <div className="flex items-center justify-between space-x-2 text-[#94A3B8]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Budget Used</span>
                <PieChart className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-base font-extrabold font-outfit text-[#F8FAFC]">
                {budgetUsedPct}%
              </div>
            </div>

            {/* KPI Card 3: AI Health Score */}
            <div className="bg-[#12182B]/60 backdrop-blur-md border border-white/[0.08] rounded-[16px] p-3.5 shadow-sm space-y-1 hover:border-[#7C3AED]/40 transition">
              <div className="flex items-center justify-between space-x-2 text-[#94A3B8]">
                <span className="text-[10px] font-bold uppercase tracking-wider">AI Health</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
              </div>
              <div className="text-base font-extrabold font-outfit text-[#7C3AED]">
                {aiHealthScore} <span className="text-[10px] text-[#94A3B8]">/ 100</span>
              </div>
            </div>

          </div>

          {/* Action Buttons Below the KPI Stack */}
          <div className="flex items-center space-x-3 justify-end">
            <button
              onClick={() => onNavigateToTab('ai-assistant')}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-[#7C3AED]/30 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-[#12182B]/80 hover:bg-[#1A2238] backdrop-blur-md active:scale-[0.98] border border-white/[0.08] text-[#F8FAFC] text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#7C3AED]" />
              <span>Add Expense</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
