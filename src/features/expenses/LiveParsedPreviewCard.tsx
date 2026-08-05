import React from 'react';
import { 
  Sparkles, 
  Store, 
  IndianRupee, 
  Tag, 
  CreditCard, 
  Check, 
  Edit3 
} from 'lucide-react';
import type { Category, PaymentMethod } from '../../types/expense';

interface LiveParsedPreviewCardProps {
  inputText: string;
  merchant?: string;
  amount?: number;
  category?: Category;
  paymentMethod?: PaymentMethod;
  confidenceScore?: number;
  onConfirm: () => void;
  onEdit?: () => void;
}

export const LiveParsedPreviewCard: React.FC<LiveParsedPreviewCardProps> = ({
  inputText,
  merchant = 'Swiggy',
  amount = 250,
  category = 'Food & Dining',
  paymentMethod = 'UPI',
  confidenceScore = 93,
  onConfirm,
  onEdit
}) => {
  // Show ONLY when text is present
  if (!inputText.trim()) return null;

  const displayMerchant = merchant || (inputText.toLowerCase().includes('swiggy') ? 'Swiggy' : 'Store');
  const displayAmount = amount || 250;
  const displayCategory = category || 'Food & Dining';
  const displayPayment = paymentMethod || 'UPI';

  return (
    <div className="mt-4 bg-[#12182B]/90 backdrop-blur-xl border border-[#7C3AED]/30 rounded-[20px] p-4 shadow-xl space-y-3.5 text-[#F8FAFC] animate-fade-in">
      
      {/* Header Row: Title & Confidence Percentage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#7C3AED]">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider">
            Live AI Parsed Preview
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-emerald-400">
            Confidence: {confidenceScore}%
          </span>
        </div>
      </div>

      {/* Confidence Progress Bar */}
      <div className="w-full bg-[#1A2238] rounded-full h-1.5 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#7C3AED] to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${confidenceScore}%` }}
        />
      </div>

      {/* 4-Field Grid: Merchant, Amount, Category, Payment */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        
        {/* Merchant */}
        <div className="bg-[#0B1020]/80 p-3 rounded-xl border border-[#24304A]/60">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center mb-1">
            <Store className="w-3.5 h-3.5 text-[#7C3AED] mr-1.5" />
            Merchant
          </div>
          <div className="font-extrabold text-xs text-[#F8FAFC] truncate">
            {displayMerchant}
          </div>
        </div>

        {/* Amount */}
        <div className="bg-[#0B1020]/80 p-3 rounded-xl border border-[#24304A]/60">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
            Amount
          </div>
          <div className="font-extrabold text-xs text-emerald-400">
            ₹{displayAmount}
          </div>
        </div>

        {/* Category */}
        <div className="bg-[#0B1020]/80 p-3 rounded-xl border border-[#24304A]/60">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center mb-1">
            <Tag className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
            Category
          </div>
          <div className="font-extrabold text-xs text-indigo-400 truncate">
            {displayCategory}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-[#0B1020]/80 p-3 rounded-xl border border-[#24304A]/60">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center mb-1">
            <CreditCard className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
            Payment
          </div>
          <div className="font-extrabold text-xs text-purple-400 truncate">
            {displayPayment}
          </div>
        </div>

      </div>

      {/* Action Buttons: Confirm & Edit */}
      <div className="flex items-center justify-end space-x-2.5 pt-1 border-t border-[#24304A]/50">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 rounded-xl bg-[#1A2238] hover:bg-[#24304A] text-[#F8FAFC] text-xs font-semibold border border-[#24304A] transition cursor-pointer flex items-center space-x-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>Edit</span>
          </button>
        )}

        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white text-xs font-bold transition shadow-md shadow-[#7C3AED]/25 cursor-pointer flex items-center space-x-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Confirm</span>
        </button>
      </div>

    </div>
  );
};
