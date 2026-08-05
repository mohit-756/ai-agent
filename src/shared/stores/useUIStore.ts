import { create } from 'zustand';

export type ActiveTab = 'dashboard' | 'expenses' | 'budgets' | 'peers' | 'analytics' | 'assistant' | 'whatsapp';

interface UIState {
  activeTab: ActiveTab;
  selectedMonth: string; // YYYY-MM
  isAddExpenseModalOpen: boolean;
  isAuthModalOpen: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedMonth: (month: string) => void;
  setAddExpenseModalOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
}

const currentMonth = new Date().toISOString().substring(0, 7);

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'dashboard',
  selectedMonth: currentMonth,
  isAddExpenseModalOpen: false,
  isAuthModalOpen: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setAddExpenseModalOpen: (isAddExpenseModalOpen) => set({ isAddExpenseModalOpen }),
  setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
}));
