import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import type { ChatMessage, Expense, Budget } from '../types/expense';
import { AIFinanceService } from '../services/aiFinanceService';

interface AIAssistantViewProps {
  expenses: Expense[];
  budgets: Budget[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg',
    sender: 'assistant',
    text: `Hello Mohit 👋! I am your **AI Financial Coach**. I have parsed all your transactions and budgets.\n\nAsk me anything! For example:\n• *"How much did I spend this week?"*\n• *"Can I afford a ₹3,000 keyboard?"*`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const SUGGESTED_PROMPTS = [
  "How much spent this month?",
  "Can I afford ₹3,000 purchases?",
  "Where am I spending the most?",
  "Give me budget saving tips"
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ expenses, budgets }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    <div className="space-y-4 pb-12 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-white">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <span>SpendWise AI Coach</span>
            </h1>
            <p className="text-xs text-slate-400">Contextual savings & budget advice agent</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Active & Ready</span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center mr-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
          Suggestions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-900 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm min-h-[400px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3.5 ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs border ${
                isAssistant 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-900'
              }`}>
                {isAssistant ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-md rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                isAssistant
                  ? 'bg-slate-950/80 text-slate-300 border border-slate-900/60'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/5'
              }`}>
                <div className="whitespace-pre-line font-medium font-sans">
                  {msg.text}
                </div>

                {/* Structured Metric Card Component inside Chat */}
                {msg.cardData && (
                  <div className="mt-3.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                    <div className="font-bold text-indigo-300 text-[10px] uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      <span>{msg.cardData.title}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {msg.cardData.items?.map((item, idx) => (
                        <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-950">
                          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{item.label}</div>
                          <div className="text-xs font-bold text-white mt-0.5">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-[9px] font-bold mt-2.5 text-right ${isAssistant ? 'text-slate-500' : 'text-indigo-200'}`}>
                  {msg.timestamp}
                </div>
              </div>

            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center space-x-3.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="bg-slate-950/80 border border-slate-900/60 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center space-x-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px]">AI Coach is calculating...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Field Bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="flex items-center space-x-2 animate-fade-in"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about spending, budgets, or advice..."
          className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40 shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim()}
          className={`px-5 py-3.5 rounded-2xl font-bold text-xs flex items-center space-x-1.5 transition-all duration-300 ${
            inputQuery.trim()
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:scale-[1.01] cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
};
