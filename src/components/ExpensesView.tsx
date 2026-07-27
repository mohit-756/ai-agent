import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Plus, 
  Edit2, 
  Trash2,
  Tag
} from 'lucide-react';
import type { Expense, Category, PaymentMethod } from '../types/expense';
import { formatCurrency } from '../services/expenseService';

interface ExpensesViewProps {
  expenses: Expense[];
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onViewReceipt?: (url: string) => void;
}

const CATEGORIES: (Category | 'All')[] = [
  'All',
  'Food & Dining',
  'Transportation',
  'Shopping & Retail',
  'Bills & Utilities',
  'Entertainment',
  'Health & Wellness',
  'Travel',
  'Education',
  'Services',
  'Others'
];

const PAYMENT_METHODS: (PaymentMethod | 'All')[] = ['All', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash'];

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#eab308',
  'Transportation': '#3b82f6',
  'Shopping & Retail': '#ec4899',
  'Bills & Utilities': '#10b981',
  'Entertainment': '#a855f7',
  'Health & Wellness': '#ef4444',
  'Travel': '#06b6d4',
  'Education': '#6366f1',
  'Services': '#14b8a6',
  'Others': '#64748b'
};

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
  onViewReceipt
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Filtering Logic
  const filtered = expenses.filter(exp => {
    const matchesSearch = 
      exp.description.toLowerCase().includes(search.toLowerCase()) ||
      (exp.merchant && exp.merchant.toLowerCase().includes(search.toLowerCase())) ||
      exp.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    const matchesPayment = selectedPayment === 'All' || exp.paymentMethod === selectedPayment;

    return matchesSearch && matchesCategory && matchesPayment;
  });

  // Sorting Logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // Filtered total sum
  const totalSum = sorted.reduce((acc, e) => acc + e.amount, 0);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Description', 'Merchant', 'Category', 'Amount (INR)', 'Payment Method', 'Notes'];
    const rows = sorted.map(e => [
      e.id,
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${(e.merchant || '').replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.paymentMethod,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SpendWise_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Expense Register</h1>
          <p className="text-xs text-slate-400">View, sort, filter, and download transaction history</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-bold flex items-center space-x-1.5 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, merchant..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-900 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-900 text-slate-300 text-xs focus:outline-none focus:border-slate-800"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-900 text-slate-300 text-xs focus:outline-none focus:border-slate-800"
            >
              <option value="All">All Payment Methods</option>
              {PAYMENT_METHODS.filter(p => p !== 'All').map(pm => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-900 text-slate-300 text-xs focus:outline-none focus:border-slate-800"
            >
              <option value="date-desc">Date: Newest First</option>
              <option value="date-asc">Date: Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>

        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider pt-3 border-t border-slate-950">
          <span>Displaying <strong>{sorted.length}</strong> of <strong>{expenses.length}</strong> records</span>
          <span>Filtered Total: <strong className="text-emerald-400 font-bold">{formatCurrency(totalSum)}</strong></span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl shadow-sm overflow-hidden">
        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-950">
                <tr>
                  <th className="px-5 py-4">Transaction</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950 text-slate-300">
                {sorted.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-900/40 transition duration-150 group">
                    
                    {/* Description & Merchant */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-xs flex items-center">
                        <span>{exp.description}</span>
                        {exp.receiptUrl && (
                          <button 
                            type="button"
                            onClick={() => onViewReceipt && onViewReceipt(exp.receiptUrl!)}
                            className="ml-2 inline-flex items-center text-[9px] text-emerald-400 hover:text-emerald-300 font-bold border border-emerald-500/20 px-1.5 py-0.5 rounded bg-emerald-500/5 transition-all cursor-pointer"
                          >
                            Bill ↗
                          </button>
                        )}
                      </div>
                      {exp.merchant && <div className="text-[10px] text-slate-500 font-medium">{exp.merchant}</div>}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5">
                      <span 
                        className="px-2.5 py-1 rounded-lg font-semibold text-[10px] flex items-center w-fit space-x-1"
                        style={{ 
                          backgroundColor: `${CATEGORY_COLORS[exp.category] || '#64748b'}10`, 
                          color: CATEGORY_COLORS[exp.category] || '#94a3b8' 
                        }}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {exp.category}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 text-[10px] font-bold text-slate-400 border border-slate-900">
                        {exp.paymentMethod}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-400 font-medium">
                      {exp.date}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 text-right font-extrabold text-sm text-white">
                      {formatCurrency(exp.amount)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-950 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-950 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transaction records found matching the active filters.
          </div>
        )}
      </div>

    </div>
  );
};
