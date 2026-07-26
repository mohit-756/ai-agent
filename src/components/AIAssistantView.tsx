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
    text: `Hello Mohit 👋! I am your **AI Financial Assistant Agent**. I have analyzed all your logged transactions and category budgets.\n\nWhat would you like to ask or analyze today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const SUGGESTED_PROMPTS = [
  "How much did I spend this month?",
  "Can I afford a ₹3,000 purchase?",
  "Where am I spending the most?",
  "How much on Food & Dining?",
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
    <div className="space-y-4 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>AI Financial Assistant Agent</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 3 AI
              </span>
            </h1>
            <p className="text-xs text-slate-400">Contextual financial intelligence powered by your live data</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Agent Active & Monitoring</span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-slate-400 text-xs font-medium flex items-center mr-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 mr-1" />
          Suggested:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl min-h-[420px] max-h-[520px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs ${
                isAssistant 
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-700'
              }`}>
                {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                isAssistant
                  ? 'bg-slate-950/90 text-slate-200 border border-slate-800'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20'
              }`}>
                <div className="whitespace-pre-line font-normal">
                  {msg.text}
                </div>

                {/* Structured Metric Card Component inside Chat */}
                {msg.cardData && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                    <div className="font-bold text-indigo-300 text-xs flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{msg.cardData.title}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {msg.cardData.items?.map((item, idx) => (
                        <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-400">{item.label}</div>
                          <div className="text-xs font-extrabold text-white mt-0.5">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-[10px] mt-2 text-right ${isAssistant ? 'text-slate-500' : 'text-indigo-200'}`}>
                  {msg.timestamp}
                </div>
              </div>

            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 font-medium">AI Agent analyzing financial records...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Field Bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask AI Assistant anything about your spending, budget, or advice..."
          className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim()}
          className={`px-5 py-3.5 rounded-2xl font-bold text-xs flex items-center space-x-1.5 transition ${
            inputQuery.trim()
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02]'
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
