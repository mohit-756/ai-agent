import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  Bot, 
  BarChart3, 
  PieChart, 
  Users, 
  ArrowRight,
  Command
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddModal: (type?: 'expense' | 'income') => void;
  onNavigateToTab: (tab: 'expenses' | 'budgets' | 'ai-assistant' | 'peer-ledger' | 'reports') => void;
}

interface CommandAction {
  id: string;
  label: string;
  category: string;
  icon: React.ElementType;
  execute: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenAddModal,
  onNavigateToTab
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions: CommandAction[] = [
    {
      id: 'add-expense',
      label: 'Add Expense',
      category: 'Actions',
      icon: Plus,
      execute: () => {
        onOpenAddModal('expense');
        onClose();
      }
    },
    {
      id: 'add-income',
      label: 'Add Income',
      category: 'Actions',
      icon: TrendingUp,
      execute: () => {
        onOpenAddModal('income');
        onClose();
      }
    },
    {
      id: 'ask-ai',
      label: 'Ask AI Assistant',
      category: 'AI Engine',
      icon: Bot,
      execute: () => {
        onNavigateToTab('ai-assistant');
        onClose();
      }
    },
    {
      id: 'open-reports',
      label: 'Open Reports & Analytics',
      category: 'Navigation',
      icon: BarChart3,
      execute: () => {
        onNavigateToTab('reports');
        onClose();
      }
    },
    {
      id: 'open-budgets',
      label: 'Open Budgets',
      category: 'Navigation',
      icon: PieChart,
      execute: () => {
        onNavigateToTab('budgets');
        onClose();
      }
    },
    {
      id: 'open-peer-ledger',
      label: 'Open Peer Ledger',
      category: 'Navigation',
      icon: Users,
      execute: () => {
        onNavigateToTab('peer-ledger');
        onClose();
      }
    }
  ];

  const filteredActions = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].execute();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#0B1020]/80 backdrop-blur-xl p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-xl w-full bg-[#12182B] border border-[#7C3AED]/30 rounded-[24px] shadow-[0_0_50px_rgba(124,58,237,0.2)] overflow-hidden animate-scale-up text-[#F8FAFC]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center px-5 py-4 border-b border-[#24304A]">
          <Search className="w-5 h-5 text-[#7C3AED] mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action... (e.g. Add expense)"
            className="w-full bg-transparent text-[#F8FAFC] text-sm placeholder-[#94A3B8] focus:outline-none font-medium"
          />
          <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#0B1020] border border-[#24304A] text-[10px] text-[#94A3B8] font-bold">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Action List */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#94A3B8]">
              No commands found matching "{query}"
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={action.id}
                  onClick={action.execute}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25' 
                      : 'text-[#CBD5E1] hover:bg-[#1A2238] hover:text-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl border ${
                      isSelected 
                        ? 'bg-white/20 border-white/30 text-white' 
                        : 'bg-[#0B1020] border-[#24304A] text-[#7C3AED]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{action.label}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#0B1020] text-[#94A3B8]'
                    }`}>
                      {action.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#0B1020]/80 border-t border-[#24304A] text-[11px] text-[#94A3B8]">
          <div className="flex items-center space-x-3">
            <span><kbd className="bg-[#1A2238] px-1.5 py-0.5 rounded text-[10px] text-[#F8FAFC]">↑</kbd> <kbd className="bg-[#1A2238] px-1.5 py-0.5 rounded text-[10px] text-[#F8FAFC]">↓</kbd> to navigate</span>
            <span><kbd className="bg-[#1A2238] px-1.5 py-0.5 rounded text-[10px] text-[#F8FAFC]">↵</kbd> to execute</span>
          </div>
          <span><kbd className="bg-[#1A2238] px-1.5 py-0.5 rounded text-[10px] text-[#F8FAFC]">esc</kbd> to close</span>
        </div>

      </div>
    </div>
  );
};
