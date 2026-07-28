import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import type { ActiveTab } from './components/Navbar';
import { QuickAddBar } from './components/QuickAddBar';
import { ExpenseModal } from './components/ExpenseModal';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { BudgetsView } from './components/BudgetsView';
import { AIAssistantView } from './components/AIAssistantView';
import { PeerBalancesView } from './components/PeerBalancesView';
import { PeerService } from './services/peerService';
import { ExpenseService } from './services/expenseService';
import { BudgetService } from './services/budgetService';
import { AIFinanceService } from './services/aiFinanceService';
import type { Expense, Budget } from './types/expense';
import { CheckCircle2, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [pendingPeersCount, setPendingPeersCount] = useState<number>(0);
  
  // Theme state: neon (default) or mono (black & white minimalist)
  const [theme, setTheme] = useState<'neon' | 'mono'>(() => {
    return (localStorage.getItem('spendwise-theme') as 'neon' | 'mono') || 'neon';
  });

  // Sync theme to root class
  useEffect(() => {
    localStorage.setItem('spendwise-theme', theme);
    const root = document.documentElement;
    if (theme === 'mono') {
      root.classList.add('theme-mono');
    } else {
      root.classList.remove('theme-mono');
    }
  }, [theme]);

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Lightbox Preview for Receipt Image
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load initial data & Sync with Database
  useEffect(() => {
    const loadedExpenses = ExpenseService.getExpenses();
    const loadedBudgets = BudgetService.getBudgets();
    setExpenses(loadedExpenses);
    setBudgets(loadedBudgets);
    
    // Load peer ledger count
    setPendingPeersCount(PeerService.getPeerRecords().filter(r => r.status === 'pending').length);

    // Fetch from Supabase cloud database in background
    ExpenseService.syncFromCloud().then(cloudExpenses => {
      setExpenses(cloudExpenses);
    });

    PeerService.syncFromCloud().then(() => {
      setPendingPeersCount(PeerService.getPeerRecords().filter(r => r.status === 'pending').length);
    });
  }, []);

  const handleUpdatePeerMetrics = () => {
    setPendingPeersCount(PeerService.getPeerRecords().filter(r => r.status === 'pending').length);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handlers
  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp = ExpenseService.addExpense(expenseData);
    setExpenses(ExpenseService.getExpenses());
    showToast(`Added expense: "${newExp.description}" (₹${newExp.amount})`);
  };

  const handleUpdateExpense = (id: string, updated: Partial<Expense>) => {
    ExpenseService.updateExpense(id, updated);
    setExpenses(ExpenseService.getExpenses());
    showToast('Expense updated successfully');
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      ExpenseService.deleteExpense(id);
      setExpenses(ExpenseService.getExpenses());
      showToast('Expense deleted');
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all expense and peer data to original demo dataset?')) {
      const reset = ExpenseService.resetDemoData();
      setExpenses(reset);
      PeerService.resetDemoData();
      handleUpdatePeerMetrics();
      showToast('Reset to demo dataset');
    }
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleBudgetsUpdated = () => {
    setBudgets(BudgetService.getBudgets());
    showToast('Category budget updated');
  };

  const handleExpenseAddedByWhatsApp = () => {
    setExpenses(ExpenseService.getExpenses());
    handleUpdatePeerMetrics();
    showToast('Record synced via WhatsApp!');
  };

  const insightsCount = AIFinanceService.generateSpendingInsights(expenses, budgets).length;

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-neutral-800 selection:text-white transition-all duration-300 ${
      theme === 'mono' ? 'bg-black text-neutral-100' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-24 sm:bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl border text-xs font-bold shadow-2xl animate-bounce ${
          theme === 'mono' ? 'bg-neutral-900 border-white text-white' : 'bg-slate-900 border-indigo-500/40 text-white'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        onResetDemoData={handleResetDemoData}
        totalExpensesCount={expenses.length}
        unreadInsightsCount={insightsCount}
        pendingPeersCount={pendingPeersCount}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'neon' ? 'mono' : 'neon')}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-24 sm:pb-6 space-y-6">
        
        {/* Natural Language Quick-Add Bar */}
        {(activeTab === 'dashboard' || activeTab === 'expenses') && (
          <QuickAddBar onAddExpense={handleAddExpense} />
        )}

        {/* View Switcher */}
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
          <PeerBalancesView
            theme={theme}
            onUpdateMetrics={handleUpdatePeerMetrics}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            expenses={expenses}
            onBudgetsUpdated={handleBudgetsUpdated}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <AIAssistantView
            expenses={expenses}
            budgets={budgets}
            onExpenseAddedByWhatsApp={handleExpenseAddedByWhatsApp}
          />
        )}

      </main>

      {/* Add / Edit Expense Modal Dialog */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddExpense}
        onUpdate={handleUpdateExpense}
        initialExpense={editingExpense}
      />

      {/* Lightbox Modal (For viewing uploaded bills/receipts cleanly inside the app) */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="relative max-w-xl w-full bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden p-3 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Uploaded Invoice Receipt" 
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl mx-auto"
            />
            <div className="mt-3 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Scan Receipt URL Link: <a href={previewImageUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline ml-1">Open in new tab ↗</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
