import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Plus, 
  Edit2, 
  Trash2
} from 'lucide-react';
import type { Expense, Category, PaymentMethod } from '../types/expense';
import { formatCurrency } from '../services/expenseService';

interface ExpensesViewProps {
  expenses: Expense[];
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
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

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense
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
          <h1 className="text-2xl font-bold text-white">Expense Records</h1>
          <p className="text-xs text-slate-400">View, search, filter, and export all recorded transactions</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, merchant..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>

        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>Showing <strong>{sorted.length}</strong> of <strong>{expenses.length}</strong> transactions</span>
          <span className="text-white font-bold">Total Filtered: <span className="text-emerald-400">{formatCurrency(totalSum)}</span></span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Transaction</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sorted.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                    
                    {/* Description & Merchant */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-xs">{exp.description}</div>
                      {exp.merchant && <div className="text-[11px] text-slate-400">{exp.merchant}</div>}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                        {exp.category}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {exp.paymentMethod}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-400">
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                          title="Delete Expense"
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
            No expenses found matching the current search filters.
          </div>
        )}
      </div>

    </div>
  );
};
