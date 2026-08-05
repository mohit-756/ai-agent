import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCheck, Code, Smartphone, Copy, Check, RotateCcw, Bot } from 'lucide-react';
import type { WhatsAppMessage } from '../../types/expense';
import { WhatsAppService } from '../../services/whatsappService';
import { formatCurrency } from '../../services/expenseService';

interface WhatsAppHubViewProps {
  onExpenseAddedByWhatsApp: () => void;
}

const SAMPLE_WA_PROMPTS = [
  "Spent ₹250 on Swiggy lunch",
  "Set daily limit ₹1500",
  "Remind budget",
  "Uber auto ₹180 via UPI",
  "Paid ₹1850 for BESCOM bill"
];

export const WhatsAppHubView: React.FC<WhatsAppHubViewProps> = ({ onExpenseAddedByWhatsApp }) => {
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'backend-code'>('simulator');
  const [chatMessages, setChatMessages] = useState<WhatsAppMessage[]>(() => WhatsAppService.getChatHistory());
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMsg).trim();
    if (!text) return;

    if (!textToSend) setInputMsg('');

    // Add user message temporarily
    const tempUserMsg: WhatsAppMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      body: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    setChatMessages(prev => [...prev, tempUserMsg]);

    // Simulate network delay & bot response
    setIsTyping(true);
    setTimeout(() => {
      const { addedExpense } = WhatsAppService.processIncomingMessage(text);
      setChatMessages(WhatsAppService.getChatHistory());
      setIsTyping(false);

      if (addedExpense) {
        onExpenseAddedByWhatsApp();
      }
    }, 600);
  };

  const handleResetChat = () => {
    const reset = WhatsAppService.resetChat();
    setChatMessages(reset);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(WhatsAppService.getProductionBackendScript());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>WhatsApp Bot Integration</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Sync
              </span>
            </h1>
            <p className="text-xs text-slate-400">Type expenses in WhatsApp to auto-update your SpendWise app</p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeSubTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>
          <button
            onClick={() => setActiveSubTab('backend-code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeSubTab === 'backend-code'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Backend Webhook Code</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'simulator' ? (
        <div className="space-y-4">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Try WhatsApp prompts:</span>
            {SAMPLE_WA_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition"
              >
                "{prompt}"
              </button>
            ))}
            <button
              onClick={handleResetChat}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Reset Chat History"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* WhatsApp UI Card Container */}
          <div className="bg-[#0b141a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* WhatsApp Contact Header */}
            <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight flex items-center space-x-1.5">
                    <span>SpendWise AI Assistant</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium">Official Business Account • Online</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-700/50">
                End-to-End Encrypted
              </div>
            </div>

            {/* Chat Body Wallpaper Background */}
            <div className="p-4 sm:p-6 min-h-[380px] max-h-[460px] overflow-y-auto space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
              
              {/* Date Stamp */}
              <div className="text-center my-2">
                <span className="px-3 py-1 rounded-lg bg-[#182229] text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Today
                </span>
              </div>

              {/* Messages Feed */}
              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-2xl p-3 text-xs sm:text-sm shadow-md relative ${
                        isUser
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40'
                      }`}
                    >
                      <div className="whitespace-pre-line leading-relaxed font-sans">
                        {msg.body}
                      </div>

                      {/* Logged expense badge */}
                      {msg.expenseAdded && (
                        <div className="mt-2 p-2 rounded-xl bg-black/20 border border-emerald-500/30 text-[11px] flex items-center justify-between">
                          <span className="text-emerald-300 font-bold">Synced to App Dashboard</span>
                          <span className="text-white font-extrabold">{formatCurrency(msg.expenseAdded.amount)}</span>
                        </div>
                      )}

                      <div className={`text-[10px] mt-1 flex items-center justify-end space-x-1 ${
                        isUser ? 'text-emerald-200' : 'text-slate-400'
                      }`}>
                        <span>{msg.timestamp}</span>
                        {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#202c33] border border-slate-700/40 text-slate-400 px-4 py-2.5 rounded-2xl rounded-tl-none text-xs flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[11px] text-slate-300">SpendWise Bot is typing...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="bg-[#202c33] p-3 flex items-center space-x-2 border-t border-slate-800"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Type e.g. Spent ₹350 on Swiggy lunch or Uber ₹180..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#2a3942] text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className={`p-2.5 rounded-xl text-white transition ${
                  inputMsg.trim() ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-md' : 'bg-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      ) : (
        /* Backend Webhook Code Tab */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Twilio / Node.js Webhook Script</h3>
              <p className="text-xs text-slate-400">Deploy this server script on Vercel, Render, or AWS to connect your real WhatsApp number</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
            {WhatsAppService.getProductionBackendScript()}
          </pre>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
            <h4 className="font-bold">Deployment Steps:</h4>
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Create a free Sandbox account on <strong>Twilio WhatsApp API</strong> or <strong>Meta WhatsApp Cloud API</strong>.</li>
              <li>Deploy this Node.js script to any hosting server (e.g. Render / Vercel / Railway).</li>
              <li>Set your Twilio WhatsApp Webhook URL to <code>https://your-server.com/webhook/whatsapp</code>.</li>
              <li>Send a message to your WhatsApp Sandbox number to start logging expenses live!</li>
            </ol>
          </div>
        </div>
      )}

    </div>
  );
};
