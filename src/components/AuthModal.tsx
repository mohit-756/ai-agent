import React, { useState } from 'react';
import { LogIn, UserPlus, Lock, Mail, User, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface UserSession {
  email: string;
  name: string;
  isLoggedIn: boolean;
  loginTime: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    const userName = name.trim() || email.split('@')[0];
    const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    const userSession: UserSession = {
      email: email.trim(),
      name: formattedName,
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('spendwise_user_session', JSON.stringify(userSession));
    setSuccessMsg(tab === 'login' ? 'Successfully logged in!' : 'Account created & logged in!');
    
    setTimeout(() => {
      onLoginSuccess(userSession);
      if (onClose) onClose();
    }, 600);
  };

  const handleDemoLogin = () => {
    const userSession: UserSession = {
      email: 'mohit@spendwise.ai',
      name: 'Mohit',
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('spendwise_user_session', JSON.stringify(userSession));
    onLoginSuccess(userSession);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div 
        className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SpendWise Account Login</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {tab === 'login' ? 'Welcome Back!' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {tab === 'login' ? 'Sign in to access your personal dashboard & peer ledger' : 'Start tracking expenses, budgets, and debts securely'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              tab === 'login'
                ? 'bg-slate-900 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              tab === 'signup'
                ? 'bg-slate-900 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center space-x-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohit"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500/60 text-white text-xs placeholder-slate-600 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500/60 text-white text-xs placeholder-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Password / PIN</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500/60 text-white text-xs placeholder-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <span>{tab === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold absolute">OR</span>
        </div>

        {/* Quick Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Continue as Guest / Demo User</span>
        </button>
      </div>
    </div>
  );
};
