import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Rocket, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Globe, 
  ShieldCheck,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC<{ initialMode?: AuthMode }> = ({ initialMode = 'login' }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden bg-bg-void py-4 px-4 items-center justify-center transition-colors duration-500">
      
      {/* Theme Toggle Positioned Top Right */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
        <ThemeToggle />
      </div>
      
      {/* Dynamic Space Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-brand-secondary/10 rounded-full blur-[100px]" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 brightness-50" />
      </div>

      <div className="w-full max-w-[500px] relative z-10 animate-fadeInUp">
        
        {/* Logo Section */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-solar rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/20">
              <Rocket className="h-5 w-5 md:h-7 md:w-7 text-void" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-text-main leading-none transition-colors duration-500">
                VOYAGE<span className="text-gradient">AI</span>
              </h1>
              <span className="text-[8px] md:text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mt-1 leading-none transition-colors duration-500 transition-colors duration-500">Smart Travel Planner</span>
            </div>
          </div>
        </div>

        {/* Auth Container */}
        <div className="glass-card p-6 md:p-12 border-surface-border shadow-2xl transition-all duration-500">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-text-main mb-2 transition-colors duration-500">
              {mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
            </h2>
            <p className="text-text-muted font-medium text-sm tracking-tight transition-colors duration-500">
              {mode === 'login'
                ? 'Sign in to access your travel dashboard.'
                : 'Create your profile to start planning trips.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="glass-panel border-red-500/20 rounded-2xl p-4 animate-fadeIn">
                <p className="text-red-400 text-xs font-bold text-center uppercase tracking-widest">{error}</p>
              </div>
            )}

            {/* Name Field (Signup Only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] pl-1 transition-colors duration-500">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted opacity-60 group-focus-within:text-brand-primary group-focus-within:opacity-100 transition-all" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="w-full pl-14 pr-6 py-4 bg-brand-primary/5 border border-surface-border rounded-2xl text-text-main font-bold placeholder:text-text-muted transition-all text-sm focus:outline-none focus:border-brand-primary/30 focus:bg-brand-primary/10"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] pl-1 transition-colors duration-500">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted opacity-60 group-focus-within:text-brand-primary group-focus-within:opacity-100 transition-all" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@sector.com"
                  required
                  className="w-full pl-14 pr-6 py-4 bg-brand-primary/5 border border-surface-border rounded-2xl text-text-main font-bold placeholder:text-text-muted transition-all text-sm focus:outline-none focus:border-brand-primary/30 focus:bg-brand-primary/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] pl-1 transition-colors duration-500">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted opacity-60 group-focus-within:text-brand-primary group-focus-within:opacity-100 transition-all" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-14 pr-14 py-4 bg-brand-primary/5 border border-surface-border rounded-2xl text-text-main font-bold placeholder:text-text-muted transition-all text-sm focus:outline-none focus:border-brand-primary/30 focus:bg-brand-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-3 relative overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-brand-primary/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 text-lg uppercase">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-void/30 border-t-void rounded-full animate-spin mx-auto" />
                ) : (
                  mode === 'login' ? 'Sign In' : 'Sign Up'
                )}
              </span>
              {!isLoading && <ArrowRight className="h-5 w-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Toggle Section */}
          <div className="mt-10 pt-8 border-t border-surface-border text-center">
            <p className="text-sm text-text-muted font-bold uppercase tracking-tight transition-colors duration-500">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-2 text-brand-primary font-black hover:text-text-main transition-colors"
              >
                {mode === 'login' ? 'CREATE ID' : 'SIGN IN'}
              </button>
            </p>
          </div>
        </div>

        {/* Security Badges */}
        <div className="flex items-center justify-center gap-8 mt-10 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700 cursor-default">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-tertiary" />
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest transition-colors duration-500">Secure & Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-primary" />
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest transition-colors duration-500">Privacy Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
