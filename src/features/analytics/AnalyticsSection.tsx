import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronRight, Filter } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import type { Expense, Category } from '../../types/expense';
import { formatCurrency } from '../../services/expenseService';
import { AIReportsSidePanel } from './AIReportsSidePanel';

interface AnalyticsSectionProps {
  expenses: Expense[];
  onNavigateToTab?: (tab: 'expenses' | 'budgets' | 'ai-assistant' | 'peer-ledger') => void;
}

const CATEGORY_MUTED_COLORS: Record<string, string> = {
  'Food & Dining': '#F59E0B',      // Amber
  'Transportation': '#3B82F6',    // Blue
  'Shopping & Retail': '#EC4899', // Pink
  'Bills & Utilities': '#10B981', // Emerald
  'Entertainment': '#7C3AED',    // Purple
  'Health & Wellness': '#EF4444', // Muted Red
  'Travel': '#06B6D4',           // Cyan
  'Education': '#6366F1',        // Indigo
  'Services': '#14B8A6',         // Teal
  'Others': '#64748B'            // Slate
};

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ expenses, onNavigateToTab }) => {
  const [period, setPeriod] = useState<'7D' | '30D' | '90D' | '1Y'>('7D');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const now = new Date();

  // 1. Period Selector Days Determination
  const periodDays = period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 90 : 365;

  // 2. Spending Trend Data Generation
  const chartData = Array.from({ length: periodDays }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - ((periodDays - 1) - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = periodDays <= 7 
      ? d.toLocaleDateString('en-US', { weekday: 'short' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const dayTotal = expenses
      .filter(e => {
        if (e.date !== dateStr || e.type === 'income' || e.category === 'Income') return false;
        if (hiddenCategories.has(e.category)) return false;
        return true;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      day: dayName,
      date: dateStr,
      amount: dayTotal
    };
  });

  // Calculate percentage change
  const halfLen = Math.floor(chartData.length / 2);
  const recentSum = chartData.slice(halfLen).reduce((acc, d) => acc + d.amount, 0);
  const prevSum = chartData.slice(0, halfLen).reduce((acc, d) => acc + d.amount, 0);
  const pctChange = prevSum > 0 ? Math.round(((recentSum - prevSum) / prevSum) * 100) : 0;

  // 3. Category Donut Data
  const monthExpenses = expenses.filter(e => e.type !== 'income' && e.category !== 'Income');
  const categoryMap = new Map<Category, number>();
  monthExpenses.forEach(e => {
    if (!hiddenCategories.has(e.category)) {
      const cur = categoryMap.get(e.category) || 0;
      categoryMap.set(e.category, cur + e.amount);
    }
  });

  const pieChartData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_MUTED_COLORS[name] || '#64748B'
    }))
    .sort((a, b) => b.value - a.value);

  const totalSpent = pieChartData.reduce((acc, c) => acc + c.value, 0);

  const toggleCategory = (catName: string) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 my-8 text-[#F8FAFC]">

      {/* Period Selector Controls Header Row (7D / 30D / 90D / 1Y) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12182B] border border-white/[0.08] rounded-[24px] p-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#F8FAFC]">Financial Analytics Reports</h3>
            <p className="text-xs text-[#94A3B8]">Interactive timeframe & category decomposition</p>
          </div>
        </div>

        {/* Period Selector Pills */}
        <div className="flex items-center space-x-1.5 bg-[#0B1020] p-1 rounded-2xl border border-white/[0.08]">
          {(['7D', '30D', '90D', '1Y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === p 
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25' 
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#12182B]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Flexible Layout: Main Charts Grid (Left) + AI Insights Side Panel (Right) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Charts Grid */}
        <div className="flex-1 w-full space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT CARD: Spending Trend Line/Area Chart */}
            <div className="bg-[#12182B] border border-white/[0.08] rounded-[24px] p-6 shadow-md hover:shadow-xl hover:border-[#7C3AED]/40 hover:-translate-y-0.5 transition-all duration-300 lg:col-span-2 flex flex-col justify-between space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#F8FAFC] tracking-wide">
                    Spending trend
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Velocity over selected period ({period})
                  </p>
                </div>

                <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  pctChange <= 0 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {pctChange <= 0 ? (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  <span>{pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`} vs prev period</span>
                </div>
              </div>

              {/* Area Chart with Mount Animation & Active Dot Hover Highlight */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="interactiveSpendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#24304A" vertical={false} />
                    <XAxis dataKey="day" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(val: any, _name: any, entry: any) => [
                        formatCurrency(Number(val) || 0), 
                        `Date: ${entry.payload.date}`
                      ]}
                      contentStyle={{ 
                        backgroundColor: '#0B1020', 
                        borderColor: '#24304A', 
                        borderRadius: '16px', 
                        color: '#F8FAFC', 
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#7C3AED" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#interactiveSpendingGradient)"
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                      activeDot={{ r: 7, stroke: '#7C3AED', strokeWidth: 3, fill: '#0B1020' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RIGHT CARD: Category Split Donut & Interactive Legend Toggle */}
            <div className="bg-[#12182B] border border-white/[0.08] rounded-[24px] p-6 shadow-md hover:shadow-xl hover:border-[#7C3AED]/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#F8FAFC] tracking-wide">
                    Category split
                  </h3>
                  <p className="text-xs text-[#94A3B8]">Click legend to toggle categories</p>
                </div>

                {onNavigateToTab && (
                  <button 
                    onClick={() => onNavigateToTab('expenses')}
                    className="text-xs text-[#7C3AED] hover:underline font-semibold flex items-center cursor-pointer"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Donut Chart */}
              <div className="h-52 w-full relative flex items-center justify-center">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={76}
                        paddingAngle={4}
                        dataKey="value"
                        onMouseEnter={(_, idx) => setActivePieIndex(idx)}
                        onMouseLeave={() => setActivePieIndex(null)}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke={index === activePieIndex ? '#7C3AED' : '#12182B'} 
                            strokeWidth={index === activePieIndex ? 5 : 2} 
                            style={{
                              transform: index === activePieIndex ? 'scale(1.05)' : 'scale(1)',
                              transformOrigin: 'center center',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Spent']}
                        contentStyle={{ 
                          backgroundColor: '#0B1020', 
                          borderColor: '#24304A', 
                          borderRadius: '16px', 
                          color: '#F8FAFC', 
                          fontSize: '12px' 
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-[#94A3B8] text-xs">No records logged</div>
                )}
              </div>

              {/* Small Interactive Legend Toggle */}
              <div className="space-y-2 pt-3 border-t border-[#24304A]">
                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                  Interactive Legend Toggle:
                </div>
                {Object.entries(CATEGORY_MUTED_COLORS).slice(0, 4).map(([catName, color]) => {
                  const isHidden = hiddenCategories.has(catName);
                  const catAmount = monthExpenses
                    .filter(e => e.category === catName)
                    .reduce((sum, e) => sum + e.amount, 0);

                  const pct = totalSpent > 0 && !isHidden ? Math.round((catAmount / totalSpent) * 100) : 0;

                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => toggleCategory(catName)}
                      className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isHidden 
                          ? 'opacity-40 border-transparent bg-[#1A2238]/30' 
                          : 'border-[#24304A] bg-[#0B1020]/50 hover:border-[#7C3AED]/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className={`truncate font-medium ${isHidden ? 'line-through text-[#94A3B8]' : 'text-[#94A3B8]'}`}>
                          {catName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[11px] text-[#94A3B8] font-semibold">{pct}%</span>
                        <span className="text-[#F8FAFC] font-extrabold">{formatCurrency(catAmount)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

          </div>

        </div>

        {/* Right Column: Sticky AI Insights Side Panel */}
        <AIReportsSidePanel expenses={expenses} onNavigateToTab={onNavigateToTab} />

      </div>

    </div>
  );
};
