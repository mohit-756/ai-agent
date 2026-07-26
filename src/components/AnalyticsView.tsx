import React from 'react';
import { Award } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import type { Expense, Category, PaymentMethod } from '../types/expense';
import { formatCurrency } from '../services/expenseService';

interface AnalyticsViewProps {
  expenses: Expense[];
}

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  'UPI': '#6366f1', // Indigo
  'Credit Card': '#ec4899', // Pink
  'Debit Card': '#3b82f6', // Blue
  'Net Banking': '#10b981', // Emerald
  'Cash': '#f59e0b' // Amber
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ expenses }) => {
  const totalCount = expenses.length;
  const totalSum = expenses.reduce((acc, e) => acc + e.amount, 0);
  const avgTransaction = totalCount > 0 ? Math.round(totalSum / totalCount) : 0;
  
  const largestExpense = expenses.length > 0 
    ? [...expenses].sort((a, b) => b.amount - a.amount)[0] 
    : null;

  // Category Aggregation
  const categoryTotals = new Map<Category, number>();
  expenses.forEach(e => {
    const cur = categoryTotals.get(e.category) || 0;
    categoryTotals.set(e.category, cur + e.amount);
  });

  const categoryChartData = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Payment Method Aggregation
  const paymentTotals = new Map<PaymentMethod, number>();
  expenses.forEach(e => {
    const cur = paymentTotals.get(e.paymentMethod) || 0;
    paymentTotals.set(e.paymentMethod, cur + e.amount);
  });

  const paymentChartData = Array.from(paymentTotals.entries()).map(([name, value]) => ({
    name,
    value,
    color: PAYMENT_COLORS[name] || '#94a3b8'
  }));

  // Merchant Leaderboard
  const merchantTotals = new Map<string, { count: number; total: number }>();
  expenses.forEach(e => {
    const name = e.merchant || e.description;
    const cur = merchantTotals.get(name) || { count: 0, total: 0 };
    merchantTotals.set(name, { count: cur.count + 1, total: cur.total + e.amount });
  });

  const topMerchants = Array.from(merchantTotals.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Visual Analytics & Reports</h1>
        <p className="text-xs text-slate-400">Deep-dive financial breakdown by category, payment method, and merchant</p>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Volume</div>
          <div className="text-2xl font-extrabold text-white">{formatCurrency(totalSum)}</div>
          <p className="text-xs text-slate-400 mt-1">{totalCount} total logged expenses</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Average Expense Size</div>
          <div className="text-2xl font-extrabold text-indigo-400">{formatCurrency(avgTransaction)}</div>
          <p className="text-xs text-slate-400 mt-1">Per transaction average</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Largest Single Spend</div>
          <div className="text-2xl font-extrabold text-pink-400">
            {largestExpense ? formatCurrency(largestExpense.amount) : '₹0'}
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {largestExpense ? largestExpense.description : 'N/A'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Top Payment Channel</div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {paymentChartData.length > 0 ? paymentChartData[0].name : 'N/A'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {paymentChartData.length > 0 ? formatCurrency(paymentChartData[0].value) : '₹0'}
          </p>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Ranking Horizontal Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Category Spending Comparison</h3>
            <p className="text-xs text-slate-400 mb-4">Total amount spent per category</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="category" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={110} />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Total Spent']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="amount" fill="#818cf8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Donut Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Payment Channel Share</h3>
            <p className="text-xs text-slate-400 mb-4">Distribution by payment method</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Spent']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-800">
            {paymentChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Merchant Leaderboard Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Top Merchants & Outlets</h3>
            <p className="text-xs text-slate-400">Stores where you spend the most</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {topMerchants.map((m, idx) => (
            <div key={m.name} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 mx-auto mb-2 flex items-center justify-center font-bold text-xs">
                #{idx + 1}
              </div>
              <h4 className="text-xs font-bold text-white truncate">{m.name}</h4>
              <div className="text-xs font-extrabold text-emerald-400 mt-1">{formatCurrency(m.total)}</div>
              <span className="text-[10px] text-slate-400">{m.count} order{m.count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
