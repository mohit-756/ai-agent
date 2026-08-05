import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Bot, 
  Plus, 
  Sparkles,
  Trash2,
  Palette,
  Users,
  LogOut,
  LogIn
} from 'lucide-react';
import type { UserSession } from './AuthModal';

export type ActiveTab = 'dashboard' | 'expenses' | 'budgets' | 'ai-assistant' | 'peer-ledger';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onClearAllData: () => void;
  userSession: UserSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
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
  onClearAllData,
  userSession,
  onOpenAuth,
  onLogout,
  totalExpensesCount,
  unreadInsightsCount,
  pendingPeersCount,
  theme,
  onToggleTheme
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'expenses' as ActiveTab, label: 'Transactions', icon: Receipt, badge: totalExpensesCount },
    { id: 'peer-ledger' as ActiveTab, label: 'Friends', icon: Users, badge: pendingPeersCount > 0 ? pendingPeersCount : undefined },
    { id: 'budgets' as ActiveTab, label: 'Budgets', icon: PieChart },
    { id: 'ai-assistant' as ActiveTab, label: 'AI', icon: Bot, badge: unreadInsightsCount > 0 ? unreadInsightsCount : undefined }
  ];

  return (
    <header 
      style={{ backgroundColor: 'rgba(10, 16, 32, 0.72)' }}
      className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/[0.06] transition-all h-[72px] flex flex-col justify-center"
    >
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          
          {/* Brand Logo & Name (Left) */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
              theme === 'mono'
                ? 'bg-white text-black'
                : 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30 shadow-lg shadow-[#7C3AED]/20'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-outfit font-extrabold text-lg tracking-tight text-[#F8FAFC] group-hover:text-[#7C3AED] transition">
                SpendWise
              </span>
              <span className="text-[10px] block text-[#7C3AED] font-bold tracking-widest uppercase -mt-1">
                AI FINTECH
              </span>
            </div>
          </div>

          {/* Nav Tabs (Middle - Hidden on mobile, visible on desktop) */}
          <nav className="hidden lg:flex items-center space-x-1 bg-[#12182B]/80 p-1.5 rounded-2xl border border-white/[0.06] backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#1A2238] border border-white/[0.08] text-[#F8FAFC] shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2238]/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#7C3AED]' : 'text-[#94A3B8]'}`} />
                  <span>{item.label}</span>
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-[#7C3AED]/30 text-white' : 'bg-[#1A2238] text-[#94A3B8]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Profile & Actions (Right) */}
          <div className="flex items-center space-x-3">
            
            {/* Utility Quick Actions */}
            <div className="flex items-center space-x-1 border-r border-white/[0.06] pr-3">
              <button
                onClick={onClearAllData}
                title="Clear all expenses and memory data"
                className="p-2 rounded-xl text-[#94A3B8] hover:text-rose-400 hover:bg-[#12182B] transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleTheme}
                title="Switch color theme"
                className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#12182B] transition-all cursor-pointer"
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar with Online Status Dot */}
            {userSession && userSession.isLoggedIn ? (
              <div className="flex items-center space-x-2.5 bg-[#12182B]/90 px-3 py-1.5 rounded-2xl border border-white/[0.06]">
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30 flex items-center justify-center font-bold text-xs">
                    {userSession.name ? userSession.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                  {/* Small Online Status Dot */}
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#0B1020] absolute -bottom-0.5 -right-0.5 ring-2 ring-[#0B1020]" />
                </div>

                <span className="text-xs font-bold text-[#F8FAFC] max-w-[100px] truncate hidden sm:inline-block">
                  {userSession.name}
                </span>

                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-rose-400 transition cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-[#12182B] hover:bg-[#1A2238] border border-white/[0.06] text-[#7C3AED] text-xs font-bold transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Reduced Visual Weight Add Record Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-[#7C3AED]/15 hover:bg-[#7C3AED]/25 text-[#F8FAFC] border border-[#7C3AED]/30 hover:border-[#7C3AED]/50 transition-all duration-200 shadow-sm cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Add Record</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
