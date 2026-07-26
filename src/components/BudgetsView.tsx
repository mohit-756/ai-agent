import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Edit3, Save } from 'lucide-react';
import type { Expense, Category } from '../types/expense';
import { BudgetService } from '../services/budgetService';
import { formatCurrency } from '../services/expenseService';

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
        <h1 className="text-2xl font-bold text-white">Monthly Budgets</h1>
        <p className="text-xs text-slate-400">Set budget limits per category and track visual progress alerts</p>
      </div>

      {/* Overall Budget Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              Monthly Budget Pool Summary
            </div>
            <div className="text-3xl font-extrabold text-white">
              {formatCurrency(totalSpent)} <span className="text-base text-slate-400 font-normal">/ {formatCurrency(totalAllocated)}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              You have used {overallPercentage}% of your total budget pool for this month.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Remaining Pool</div>
              <div className="text-lg font-bold text-emerald-400">
                {formatCurrency(Math.max(0, totalAllocated - totalSpent))}
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Categories</div>
              <div className="text-lg font-bold text-white">
                {budgetStatuses.length}
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-3 mt-4 overflow-hidden p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage > 100 ? 'bg-red-500' : overallPercentage > 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
            }`}
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Category Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetStatuses.map((item) => {
          const isEditing = editingCategory === item.category;

          let badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
          let barColor = 'bg-emerald-500';
          let StatusIcon = CheckCircle2;

          if (item.status === 'exceeded') {
            badgeStyle = 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse';
            barColor = 'bg-red-500';
            StatusIcon = ShieldAlert;
          } else if (item.status === 'warning') {
            badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            barColor = 'bg-amber-500';
            StatusIcon = AlertTriangle;
          }

          return (
            <div 
              key={item.category}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`w-4 h-4 ${
                      item.status === 'exceeded' ? 'text-red-400' : item.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`} />
                    <h3 className="text-sm font-bold text-white">{item.category}</h3>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                    {item.percentage}% {item.status.toUpperCase()}
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
                        className="w-24 px-2 py-1 rounded bg-slate-950 border border-indigo-500 text-white text-xs font-bold focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(item.category)}
                        className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                      <span>Limit: <strong className="text-slate-200">{formatCurrency(item.allocated)}</strong></span>
                      <button
                        onClick={() => handleStartEdit(item.category, item.allocated)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                        title="Edit Budget Goal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Progress Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>

              {/* Status Message Footer */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
                {item.remaining >= 0 ? (
                  <span>Remaining: <strong className="text-emerald-400">{formatCurrency(item.remaining)}</strong></span>
                ) : (
                  <span className="text-red-400 font-bold">Over Budget by {formatCurrency(Math.abs(item.remaining))}</span>
                )}
                <span>Monthly Limit</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
