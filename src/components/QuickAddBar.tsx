import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Check, Tag, CreditCard, Calendar, IndianRupee, BookOpen } from 'lucide-react';
import { AIFinanceService } from '../services/aiFinanceService';
import { MemoryService } from '../services/memoryService';
import type { Expense } from '../types/expense';

interface QuickAddBarProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onAddExpense }) => {
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState(() => AIFinanceService.parseNaturalLanguageExpense(''));
  const [memoryResult, setMemoryResult] = useState(() => AIFinanceService.parseNaturalLanguageMemory(''));
  const [isSuccess, setIsSuccess] = useState(false);
  const [memorySuccessMsg, setMemorySuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const expResult = AIFinanceService.parseNaturalLanguageExpense(inputText);
    const memResult = AIFinanceService.parseNaturalLanguageMemory(inputText);
    setParsedResult(expResult);
    setMemoryResult(memResult);
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Expense Input
    if (parsedResult.amount && parsedResult.amount > 0) {
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
      return;
    }

    // 2. Real-Life Note / Reminder / Task / Idea Input
    if (memoryResult.isMemory && memoryResult.content.trim()) {
      MemoryService.addMemory({
        content: memoryResult.content,
        category: memoryResult.category,
        date: new Date().toISOString().split('T')[0],
        source: 'manual'
      });

      setInputText('');
      setMemorySuccessMsg(`Saved ${memoryResult.category.toUpperCase()} to Second Brain!`);
      setTimeout(() => setMemorySuccessMsg(null), 3000);
    }
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
            <p className="text-[10px] text-slate-500">Type expenses, peer loans, or real-life notes & reminders</p>
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
            onClick={() => handlePresetClick('Doctor appointment on Friday at 5pm')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-900 transition-all cursor-pointer"
          >
            "Doctor appointment"
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your entry: e.g. Spent ₹350 on dinner or Doctor appointment Friday..."
          className="w-full pl-4 pr-32 py-3 rounded-xl bg-slate-950 border border-slate-900 focus:border-slate-800 text-white placeholder-slate-600 text-xs sm:text-sm font-medium focus:outline-none transition-all"
        />

        <div className="absolute right-2 flex items-center space-x-1.5">
          <button
            type="submit"
            disabled={(!parsedResult.amount || parsedResult.amount <= 0) && (!memoryResult.isMemory || !inputText.trim())}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 ${
              isSuccess || memorySuccessMsg
                ? 'bg-emerald-600 text-white shadow-sm'
                : (parsedResult.amount && parsedResult.amount > 0) || (memoryResult.isMemory && inputText.trim())
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                : 'bg-slate-900 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Logged!</span>
              </>
            ) : memorySuccessMsg ? (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                <span>Note Saved!</span>
              </>
            ) : memoryResult.isMemory && !parsedResult.amount ? (
              <>
                <span>Save Note</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Log Record</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Real-time Live AI Parsing Preview Badge Strip */}
      {inputText.trim().length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-950 text-xs animate-fade-in">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center mr-1">
            <Sparkles className="w-3 h-3 text-indigo-400 mr-1.5" />
            Parser Preview:
          </span>

          {parsedResult.amount ? (
            <>
              <div className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 flex items-center space-x-1 font-bold text-xs">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>₹{parsedResult.amount}</span>
              </div>

              <div className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 flex items-center space-x-1 font-semibold">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>{parsedResult.category}</span>
              </div>

              <div className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10 flex items-center space-x-1 font-semibold">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                <span>{parsedResult.paymentMethod}</span>
              </div>
            </>
          ) : memoryResult.isMemory ? (
            <div className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1 font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Second Brain Note ({memoryResult.category.toUpperCase()})</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-xl bg-slate-950 text-slate-500 border border-slate-900 flex items-center space-x-1 font-medium text-xs">
              <span>Text Entry</span>
            </div>
          )}

          <div className="px-3 py-1 rounded-xl bg-slate-950 text-slate-400 border border-slate-900 flex items-center space-x-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{parsedResult.date}</span>
          </div>
        </div>
      )}
    </div>
  );
};
