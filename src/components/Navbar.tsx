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
    { id: 'ai-assistant' as ActiveTab, label: 'AI Coach', icon: Bot, highlight: true, badge: unreadInsightsCount > 0 ? unreadInsightsCount : undefined },
    { id: 'whatsapp' as ActiveTab, label: 'WhatsApp Bot', icon: MessageSquare, isWhatsapp: true }
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-outfit font-black text-xl tracking-tight text-white">
                  SpendWise
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Autonomous Financial Agent</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-900">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                    isActive
                      ? item.isWhatsapp 
                        ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-white text-slate-950 shadow-md shadow-white/5'
                      : item.isWhatsapp
                      ? 'text-emerald-400 hover:text-white hover:bg-emerald-950/20'
                      : item.highlight
                      ? 'text-indigo-400 hover:text-white hover:bg-slate-900'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-indigo-500/20 text-indigo-300'
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
            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemoData}
              title="Reset to initial demo dataset"
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-900/80 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Add Expense Modal Trigger */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold tracking-wide text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Record</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Tab Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950/90 backdrop-blur-md px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl text-xs font-semibold transition ${
                isActive 
                  ? item.isWhatsapp
                    ? 'text-emerald-400'
                    : 'text-indigo-400 font-bold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[9px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
