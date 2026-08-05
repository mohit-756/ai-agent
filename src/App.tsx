import { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { QuickAddBar } from './features/expenses/QuickAddBar';
import { ExpenseModal } from './features/expenses/ExpenseModal';
import { DashboardView } from './features/dashboard/DashboardView';
import { ExpensesView } from './features/expenses/ExpensesView';
import { AnalyticsSection } from './features/analytics';
import { AuthModal } from './components/AuthModal';
import type { UserSession } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';

const BudgetsView = lazy(() => import('./features/budgets').then(m => ({ default: m.BudgetsView })));
const AIAssistantView = lazy(() => import('./features/ai-assistant').then(m => ({ default: m.AIAssistantView })));
const PeerBalancesView = lazy(() => import('./features/peers').then(m => ({ default: m.PeerBalancesView })));

import { PeerService } from './services/peerService';
import { ExpenseService } from './services/expenseService';
import { BudgetService } from './services/budgetService';
import { MemoryService } from './services/memoryService';
import { AIFinanceService } from './services/aiFinanceService';
import type { Expense, Budget } from './types/expense';
import { CheckCircle2, X, Settings as SettingsIcon, Shield, Trash2, Palette } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<any>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [pendingPeersCount, setPendingPeersCount] = useState<number>(0);

  // User Auth State
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem('spendwise_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !userSession);

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<'neon' | 'mono'>('neon');

  // Insights Counter
  const insightsCount = AIFinanceService.generateSpendingInsights(expenses, budgets).length;

  useEffect(() => {
    // Initial data load
    loadAllData();

    // Global Ctrl+K / Cmd+K Command Palette Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadAllData = () => {
    const allExpenses = ExpenseService.getExpenses();
    const allBudgets = BudgetService.getBudgets();
    setExpenses(allExpenses);
    setBudgets(allBudgets);

    // Load initial peer pending count
    const peers = PeerService.getPeerRecords();
    const pendingCount = peers.filter((p: any) => p.amount !== 0).length;
    setPendingPeersCount(pendingCount);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const created = ExpenseService.addExpense(expenseData);
    setExpenses(prev => [created, ...prev]);
    showToast(`Added "${created.description}" (${created.category})`);
  };

  const handleUpdateExpense = (id: string, updatedData: Partial<Expense>) => {
    const updated = ExpenseService.updateExpense(id, updatedData);
    if (updated) {
      setExpenses(prev => prev.map(e => e.id === id ? updated : e));
      showToast(`Updated transaction "${updated.description}"`);
    }
  };

  const handleDeleteExpense = (id: string) => {
    ExpenseService.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Transaction removed');
  };

  const handleBudgetsUpdated = () => {
    setBudgets(BudgetService.getBudgets());
  };

  const handleUpdatePeerMetrics = () => {
    const peers = PeerService.getPeerRecords();
    const pendingCount = peers.filter((p: any) => p.amount !== 0).length;
    setPendingPeersCount(pendingCount);
  };

  const handleExpenseAddedByWhatsApp = () => {
    const reloaded = ExpenseService.getExpenses();
    setExpenses(reloaded);
    showToast('Updated expenses from WhatsApp AI log');
  };

  const handleClearAllData = () => {
    if (window.confirm('Clear all local finance records? This cannot be undone.')) {
      ExpenseService.clearAllExpenses();
      MemoryService.clearAllData();
      setExpenses([]);
      showToast('All transaction records cleared');
    }
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    localStorage.setItem('spendwise_user_session', JSON.stringify(session));
    setIsAuthModalOpen(false);
    showToast(`Logged in as ${session.email}`);
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('spendwise_user_session');
    showToast('Logged out');
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC] flex flex-col md:flex-row font-sans selection:bg-[#7C3AED] selection:text-white">
      
      {/* 1. DESKTOP LEFT SIDEBAR NAVIGATION (Width: 240px) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        userSession={userSession}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        totalExpensesCount={expenses.length}
        unreadInsightsCount={insightsCount}
        pendingPeersCount={pendingPeersCount}
      />

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile Top Header Navigation (Visible only on screens below 1024px lg:hidden) */}
        <div className="lg:hidden">
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAddModal={handleOpenAddModal}
            onClearAllData={handleClearAllData}
            userSession={userSession}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            totalExpensesCount={expenses.length}
            unreadInsightsCount={insightsCount}
            pendingPeersCount={pendingPeersCount}
            theme={theme}
            onToggleTheme={() => setTheme(prev => prev === 'neon' ? 'mono' : 'neon')}
          />
        </div>

        {/* Toast Notification Popup Banner */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-[#7C3AED] text-white text-xs font-bold shadow-2xl shadow-[#7C3AED]/40 border border-white/20 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Area Container with Ample Breathing Room */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Natural Language Quick-Add Command Bar */}
          {(activeTab === 'dashboard' || activeTab === 'expenses') && (
            <QuickAddBar onAddExpense={handleAddExpense} />
          )}

          {/* Tab View Switcher */}
          {activeTab === 'dashboard' && (
            <DashboardView
              expenses={expenses}
              budgets={budgets}
              onOpenAddModal={handleOpenAddModal}
              onEditExpense={handleOpenEditModal}
              onDeleteExpense={handleDeleteExpense}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onViewReceipt={(url) => setPreviewImageUrl(url)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              onOpenAddModal={handleOpenAddModal}
              onEditExpense={handleOpenEditModal}
              onDeleteExpense={handleDeleteExpense}
              onViewReceipt={(url) => setPreviewImageUrl(url)}
            />
          )}

          {activeTab === 'peer-ledger' && (
            <Suspense fallback={<div className="p-8 text-center text-xs text-[#94A3B8] font-semibold animate-pulse">Loading Friends Ledger...</div>}>
              <PeerBalancesView
                theme={theme}
                onUpdateMetrics={handleUpdatePeerMetrics}
              />
            </Suspense>
          )}

          {activeTab === 'budgets' && (
            <Suspense fallback={<div className="p-8 text-center text-xs text-[#94A3B8] font-semibold animate-pulse">Loading Category Budgets...</div>}>
              <BudgetsView
                expenses={expenses}
                onBudgetsUpdated={handleBudgetsUpdated}
              />
            </Suspense>
          )}

          {(activeTab === 'ai-assistant' || activeTab === 'whatsapp') && (
            <Suspense fallback={<div className="p-8 text-center text-xs text-[#94A3B8] font-semibold animate-pulse">Loading AI Assistant...</div>}>
              <AIAssistantView
                expenses={expenses}
                budgets={budgets}
                onExpenseAddedByWhatsApp={handleExpenseAddedByWhatsApp}
              />
            </Suspense>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsSection 
              expenses={expenses} 
              onNavigateToTab={(tab) => setActiveTab(tab)} 
            />
          )}

          {activeTab === 'settings' && (
            <div className="bg-[#12182B] border border-[#24304A]/50 rounded-[24px] p-8 shadow-md space-y-6 text-[#F8FAFC]">
              <div className="flex items-center space-x-3 pb-4 border-b border-[#24304A]/50">
                <div className="p-3 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#F8FAFC]">Application Settings</h2>
                  <p className="text-xs text-[#94A3B8]">Manage account security, theme preferences, and local data storage</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Theme Preference */}
                <div className="bg-[#0B1020]/60 border border-[#24304A]/50 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center space-x-2 text-[#7C3AED]">
                    <Palette className="w-5 h-5" />
                    <h3 className="text-sm font-bold text-[#F8FAFC]">Theme Customization</h3>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Toggle between Neon AI Dark Mode and Monochrome Dark Mode.
                  </p>
                  <button
                    onClick={() => setTheme(prev => prev === 'neon' ? 'mono' : 'neon')}
                    className="px-4 py-2.5 rounded-xl bg-[#1A2238] hover:bg-[#24304A] text-[#F8FAFC] text-xs font-bold border border-[#24304A]/50 transition cursor-pointer"
                  >
                    Current Mode: <span className="text-[#7C3AED] uppercase ml-1">{theme}</span>
                  </button>
                </div>

                {/* Database & RLS Security */}
                <div className="bg-[#0B1020]/60 border border-[#24304A]/50 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Shield className="w-5 h-5" />
                    <h3 className="text-sm font-bold text-[#F8FAFC]">Row Level Security (RLS)</h3>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Supabase PostgreSQL audit table security active with user-level isolation.
                  </p>
                  <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 inline-block">
                    ✓ RLS Policy Enforced
                  </div>
                </div>

              </div>

              {/* Data Reset Danger Zone */}
              <div className="pt-6 border-t border-[#24304A]/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-rose-400">Danger Zone</h4>
                  <p className="text-xs text-[#94A3B8]">Clear all local IndexedDB and localStorage finance records.</p>
                </div>
                <button
                  onClick={handleClearAllData}
                  className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Local Data</span>
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Login & Auth Dialog Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Add / Edit Expense Modal Dialog */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddExpense}
        onUpdate={handleUpdateExpense}
        initialExpense={editingExpense}
      />

      {/* Global Linear/Notion Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenAddModal={() => handleOpenAddModal()}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* Lightbox Modal for Receipt Viewing */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="relative max-w-xl w-full bg-[#12182B] border border-[#24304A] rounded-3xl overflow-hidden p-4 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl bg-[#0B1020] hover:bg-[#1A2238] text-[#94A3B8] hover:text-white flex items-center justify-center transition border border-[#24304A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Uploaded Invoice Receipt" 
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl mx-auto"
            />
            <div className="mt-3 text-center text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
              Scan Receipt URL Link: <a href={previewImageUrl} target="_blank" rel="noreferrer" className="text-[#7C3AED] hover:underline ml-1">Open in new tab ↗</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
