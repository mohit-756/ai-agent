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
import type { Expense, Category, PaymentMethod } from '../../types/expense';
import { formatCurrency } from '../../services/expenseService';

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
        <h1 className="text-xl font-bold text-white uppercase tracking-wider">Reports & Analytics</h1>
        <p className="text-xs text-slate-400">Deep-dive category, channel, and store spending patterns</p>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Volume</div>
          <div className="text-2xl font-bold font-outfit text-white">{formatCurrency(totalSum)}</div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">{totalCount} recorded expenses</p>
        </div>

        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Transaction</div>
          <div className="text-2xl font-bold font-outfit text-indigo-400">{formatCurrency(avgTransaction)}</div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Mean spend per entry</p>
        </div>

        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Single Peak Spend</div>
          <div className="text-2xl font-bold font-outfit text-pink-400">
            {largestExpense ? formatCurrency(largestExpense.amount) : '₹0'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium truncate">
            {largestExpense ? largestExpense.description : 'N/A'}
          </p>
        </div>

        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Top Method</div>
          <div className="text-2xl font-bold font-outfit text-emerald-400">
            {paymentChartData.length > 0 ? paymentChartData[0].name : 'N/A'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            {paymentChartData.length > 0 ? formatCurrency(paymentChartData[0].value) : '₹0'}
          </p>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Ranking Horizontal Bar Chart */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Category Ranking</h3>
            <p className="text-[10px] text-slate-500 mb-4">Total amount spent per category</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" horizontal={false} />
                <XAxis type="number" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" stroke="#475569" tick={{ fontSize: 10 }} width={100} />
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Total Spent']}
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Donut Chart */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Payment Channels</h3>
            <p className="text-[10px] text-slate-500 mb-4">Distribution by channel type</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Spent']}
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-950">
            {paymentChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Merchant Leaderboard Card */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-4 h-4 text-amber-500" />
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Merchant Leaderboard</h3>
            <p className="text-[10px] text-slate-500">Outlets accounting for major spending</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {topMerchants.map((m, idx) => (
            <div key={m.name} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 text-center hover:border-slate-800 transition duration-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 mx-auto mb-2 flex items-center justify-center font-bold text-[10px]">
                #{idx + 1}
              </div>
              <h4 className="text-xs font-bold text-white truncate">{m.name}</h4>
              <div className="text-sm font-extrabold text-emerald-400 mt-1 font-outfit">{formatCurrency(m.total)}</div>
              <span className="text-[9px] text-slate-500 font-medium">{m.count} logs</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
