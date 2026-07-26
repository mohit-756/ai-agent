import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import type { ActiveTab } from './components/Navbar';
import { QuickAddBar } from './components/QuickAddBar';
import { ExpenseModal } from './components/ExpenseModal';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { BudgetsView } from './components/BudgetsView';
import { AnalyticsView } from './components/AnalyticsView';
import { AIAssistantView } from './components/AIAssistantView';
import { WhatsAppHubView } from './components/WhatsAppHubView';
import { ExpenseService } from './services/expenseService';
import { BudgetService } from './services/budgetService';
import { AIFinanceService } from './services/aiFinanceService';
import type { Expense, Budget } from './types/expense';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load initial data & Sync with Database
  useEffect(() => {
    const loadedExpenses = ExpenseService.getExpenses();
    const loadedBudgets = BudgetService.getBudgets();
    setExpenses(loadedExpenses);
    setBudgets(loadedBudgets);

    // Fetch from Supabase cloud database in background
    ExpenseService.syncFromCloud().then(cloudExpenses => {
      setExpenses(cloudExpenses);
    });
  }, []);

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
    if (window.confirm('Reset all expense data to original demo dataset?')) {
      const reset = ExpenseService.resetDemoData();
      setExpenses(reset);
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
    showToast('Expense logged via WhatsApp!');
  };

  const insightsCount = AIFinanceService.generateSpendingInsights(expenses, budgets).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-900 border border-indigo-500/40 text-white text-xs font-bold shadow-2xl animate-bounce">
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
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Natural Language Quick-Add Bar (Always visible at top of Dashboard & Expenses tabs) */}
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
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            onOpenAddModal={handleOpenAddModal}
            onEditExpense={handleOpenEditModal}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            expenses={expenses}
            onBudgetsUpdated={handleBudgetsUpdated}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView expenses={expenses} />
        )}

        {activeTab === 'ai-assistant' && (
          <AIAssistantView
            expenses={expenses}
            budgets={budgets}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppHubView
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

    </div>
  );
}

export default App;
