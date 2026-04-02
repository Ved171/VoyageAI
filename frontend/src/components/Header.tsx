import React, { useState, lazy, Suspense } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Globe, User, LogOut, Heart, ChevronDown, Rocket } from 'lucide-react';
import { Localization } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const AboutModal = lazy(() => import('./AboutModal'));

interface HeaderProps {
  onGoHome: () => void;
  localization: Localization | null;
}

const Header: React.FC<HeaderProps> = ({ onGoHome, localization }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <>
      <header className="py-10 px-16 lg:px-20 flex items-center justify-between z-50">
        <Link 
          to="/" 
          className="flex items-center cursor-pointer group" 
          onClick={onGoHome}
        >
          <div className="w-14 h-14 bg-gradient-solar rounded-2xl flex items-center justify-center mr-4 group-hover:rotate-12 transition-all shadow-xl shadow-brand-primary/20">
            <Rocket className="h-7 w-7 text-void" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black tracking-tighter text-text-main leading-none transition-colors duration-500">
              VOYAGE<span className="text-gradient">AI</span>
            </span>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mt-1 leading-none transition-colors duration-500">Smart Travel Planner</span>
          </div>
        </Link>

        {/* Floating Nav */}
        <nav className="hidden xl:flex items-center glass-panel rounded-full p-2 border border-surface-border shadow-2xl transition-colors duration-500">
          <NavLink to="/" className={({ isActive }) => `px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-muted hover:text-text-main hover:bg-brand-primary/5'}`}>Home</NavLink>
          <NavLink to="/destinations" className={({ isActive }) => `px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-muted hover:text-text-main hover:bg-brand-primary/5'}`}>Destinations</NavLink>
          <NavLink to="/saved-trips" className={({ isActive }) => `px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-muted hover:text-text-main hover:bg-brand-primary/5'}`}>My Trips</NavLink>
          <button onClick={() => setIsAboutModalOpen(true)} className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-main hover:bg-brand-primary/5 transition-all">About</button>
        </nav>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Link to="/favorites" title="Favorites" className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center hover:bg-brand-primary/10 transition-all active:scale-90 border-surface-border group">
              <Heart className="h-5 w-5 text-text-muted group-hover:text-brand-secondary transition-colors" />
            </Link>
          </div>
          
          <div className="h-10 w-[1px] bg-surface-border hidden md:block" />

          {/* User Status */}
          <div className="relative">
            <div 
              className="flex items-center glass-card p-1.5 pr-6 cursor-pointer hover:bg-brand-primary/5 border-surface-border"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-11 h-11 rounded-2xl mr-4 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center border border-surface-border overflow-hidden">
                <span className="text-text-main text-xs font-black drop-shadow-md transition-colors duration-500">{initials}</span>
              </div>
              <div className="hidden md:block mr-4">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 leading-none transition-colors duration-500">Account</p>
                <p className="text-sm font-black text-text-main leading-none whitespace-nowrap transition-colors duration-500">{user?.name || 'Explorer'}</p>
              </div>
              <ChevronDown className={`ml-4 h-4 w-4 text-text-muted transition-all duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-16 glass-card p-3 min-w-[240px] z-50 animate-fadeInUp shadow-2xl border-surface-border bg-card-bg">
                <div className="px-5 py-4 border-b border-surface-border">
                  <p className="text-sm font-black text-text-main mb-1 transition-colors duration-500">{user?.name}</p>
                  <p className="text-xs text-text-muted font-bold overflow-hidden text-ellipsis uppercase tracking-tighter transition-colors duration-500">{user?.email}</p>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-black text-brand-secondary hover:bg-brand-secondary/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Overlay to close menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowUserMenu(false)} />
      )}

      {isAboutModalOpen && (
        <Suspense fallback={null}>
          <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default React.memo(Header);
