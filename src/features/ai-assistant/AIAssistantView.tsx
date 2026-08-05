import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  MessageSquare, 
  Wallet, 
  PieChart, 
  TrendingUp, 
  Users, 
  Mic,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { ChatMessage, Expense, Budget } from '../../types/expense';
import { AIFinanceService } from '../../services/aiFinanceService';
import { formatCurrency } from '../../services/expenseService';
import { BudgetService } from '../../services/budgetService';
import { PeerService } from '../../services/peerService';

const WhatsAppHubView = lazy(() => import('../whatsapp/WhatsAppHubView').then(m => ({ default: m.WhatsAppHubView })));

interface AIAssistantViewProps {
  expenses: Expense[];
  budgets: Budget[];
  onExpenseAddedByWhatsApp?: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg',
    sender: 'assistant',
    text: `Hello Mohit 👋! I am your **AI Financial Coach**. I have full context on your monthly transactions, budget limits, and peer splits.\n\nAsk me anything or pick a quick suggestion below:`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cardData: {
      type: 'metric',
      title: 'Current Monthly Intelligence Brief',
      items: [
        { label: 'Budget Surplus', value: '₹4,200 Under' },
        { label: 'Top Spend', value: 'Food & Dining (42%)' },
        { label: 'AI Health Score', value: '94 / 100' }
      ]
    }
  }
];

const SUGGESTED_PROMPTS = [
  "Can I afford a ₹15k phone?",
  "How much did I spend on Swiggy?",
  "How can I save ₹5k this month?",
  "Am I over budget?"
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ 
  expenses, 
  budgets,
  onExpenseAddedByWhatsApp
}) => {
  const [mode, setMode] = useState<'coach' | 'whatsapp'>('coach');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Context Metrics Calculation
  const totalMonthlySpend = expenses
    .filter(e => e.type !== 'income' && e.category !== 'Income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalMonthlyIncome = expenses
    .filter(e => e.type === 'income' || e.category === 'Income')
    .reduce((sum, e) => sum + e.amount, 0) || 55000;

  const totalBudgetLimit = BudgetService.getTotalMonthlyBudget();
  const peerRecords = PeerService.getPeerRecords();
  const totalDebtsOwed = peerRecords
    .filter(p => p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');

    // 2. Simulate AI Processing
    setIsTyping(true);
    setTimeout(() => {
      const responseMsg = AIFinanceService.queryExpenseAssistant(query, expenses, budgets);
      setMessages(prev => [...prev, responseMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto text-[#F8FAFC]">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED] shadow-lg shadow-[#7C3AED]/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#F8FAFC] tracking-wide flex items-center space-x-2">
              <span>SpendWise AI Coach</span>
              <span className="px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] text-[10px] uppercase font-bold border border-[#7C3AED]/30">
                GPT-4o Agent
              </span>
            </h1>
            <p className="text-xs text-[#94A3B8]">Context-aware personal wealth assistant</p>
          </div>
        </div>

        {/* Tab Switcher: Coach vs WhatsApp */}
        <div className="flex bg-[#0B1020] p-1 rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => setMode('coach')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              mode === 'coach'
                ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Chat Coach</span>
          </button>
          <button
            onClick={() => setMode('whatsapp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              mode === 'whatsapp'
                ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Bot</span>
          </button>
        </div>
      </div>

      {mode === 'coach' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Main ChatGPT Conversation & Fixed Input Area (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-4 min-h-[620px] bg-[#12182B] border border-white/[0.08] rounded-[24px] p-6 shadow-xl relative">
            
            {/* Messages Thread Container */}
            <div className="space-y-5 overflow-y-auto max-h-[500px] pr-2">
              {messages.map((msg) => {
                const isAssistant = msg.sender === 'assistant';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3.5 ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs border ${
                      isAssistant 
                        ? 'bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/30 shadow-md'
                        : 'bg-[#1A2238] text-[#F8FAFC] border-[#24304A]'
                    }`}>
                      {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-xl rounded-[20px] p-4 text-xs sm:text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-[#0B1020]/90 text-[#CBD5E1] border border-white/[0.08] shadow-md'
                        : 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20'
                    }`}>
                      <div className="whitespace-pre-line font-medium font-sans">
                        {msg.text}
                      </div>

                      {/* Structured Response Card with Chart / Recommendation */}
                      {msg.cardData && (
                        <div className="mt-3.5 p-3.5 rounded-2xl bg-[#12182B] border border-[#7C3AED]/30 text-xs space-y-3">
                          <div className="font-extrabold text-[#7C3AED] text-[11px] uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center">
                              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#7C3AED]" />
                              {msg.cardData.title}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold">96% confidence</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {msg.cardData.items?.map((item, idx) => (
                              <div key={idx} className="bg-[#0B1020] p-2.5 rounded-xl border border-[#24304A]">
                                <div className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-wider">{item.label}</div>
                                <div className="text-xs font-extrabold text-[#F8FAFC] mt-0.5">{item.value}</div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-[#24304A]">
                            <span className="text-[11px] text-[#CBD5E1] font-medium">💡 Recommendation: Cap weekend dining out.</span>
                            <button
                              type="button"
                              className="px-3 py-1 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                            >
                              <span>Create Budget</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className={`text-[10px] font-bold mt-2.5 text-right ${isAssistant ? 'text-[#94A3B8]' : 'text-purple-200'}`}>
                        {msg.timestamp}
                      </div>
                    </div>

                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED]">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-[#0B1020]/90 border border-white/[0.08] rounded-[20px] px-4 py-3 text-xs text-[#94A3B8] flex items-center space-x-2 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px]">AI Coach is calculating financial context...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Suggested Prompt Chips */}
            <div className="space-y-3 pt-3 border-t border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider flex items-center mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] mr-1.5" />
                  Prompt Chips:
                </span>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0B1020] hover:bg-[#1A2238] text-[#CBD5E1] hover:text-[#F8FAFC] border border-[#24304A] text-xs font-semibold tracking-wide transition cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>

              {/* Message Input Fixed Bar */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask SpendWise AI Coach anything... (e.g. Can I afford a ₹15k phone?)"
                  className="w-full h-14 pl-5 pr-28 rounded-2xl bg-[#0B1020] border border-[#24304A] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 text-[#F8FAFC] placeholder-[#94A3B8] text-xs sm:text-sm font-medium focus:outline-none transition"
                />

                <div className="absolute right-3 flex items-center space-x-2">
                  <button
                    type="button"
                    title="Voice search"
                    className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2238] transition cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 shadow-md ${
                      inputQuery.trim()
                        ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[#7C3AED]/25 cursor-pointer'
                        : 'bg-[#1A2238] text-[#94A3B8] cursor-not-allowed border border-[#24304A]'
                    }`}
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Sidebar: Real-Time Financial Context Cards (1 col) */}
          <aside className="space-y-4">
            
            <div className="bg-[#12182B] border border-white/[0.08] rounded-[24px] p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-[#24304A] pb-2">
                <h3 className="text-xs font-extrabold text-[#F8FAFC] uppercase tracking-wider flex items-center">
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED] mr-1.5" />
                  Financial Context
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold">Live Context</span>
              </div>

              {/* Card 1: Income */}
              <div className="p-3 rounded-2xl bg-[#0B1020] border border-[#24304A] space-y-1">
                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                  <span>Monthly Income</span>
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-sm font-extrabold font-mono text-emerald-400">
                  {formatCurrency(totalMonthlyIncome)}
                </div>
              </div>

              {/* Card 2: Total Spend */}
              <div className="p-3 rounded-2xl bg-[#0B1020] border border-[#24304A] space-y-1">
                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                  <span>Total Spent</span>
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-sm font-extrabold font-mono text-rose-400">
                  {formatCurrency(totalMonthlySpend)}
                </div>
              </div>

              {/* Card 3: Budget Limit */}
              <div className="p-3 rounded-2xl bg-[#0B1020] border border-[#24304A] space-y-1">
                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                  <span>Budget Limit</span>
                  <PieChart className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-sm font-extrabold font-mono text-[#F8FAFC]">
                  {formatCurrency(totalBudgetLimit)}
                </div>
              </div>

              {/* Card 4: Peer Debts */}
              <div className="p-3 rounded-2xl bg-[#0B1020] border border-[#24304A] space-y-1">
                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                  <span>Peer Debts Owed</span>
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-sm font-extrabold font-mono text-indigo-400">
                  {formatCurrency(totalDebtsOwed)}
                </div>
              </div>
            </div>

          </aside>

        </div>
      ) : (
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#94A3B8] font-semibold animate-pulse">Loading WhatsApp Integration...</div>}>
          <WhatsAppHubView onExpenseAddedByWhatsApp={onExpenseAddedByWhatsApp || (() => {})} />
        </Suspense>
      )}

    </div>
  );
};
