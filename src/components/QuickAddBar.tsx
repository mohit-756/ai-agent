import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Check, Tag, CreditCard, Calendar, IndianRupee } from 'lucide-react';
import { AIFinanceService } from '../services/aiFinanceService';
import type { Expense } from '../types/expense';

interface QuickAddBarProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onAddExpense }) => {
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState(() => AIFinanceService.parseNaturalLanguageExpense(''));
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const result = AIFinanceService.parseNaturalLanguageExpense(inputText);
    setParsedResult(result);
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedResult.amount || parsedResult.amount <= 0) return;

    onAddExpense({
      amount: parsedResult.amount,
      category: parsedResult.category,
      description: parsedResult.description || 'Natural Language Input',
      merchant: parsedResult.merchant,
      paymentMethod: parsedResult.paymentMethod,
      date: parsedResult.date
    });

    setInputText('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  const handlePresetClick = (presetText: string) => {
    setInputText(presetText);
  };

  return (
    <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
      
      {/* Header Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-slate-950 text-slate-450 border border-slate-900">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              AI Natural Language Quick-Add
            </h3>
            <p className="text-[10px] text-slate-500">Type naturally to instantly log and categorize transactions</p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="text-slate-550 font-medium mr-1">Suggestions:</span>
          <button
            type="button"
            onClick={() => handlePresetClick('Spent ₹250 on Swiggy lunch')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-900 transition-all cursor-pointer"
          >
            "Swiggy lunch ₹250"
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('Uber auto ₹180')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-900 transition-all cursor-pointer"
          >
            "Uber auto ₹180"
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g., Spent ₹350 on Zomato dinner yesterday via UPI..."
          className="w-full pl-4 pr-32 py-3 rounded-xl bg-slate-950 border border-slate-900 text-white placeholder-slate-600 text-xs sm:text-sm font-medium focus:outline-none focus:border-slate-800 transition-all"
        />

        <button
          type="submit"
          disabled={!parsedResult.amount || parsedResult.amount <= 0}
          className={`absolute right-2 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 ${
            isSuccess
              ? 'bg-emerald-600 text-white shadow-sm'
              : parsedResult.amount && parsedResult.amount > 0
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
              : 'bg-slate-900 text-slate-600 cursor-not-allowed'
          }`}
        >
          {isSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Logged!</span>
            </>
          ) : (
            <>
              <span>Log Record</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Real-time Live AI Parsing Preview Badge Strip */}
      {inputText.trim().length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-950 text-xs animate-fade-in">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center mr-1">
            <Sparkles className="w-3 h-3 text-indigo-400 mr-1.5" />
            Parser Preview:
          </span>

          {/* Amount Badge */}
          <div className={`px-3 py-1 rounded-xl flex items-center space-x-1 font-bold text-xs ${
            parsedResult.amount ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-slate-950 text-slate-600 border border-slate-900/50'
          }`}>
            <IndianRupee className="w-3.5 h-3.5" />
            <span>{parsedResult.amount ? `${parsedResult.amount}` : 'Amount missing'}</span>
          </div>

          {/* Category Badge */}
          <div className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 flex items-center space-x-1 font-semibold">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Category: {parsedResult.category}</span>
          </div>

          {/* Payment Method Badge */}
          <div className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10 flex items-center space-x-1 font-semibold">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span>{parsedResult.paymentMethod}</span>
          </div>

          {/* Date Badge */}
          <div className="px-3 py-1 rounded-xl bg-slate-950 text-slate-400 border border-slate-900 flex items-center space-x-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{parsedResult.date}</span>
          </div>
        </div>
      )}
    </div>
  );
};
