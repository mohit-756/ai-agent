import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Bot, 
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  ShoppingBag,
  Utensils
} from 'lucide-react';
import type { AIInsight } from '../../types/expense';

interface AIInsightsCardProps {
  insights?: AIInsight[];
  onSelectCategory?: (categoryName: string) => void;
  onAskAIWhy?: (query: string) => void;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ 
  insights = [], 
  onSelectCategory,
  onAskAIWhy 
}) => {

  // Conversational card data format
  const cardData = insights.length > 0 ? insights.map((item, idx) => ({
    id: item.id || `insight-${idx}`,
    icon: item.type === 'warning' ? AlertTriangle : item.type === 'positive' ? CheckCircle2 : Lightbulb,
    iconColor: item.type === 'warning' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : item.type === 'positive' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-[#7C3AED] bg-[#7C3AED]/10 border-[#7C3AED]/20',
    title: item.title,
    message: item.message,
    savingsEstimate: item.actionableText ? item.actionableText : 'Potential savings: ₹1,500/mo',
    confidence: '95% confidence',
    category: item.category || 'Shopping & Retail',
    primaryButtonText: 'Create budget',
    secondaryButtonText: 'Ask AI why'
  })) : [
    {
      id: 'sample-1',
      icon: ShoppingBag,
      iconColor: 'text-[#7C3AED] bg-[#7C3AED]/10 border-[#7C3AED]/20',
      title: 'Shopping is 40% of your spend',
      message: 'You spent ₹5,600 on shopping this month, which is ₹2,100 above your usual average.',
      savingsEstimate: 'Potential savings: ₹2,000',
      confidence: '96% confidence',
      category: 'Shopping & Retail',
      primaryButtonText: 'Create budget',
      secondaryButtonText: 'Ask AI why'
    },
    {
      id: 'sample-2',
      icon: Utensils,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: 'Swiggy & Dining out spiking',
      message: 'Food delivery logs hit ₹3,450 across 12 orders, showing a 30% surge over weekends.',
      savingsEstimate: 'Potential savings: ₹1,400',
      confidence: '92% confidence',
      category: 'Food & Dining',
      primaryButtonText: 'Set dining cap',
      secondaryButtonText: 'Ask AI why'
    },
    {
      id: 'sample-3',
      icon: TrendingDown,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      title: 'Utility bill optimization found',
      message: 'Your electricity and broadband bills remained stable, saving ₹850 compared to last quarter.',
      savingsEstimate: 'Optimized pool: ₹850 saved',
      confidence: '98% confidence',
      category: 'Bills & Utilities',
      primaryButtonText: 'View summary',
      secondaryButtonText: 'Ask AI why'
    }
  ];

  return (
    <div className="space-y-4 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#F8FAFC] uppercase tracking-wider">
              Conversational AI Insights
            </h3>
            <p className="text-xs text-[#94A3B8]">Autonomous agent analysis & savings recommendations</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#12182B] border border-[#24304A] text-xs font-bold text-[#7C3AED]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real-Time Engine</span>
        </div>
      </div>

      {/* Vertical Stack with 16px Gaps */}
      <div className="flex flex-col space-y-4">
        {cardData.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className="bg-[#12182B] border border-[#24304A] rounded-[24px] p-6 shadow-md hover:shadow-xl hover:border-[#7C3AED]/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Column: Icon + Text Details */}
              <div className="flex items-start space-x-4 flex-1">
                {/* Colored Icon */}
                <div className={`p-3.5 rounded-2xl border ${card.iconColor} shrink-0 mt-0.5`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Title, Body & Savings Box */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-base font-extrabold text-[#F8FAFC]">
                      {card.title}
                    </h4>

                    {/* Confidence Badge */}
                    <span className="px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] text-[10px] font-extrabold uppercase tracking-wider">
                      {card.confidence}
                    </span>
                  </div>

                  {/* One-sentence explanation */}
                  <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">
                    {card.message}
                  </p>

                  {/* Highlighted Savings Estimate Box */}
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 text-emerald-400 text-xs font-extrabold shadow-sm mt-1">
                    <span>💡 {card.savingsEstimate}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Two Action Buttons */}
              <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
                {/* Secondary Action Button */}
                <button
                  type="button"
                  onClick={() => onAskAIWhy ? onAskAIWhy(`Why is ${card.title}?`) : onSelectCategory && onSelectCategory(card.category)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A2238] hover:bg-[#24304A] text-[#F8FAFC] text-xs font-semibold border border-[#24304A] transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Bot className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>{card.secondaryButtonText}</span>
                </button>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory(card.category)}
                  className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition shadow-lg shadow-[#7C3AED]/25 cursor-pointer flex items-center space-x-1.5"
                >
                  <span>{card.primaryButtonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
