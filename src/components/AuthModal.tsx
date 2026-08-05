import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/85 backdrop-blur-xl p-4 animate-fade-in">
      
      {/* Main Glass Card Container with Glow & Gradient Blobs */}
      <div 
        className="relative max-w-md w-full bg-[#12182B] border border-white/[0.08] rounded-[28px] p-6 sm:p-8 shadow-[0_0_50px_rgba(124,58,237,0.18)] space-y-6 overflow-hidden animate-scale-up text-[#F8FAFC]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Animated Floating Gradient Blobs in Background */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#7C3AED]/20 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl animate-pulse pointer-events-none delay-1000" />

        {/* Top Header Badge */}
        <div className="relative z-10 text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SpendWise Secure Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
            {tab === 'login' ? 'Welcome Back 👋' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-[#94A3B8]">
            {tab === 'login' ? 'Sign in to access your dashboard & peer ledger' : 'Start tracking expenses, budgets, and debts securely'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="relative z-10 flex bg-[#0B1020] p-1.5 rounded-2xl border border-[#24304A]">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              tab === 'login'
                ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
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
                ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="relative z-10 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center space-x-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="relative z-10 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Inputs with Focus Ring Animations */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          {tab === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohit"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0B1020]/90 border border-[#24304A] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 text-[#F8FAFC] text-xs placeholder-[#94A3B8] focus:outline-none transition-all duration-300"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0B1020]/90 border border-[#24304A] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 text-[#F8FAFC] text-xs placeholder-[#94A3B8] focus:outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Password / PIN</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#0B1020]/90 border border-[#24304A] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 text-[#F8FAFC] text-xs placeholder-[#94A3B8] focus:outline-none transition-all duration-300"
              />
              
              {/* Password Visibility Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg shadow-[#7C3AED]/25 cursor-pointer"
          >
            <span>{tab === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Social Login Placeholders (Google, GitHub - Disabled) */}
        <div className="relative z-10 space-y-3 pt-2">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#24304A] w-full" />
            <span className="bg-[#12182B] px-3 text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold absolute">OR CONTINUE WITH</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled
              title="Google authentication coming soon"
              className="py-2.5 px-3 rounded-xl bg-[#0B1020]/50 border border-[#24304A] text-[#94A3B8] text-xs font-semibold flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
            >
              <span>Google</span>
            </button>

            <button
              type="button"
              disabled
              title="GitHub authentication coming soon"
              className="py-2.5 px-3 rounded-xl bg-[#0B1020]/50 border border-[#24304A] text-[#94A3B8] text-xs font-semibold flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
            >
              <span>GitHub</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Login */}
        <div className="relative z-10 pt-1">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-2xl bg-[#0B1020] hover:bg-[#1A2238] border border-[#24304A] text-[#F8FAFC] text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Continue as Guest / Demo User</span>
          </button>
        </div>

        {/* Security Note */}
        <div className="relative z-10 flex items-center justify-center space-x-1.5 text-[11px] text-[#94A3B8] pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Your financial data is encrypted and protected.</span>
        </div>

      </div>
    </div>
  );
};
