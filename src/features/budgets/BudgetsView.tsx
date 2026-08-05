import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Edit3, Save } from 'lucide-react';
import type { Expense, Category } from '../../types/expense';
import { BudgetService } from '../../services/budgetService';
import { formatCurrency } from '../../services/expenseService';

interface BudgetsViewProps {
  expenses: Expense[];
  onBudgetsUpdated: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ expenses, onBudgetsUpdated }) => {
  const budgetStatuses = BudgetService.getBudgetStatuses(expenses);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const totalAllocated = budgetStatuses.reduce((acc, b) => acc + b.allocated, 0);
  const totalSpent = budgetStatuses.reduce((acc, b) => acc + b.spent, 0);
  const overallPercentage = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const handleStartEdit = (category: Category, currentAmount: number) => {
    setEditingCategory(category);
    setEditValue(currentAmount.toString());
  };

  const handleSaveEdit = (category: Category) => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      BudgetService.updateCategoryBudget(category, parsed);
      onBudgetsUpdated();
    }
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white uppercase tracking-wider">Category Budgets</h1>
        <p className="text-xs text-slate-400">Manage monthly limits and monitor alert status</p>
      </div>

      {/* Overall Budget Overview Card */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
              Total Budget Pool
            </div>
            <div className="text-3xl font-bold font-outfit text-white">
              {formatCurrency(totalSpent)} <span className="text-sm text-slate-500 font-normal">spent of {formatCurrency(totalAllocated)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              You've utilized {overallPercentage}% of your total allocated budget limit.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-900 text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Remaining Pool</div>
              <div className="text-base font-extrabold text-emerald-400 font-outfit mt-0.5">
                {formatCurrency(Math.max(0, totalAllocated - totalSpent))}
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 mt-5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage > 100 ? 'bg-red-500' : overallPercentage > 75 ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Category Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetStatuses.map((item) => {
          const isEditing = editingCategory === item.category;

          let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10';
          let barColor = 'bg-emerald-500';
          let StatusIcon = CheckCircle2;

          if (item.status === 'exceeded') {
            badgeStyle = 'bg-red-500/10 text-red-400 border-red-500/10';
            barColor = 'bg-red-500';
            StatusIcon = ShieldAlert;
          } else if (item.status === 'warning') {
            badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/10';
            barColor = 'bg-amber-500';
            StatusIcon = AlertTriangle;
          }

          return (
            <div 
              key={item.category}
              className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm hover:border-slate-800 transition duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`w-4 h-4 ${
                      item.status === 'exceeded' ? 'text-red-400' : item.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`} />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{item.category}</h3>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeStyle}`}>
                    {item.percentage}% {item.status}
                  </span>
                </div>

                {/* Amount display or inline editor */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-400">
                    Spent: <span className="font-bold text-white">{formatCurrency(item.spent)}</span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 px-2 py-1 rounded bg-slate-950 border border-indigo-500 text-white text-xs font-bold focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(item.category)}
                        className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                      <span>Limit: <strong className="text-slate-200">{formatCurrency(item.allocated)}</strong></span>
                      <button
                        onClick={() => handleStartEdit(item.category, item.allocated)}
                        className="p-1 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-950 transition-all cursor-pointer"
                        title="Edit Budget"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Progress Bar */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>

              {/* Status Message Footer */}
              <div className="mt-3.5 pt-2 border-t border-slate-950 text-[10px] flex items-center justify-between text-slate-500 font-semibold uppercase tracking-wider">
                {item.remaining >= 0 ? (
                  <span>Remaining: <strong className="text-emerald-400">{formatCurrency(item.remaining)}</strong></span>
                ) : (
                  <span className="text-red-400 font-bold">Over Budget by {formatCurrency(Math.abs(item.remaining))}</span>
                )}
                <span>Monthly</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
