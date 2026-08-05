import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  BookOpen, 
  Mic, 
  Paperclip, 
  Bot
} from 'lucide-react';
import { AIFinanceService } from '../../services/aiFinanceService';
import { MemoryService } from '../../services/memoryService';
import { LiveParsedPreviewCard } from './LiveParsedPreviewCard';
import type { Expense } from '../../types/expense';

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

  const handleConfirm = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConfirm();
  };

  const handlePresetClick = (presetText: string) => {
    setInputText(presetText);
  };

  return (
    <div className="max-w-[900px] mx-auto my-6">
      {/* Outer Glowing Border Container */}
      <div className="relative p-[2px] rounded-[26px] bg-gradient-to-r from-[#7C3AED] via-[#3B82F6] to-[#7C3AED] shadow-[0_0_35px_rgba(124,58,237,0.3)] transition-all duration-300 group">
        
        {/* Main Command Bar Glass Container */}
        <div className="bg-[#12182B]/85 backdrop-blur-2xl rounded-[24px] p-6 space-y-4 text-[#F8FAFC]">
          
          {/* Header Row with Title & Top-Right AI Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider">
                  AI Command Engine
                </h3>
                <p className="text-[11px] text-[#94A3B8]">Natural language quick-add & smart assistant</p>
              </div>
            </div>

            {/* Small "AI" Badge Top-Right */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#7C3AED] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md shadow-[#7C3AED]/30">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Command</span>
            </div>
          </div>

          {/* Form with 72px Height Input */}
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask SpendWise anything or type: Spent ₹250 on Swiggy lunch..."
              className="w-full h-[72px] pl-5 pr-36 rounded-[24px] bg-[#0B1020]/90 border border-[#24304A] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-[#F8FAFC] placeholder-[#94A3B8] text-sm font-medium focus:outline-none transition-all shadow-inner"
            />

            {/* Action Buttons Inside Input */}
            <div className="absolute right-3 flex items-center space-x-2">
              <button
                type="button"
                title="Voice input"
                className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2238] transition cursor-pointer"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                title="Upload receipt image"
                className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#7C3AED] hover:bg-[#1A2238] transition cursor-pointer"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              <button
                type="submit"
                disabled={(!parsedResult.amount || parsedResult.amount <= 0) && (!memoryResult.isMemory || !inputText.trim())}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 shadow-md ${
                  isSuccess || memorySuccessMsg
                    ? 'bg-emerald-600 text-white'
                    : (parsedResult.amount && parsedResult.amount > 0) || (memoryResult.isMemory && inputText.trim())
                    ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[#7C3AED]/30 cursor-pointer'
                    : 'bg-[#1A2238] text-[#94A3B8] cursor-not-allowed border border-[#24304A]'
                }`}
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Logged!</span>
                  </>
                ) : memorySuccessMsg ? (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Suggestion Chips Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[#94A3B8] font-medium text-[11px] mr-1">Suggestions:</span>
            <button
              type="button"
              onClick={() => handlePresetClick('Swiggy lunch ₹250')}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B1020] hover:bg-[#1A2238] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#24304A] transition cursor-pointer font-medium"
            >
              "Swiggy lunch ₹250"
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('Salary ₹35,000')}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B1020] hover:bg-[#1A2238] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#24304A] transition cursor-pointer font-medium"
            >
              "Salary ₹35,000"
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('Uber ₹180')}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B1020] hover:bg-[#1A2238] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#24304A] transition cursor-pointer font-medium"
            >
              "Uber ₹180"
            </button>
            <button
              type="button"
              onClick={() => handlePresetClick('Doctor appointment Friday 5 PM')}
              className="px-3.5 py-1.5 rounded-xl bg-[#0B1020] hover:bg-[#1A2238] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#24304A] transition cursor-pointer font-medium"
            >
              "Doctor appointment Friday 5 PM"
            </button>
          </div>

          {/* Live Parsed Preview Card (Shows ONLY when text is present) */}
          <LiveParsedPreviewCard
            inputText={inputText}
            merchant={parsedResult.merchant}
            amount={parsedResult.amount || undefined}
            category={parsedResult.category}
            paymentMethod={parsedResult.paymentMethod}
            confidenceScore={parsedResult.amount ? 93 : 85}
            onConfirm={handleConfirm}
            onEdit={() => {}}
          />

        </div>
      </div>
    </div>
  );
};
