import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  BarChart3, 
  Bot, 
  Plus, 
  Sparkles,
  RotateCcw,
  IndianRupee,
  MessageSquare
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'expenses' | 'budgets' | 'analytics' | 'ai-assistant' | 'whatsapp';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onResetDemoData: () => void;
  totalExpensesCount: number;
  unreadInsightsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onResetDemoData,
  totalExpensesCount,
  unreadInsightsCount
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses' as ActiveTab, label: 'Expenses', icon: Receipt, badge: totalExpensesCount },
    { id: 'budgets' as ActiveTab, label: 'Budgets', icon: PieChart },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
    { id: 'ai-assistant' as ActiveTab, label: 'AI Assistant', icon: Bot, highlight: true, badge: unreadInsightsCount > 0 ? unreadInsightsCount : undefined },
    { id: 'whatsapp' as ActiveTab, label: 'WhatsApp Bot', icon: MessageSquare, isWhatsapp: true }
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/10">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  SpendWise
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Agent
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Smart Financial Assistant</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? item.isWhatsapp 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                      : item.isWhatsapp
                      ? 'text-emerald-400 hover:text-white hover:bg-emerald-950/40'
                      : item.highlight
                      ? 'text-indigo-300 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isWhatsapp ? 'text-emerald-400' : item.highlight ? 'text-indigo-400' : ''}`} />
                  <span>{item.label}</span>
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Currency Badge */}
            <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
              <span>INR (₹)</span>
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemoData}
              title="Reset to initial demo dataset"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Add Expense Modal Trigger */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Expense</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Tab Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
