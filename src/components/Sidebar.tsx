import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  PieChart, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Sparkles,
  Plus,
  LogOut,
  LogIn
} from 'lucide-react';
import type { UserSession } from './AuthModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onOpenAddModal: () => void;
  userSession: UserSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  totalExpensesCount?: number;
  unreadInsightsCount?: number;
  pendingPeersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  userSession,
  onOpenAuth,
  onLogout,
  totalExpensesCount = 0,
  unreadInsightsCount = 0,
  pendingPeersCount = 0
}) => {
  const sidebarItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'expenses', label: 'Transactions', icon: Receipt, badge: totalExpensesCount },
    { id: 'peer-ledger', label: 'Friends', icon: Users, badge: pendingPeersCount > 0 ? pendingPeersCount : undefined },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'ai-assistant', label: 'AI Coach', icon: Bot, badge: unreadInsightsCount > 0 ? unreadInsightsCount : undefined },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'analytics', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 bg-[#0B1020] border-r border-[#24304A]/50 p-4 justify-between z-30 text-[#F8FAFC]">
      
      {/* Top Brand Header & Navigation Items */}
      <div className="space-y-6">
        
        {/* SpendWise Brand Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-3 px-3 py-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-[#7C3AED]/30 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <span className="font-outfit font-extrabold text-lg text-[#F8FAFC] tracking-tight group-hover:text-[#7C3AED] transition">
              SpendWise
            </span>
            <span className="text-[10px] block text-[#7C3AED] font-bold tracking-widest uppercase -mt-1">
              AI FINTECH
            </span>
          </div>
        </div>

        {/* Quick Add Expense Action Button (Touch target >= 44px) */}
        <button
          onClick={onOpenAddModal}
          className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.97] text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-[#7C3AED]/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>New Expense</span>
        </button>

        {/* Navigation Links (Vertical Stack) */}
        <nav className="space-y-1.5 pt-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none ${
                  isActive
                    ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20 sidebar-active-indicator'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#12182B]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#1A2238] text-[#7C3AED] border border-[#24304A]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Session Profile Widget */}
      <div className="pt-4 border-t border-[#24304A]/50 space-y-3">
        {userSession ? (
          <div className="flex items-center justify-between px-2 min-h-[44px]">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30 flex items-center justify-center font-bold text-xs shrink-0">
                {userSession.email ? userSession.email.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#F8FAFC] truncate">Mohit</div>
                <div className="text-[10px] text-[#94A3B8] truncate">{userSession.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-xl text-[#94A3B8] hover:text-rose-400 hover:bg-[#12182B] transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full min-h-[44px] py-2.5 px-3 rounded-2xl bg-[#12182B] hover:bg-[#1A2238] border border-[#24304A]/50 text-[#F8FAFC] text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-[#7C3AED]" />
            <span>Sign In / Sync</span>
          </button>
        )}
      </div>

    </aside>
  );
};
