import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Bot, 
  Plus, 
  Sparkles,
  RotateCcw,
  Palette,
  Users
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'expenses' | 'budgets' | 'ai-assistant' | 'peer-ledger';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onResetDemoData: () => void;
  totalExpensesCount: number;
  unreadInsightsCount: number;
  pendingPeersCount: number;
  theme: 'neon' | 'mono';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onResetDemoData,
  totalExpensesCount,
  unreadInsightsCount,
  pendingPeersCount,
  theme,
  onToggleTheme
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses' as ActiveTab, label: 'Expenses', icon: Receipt, badge: totalExpensesCount },
    { id: 'peer-ledger' as ActiveTab, label: 'Peer Ledger', icon: Users, badge: pendingPeersCount > 0 ? pendingPeersCount : undefined },
    { id: 'budgets' as ActiveTab, label: 'Budgets', icon: PieChart },
    { id: 'ai-assistant' as ActiveTab, label: 'AI Coach', icon: Bot, badge: unreadInsightsCount > 0 ? unreadInsightsCount : undefined }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-900 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
              theme === 'mono'
                ? 'bg-white text-black'
                : 'bg-slate-900 text-indigo-400 border border-slate-800'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-outfit font-bold text-sm tracking-tight text-white">
              SpendWise
            </span>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/20 p-1 rounded-xl border border-slate-900">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border border-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemoData}
              title="Reset to initial demo dataset"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={`Switch to theme`}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all cursor-pointer mr-1"
            >
              <Palette className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Add Expense Modal Trigger */}
            <button
              onClick={onOpenAddModal}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                theme === 'mono'
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Tab Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-900 bg-slate-950/95 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
                isActive 
                  ? 'text-indigo-400 font-bold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
