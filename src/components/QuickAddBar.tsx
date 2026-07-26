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
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
      
      {/* Background Glow Effects */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />

      {/* Header Label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            Natural Language AI Quick-Add
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Phase 2 UX
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Try typing:</span>
          <button
            type="button"
            onClick={() => handlePresetClick('Spent ₹250 on Swiggy lunch')}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-[11px]"
          >
            "Spent ₹250 on Swiggy lunch"
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('Uber auto ₹180 via UPI')}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-[11px]"
          >
            "Uber auto ₹180"
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick('Netflix subscription 649 via Credit Card')}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-[11px]"
          >
            "Netflix 649"
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g. Spent ₹350 on Zomato dinner yesterday via UPI..."
          className="w-full pl-4 pr-32 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-inner transition-all"
        />

        <button
          type="submit"
          disabled={!parsedResult.amount || parsedResult.amount <= 0}
          className={`absolute right-2 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ${
            isSuccess
              ? 'bg-emerald-600 text-white'
              : parsedResult.amount && parsedResult.amount > 0
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <span>Add Expense</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Real-time Live AI Parsing Preview Badge Strip */}
      {inputText.trim().length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center">
            <Sparkles className="w-3 h-3 text-indigo-400 mr-1" />
            Live AI Detection:
          </span>

          {/* Amount Badge */}
          <div className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 font-semibold text-xs ${
            parsedResult.amount ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
          }`}>
            <IndianRupee className="w-3 h-3" />
            <span>{parsedResult.amount ? `${parsedResult.amount}` : 'Amount missing'}</span>
          </div>

          {/* Category Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1 font-medium">
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>Category: {parsedResult.category}</span>
          </div>

          {/* Payment Method Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1 font-medium">
            <CreditCard className="w-3 h-3 text-purple-400" />
            <span>{parsedResult.paymentMethod}</span>
          </div>

          {/* Date Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1 font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{parsedResult.date}</span>
          </div>
        </div>
      )}
    </div>
  );
};
