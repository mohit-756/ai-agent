import React from 'react';
import { AlertTriangle, Lightbulb, CheckCircle2, Info, ArrowUpRight, Sparkles } from 'lucide-react';
import type { AIInsight } from '../types/expense';

interface AIInsightsCardProps {
  insights: AIInsight[];
  onSelectCategory?: (categoryName: string) => void;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ insights, onSelectCategory }) => {
  if (!insights.length) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center">
        <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium text-slate-400">Add transactions to generate AI spending insights.</p>
      </div>
    );
  }

  const getInsightStyle = (type: AIInsight['type']) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-slate-900/50 border-slate-800',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
          badge: 'bg-slate-950 text-amber-400 border border-slate-800'
        };
      case 'positive':
        return {
          bg: 'bg-slate-900/50 border-slate-800',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
          badge: 'bg-slate-950 text-emerald-400 border border-slate-800'
        };
      case 'tip':
        return {
          bg: 'bg-slate-900/50 border-slate-800',
          icon: Lightbulb,
          iconColor: 'text-indigo-400',
          badge: 'bg-slate-950 text-indigo-400 border border-slate-800'
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/50 border-slate-800',
          icon: Info,
          iconColor: 'text-slate-400',
          badge: 'bg-slate-950 text-slate-400 border border-slate-800'
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            AI Automated Insights
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Real-time analysis</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight) => {
          const style = getInsightStyle(insight.type);
          const Icon = style.icon;

          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border ${style.bg} backdrop-blur-sm transition-all duration-200 hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 ${style.iconColor} shrink-0`} />
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {insight.title}
                  </h4>
                </div>
                {insight.metric && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge} shrink-0`}>
                    {insight.metric}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                {insight.message}
              </p>

              {insight.actionableText && (
                <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium italic">
                    💡 {insight.actionableText}
                  </span>
                  {insight.category && onSelectCategory && (
                    <button
                      onClick={() => onSelectCategory(insight.category!)}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center shrink-0 ml-2"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
