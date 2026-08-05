import React, { useState } from 'react';
import { 
  Receipt, 
  Edit2, 
  Trash2, 
  Plus, 
  ChevronRight,
  ChevronLeft,
  ArrowDownLeft,
  Store
} from 'lucide-react';
import type { Expense } from '../../types/expense';
import { formatCurrency } from '../../services/expenseService';

interface RecentTransactionsTableProps {
  expenses: Expense[];
  onOpenAddModal?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (id: string) => void;
  onViewReceipt?: (url: string) => void;
  onNavigateToTab?: (tab: 'expenses' | 'budgets' | 'ai-assistant' | 'peer-ledger') => void;
}

const CATEGORY_BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  'Food & Dining': { bg: 'bg-amber-500/10', border: 'border-amber-500/25', text: 'text-amber-400' },
  'Transportation': { bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-400' },
  'Shopping & Retail': { bg: 'bg-pink-500/10', border: 'border-pink-500/25', text: 'text-pink-400' },
  'Bills & Utilities': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400' },
  'Entertainment': { bg: 'bg-purple-500/10', border: 'border-purple-500/25', text: 'text-[#7C3AED]' },
  'Health & Wellness': { bg: 'bg-rose-500/10', border: 'border-rose-500/25', text: 'text-rose-400' },
  'Travel': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', text: 'text-cyan-400' },
  'Education': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', text: 'text-indigo-400' },
  'Services': { bg: 'bg-teal-500/10', border: 'border-teal-500/25', text: 'text-teal-400' },
  'Income': { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  'Others': { bg: 'bg-slate-500/10', border: 'border-slate-500/25', text: 'text-slate-400' }
};

export const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({
  expenses = [],
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
  onViewReceipt,
  onNavigateToTab
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const totalPages = Math.ceil(expenses.length / pageSize) || 1;
  const currentExpenses = expenses.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalFilteredAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const hasTransactions = expenses.length > 0;

  return (
    <div className="bg-[#12182B] border border-white/[0.08] rounded-[24px] p-6 shadow-md space-y-4 text-[#F8FAFC] my-8">
      
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#F8FAFC] tracking-wide uppercase">
            Expense Register
          </h3>
          <p className="text-xs text-[#94A3B8]">View, sort, filter, and analyze transaction history</p>
        </div>

        {onNavigateToTab && hasTransactions && (
          <button 
            onClick={() => onNavigateToTab('expenses')}
            className="text-xs text-[#7C3AED] hover:underline font-semibold flex items-center cursor-pointer"
          >
            View All ({expenses.length}) <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        )}
      </div>

      {/* Empty State */}
      {!hasTransactions ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-[#0B1020]/60 border border-[#24304A]/50 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1A2238] border border-[#24304A] flex items-center justify-center mx-auto text-[#7C3AED]">
            <Receipt className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#F8FAFC]">No transactions logged yet</h4>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              Start logging your daily expenses or income credits using the AI command bar or manual add form.
            </p>
          </div>
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition shadow-lg shadow-[#7C3AED]/25 cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Expense</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table Container with Sticky Blur Header & Zebra Striping */}
          <div className="hidden md:block overflow-x-auto max-h-[440px] rounded-2xl border border-white/[0.08]">
            <table className="w-full text-left text-xs border-collapse">
              
              {/* Sticky Header with Backdrop Blur */}
              <thead className="sticky top-0 bg-[#12182B]/95 backdrop-blur-md z-10 border-b border-white/[0.08] text-[#94A3B8] font-bold uppercase text-[10px] tracking-wider shadow-sm">
                <tr>
                  <th className="py-3 px-4">Merchant / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  {(onEditExpense || onDeleteExpense) && (
                    <th className="py-3 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>

              {/* Body with Subtle Zebra Striping (~64px row height) */}
              <tbody className="divide-y divide-[#24304A]/40">
                {currentExpenses.map((exp) => {
                  const isIncome = exp.type === 'income' || exp.category === 'Income';
                  const badge = CATEGORY_BADGE_STYLES[exp.category] || CATEGORY_BADGE_STYLES['Others'];
                  const titleName = exp.merchant || exp.description;
                  const initial = titleName.charAt(0).toUpperCase();

                  return (
                    <tr 
                      key={exp.id} 
                      className="h-[64px] even:bg-[#0B1020]/40 odd:bg-[#12182B]/60 hover:bg-[#1A2238]/80 transition duration-150 group cursor-pointer"
                    >
                      {/* Merchant Avatar & Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {/* Small Merchant Avatar */}
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                            isIncome 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-[#1A2238] border-[#24304A] text-[#7C3AED]'
                          }`}>
                            {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : initial}
                          </div>
                          <div>
                            <div className="font-bold text-[#F8FAFC] group-hover:text-[#7C3AED] transition flex items-center">
                              <span>{exp.description}</span>
                              {exp.receiptUrl && (
                                <button 
                                  type="button"
                                  onClick={() => onViewReceipt && onViewReceipt(exp.receiptUrl!)}
                                  className="ml-2 text-[10px] text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer font-bold"
                                >
                                  Bill ↗
                                </button>
                              )}
                            </div>
                            {exp.merchant && (
                              <div className="text-[11px] text-[#94A3B8] font-medium flex items-center space-x-1">
                                <Store className="w-3 h-3 text-[#94A3B8]" />
                                <span>{exp.merchant}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                          {exp.category}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 text-[#94A3B8] font-medium">
                        {exp.paymentMethod}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-[#94A3B8] font-medium">
                        {exp.date}
                      </td>

                      {/* Right-Aligned Amount Column with Monospace / Tabular Numbers */}
                      <td className={`py-3 px-4 text-right font-mono tabular-nums text-sm font-extrabold ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(exp.amount)}
                      </td>

                      {/* Actions */}
                      {(onEditExpense || onDeleteExpense) && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition duration-200">
                            {onEditExpense && (
                              <button
                                onClick={() => onEditExpense(exp)}
                                title="Edit transaction"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#7C3AED] hover:bg-[#1A2238] transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteExpense && (
                              <button
                                onClick={() => onDeleteExpense(exp.id)}
                                title="Delete transaction"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-400 hover:bg-[#1A2238] transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="block md:hidden space-y-3">
            {currentExpenses.map((exp) => {
              const isIncome = exp.type === 'income' || exp.category === 'Income';
              const badge = CATEGORY_BADGE_STYLES[exp.category] || CATEGORY_BADGE_STYLES['Others'];
              const titleName = exp.merchant || exp.description;
              const initial = titleName.charAt(0).toUpperCase();

              return (
                <div 
                  key={exp.id} 
                  className="bg-[#0B1020]/90 border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-sm hover:border-[#7C3AED]/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        isIncome 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-[#1A2238] border-[#24304A] text-[#7C3AED]'
                      }`}>
                        {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : initial}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#F8FAFC] text-xs">
                          {exp.description}
                        </h4>
                        {exp.merchant && (
                          <span className="text-[10px] text-[#94A3B8]">{exp.merchant}</span>
                        )}
                      </div>
                    </div>

                    <span className={`font-mono tabular-nums text-sm font-extrabold ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(exp.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#24304A]/50 text-[10px] text-[#94A3B8]">
                    <span className={`px-2.5 py-0.5 rounded-lg font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                      {exp.category}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span>{exp.paymentMethod}</span>
                      <span>•</span>
                      <span>{exp.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/[0.08] text-xs text-[#94A3B8] gap-3">
            <div className="flex items-center space-x-4">
              <span>
                DISPLAYING <span className="font-bold text-[#F8FAFC]">{currentExpenses.length}</span> OF <span className="font-bold text-[#F8FAFC]">{expenses.length}</span> RECORDS
              </span>
              <span className="hidden sm:inline-block text-[#24304A]">|</span>
              <span className="text-emerald-400 font-bold font-mono">
                FILTERED TOTAL: {formatCurrency(totalFilteredAmount)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 rounded-xl bg-[#1A2238] border border-[#24304A] text-[#F8FAFC] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#24304A] transition cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="px-2 text-xs font-bold text-[#F8FAFC]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 rounded-xl bg-[#1A2238] border border-[#24304A] text-[#F8FAFC] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#24304A] transition cursor-pointer flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
