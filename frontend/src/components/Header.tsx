import React, { useState, lazy, Suspense } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Globe, User, LogOut, Heart, ChevronDown, Rocket, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close menu and handle scroll locking (html + body avoids iOS scroll/click quirks)
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

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
      <header className="sticky top-0 w-full py-4 md:py-6 px-4 sm:px-6 md:px-8 flex items-center justify-between z-[100] backdrop-blur-md bg-bg-void/80 border-b border-surface-border/50">
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
        <nav className="hidden lg:flex items-center glass-panel rounded-full p-1 md:p-2 border border-surface-border shadow-2xl transition-colors duration-500">
          <NavLink to="/" className={({ isActive }) => `px-4 xl:px-6 py-2 rounded-full text-[10px] xl:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-muted hover:text-text-main hover:bg-brand-primary/5'}`}>Home</NavLink>
          <NavLink to="/destinations" className={({ isActive }) => `px-4 xl:px-6 py-2 rounded-full text-[10px] xl:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-muted hover:text-text-main hover:bg-brand-primary/5'}`}>Destinations</NavLink>
          <NavLink to="/saved-trips" className={({ isActive }) => `px-4 xl:px-6 py-2 rounded-full text-[10px] xl:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-muted hover:text-text-main hover:bg-brand-primary/5'}`}>My Trips</NavLink>
          <button onClick={() => setIsAboutModalOpen(true)} className="px-4 xl:px-6 py-2 rounded-full text-[10px] xl:text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-main hover:bg-brand-primary/5 transition-all whitespace-nowrap">About</button>
        </nav>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Favorites - Hidden on mobile, moved to menu */}
          <div className="hidden md:flex items-center gap-2 md:ml-4 lg:ml-8">
            <Link to="/favorites" title="Favorites" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-panel flex items-center justify-center hover:bg-brand-primary/10 transition-all active:scale-90 border-surface-border group">
              <Heart className="h-5 w-5 text-text-muted group-hover:text-brand-secondary transition-colors" />
            </Link>
          </div>
          
          <div className="h-10 w-[1px] bg-surface-border hidden lg:block" />

          {/* User Status - Desktop Only */}
          <div className="relative hidden lg:block">
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

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden relative z-[110] w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-panel flex items-center justify-center hover:bg-brand-primary/10 transition-all border-surface-border active:scale-95"
            aria-label="Toggle Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5 md:h-6 md:w-6 text-brand-primary" /> : <Menu className="h-5 w-5 md:h-6 md:w-6 text-text-main" />}
          </button>
        </div>
      </header>

      {/* Mobile menu: z-90 sits above page content (z-auto) but below this header (z-100) so the bar + hamburger stay interactive */}
      <div
        className={`fixed inset-0 z-[90] isolate lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div
          className="absolute inset-0 z-0 bg-bg-void/40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />

        <div
          className={`absolute left-4 right-4 top-[5.5rem] z-10 max-h-[min(70vh,calc(100dvh-7rem))] overflow-y-auto overscroll-contain glass-card border-surface-border p-6 shadow-2xl transition-all duration-300 md:p-8 ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          <nav className="flex flex-col gap-3">
            {/* User Info in Mobile Menu */}
            <div className="flex items-center gap-4 p-4 mb-2 bg-brand-primary/5 rounded-3xl border border-brand-primary/10 transition-colors duration-500">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center border border-surface-border shrink-0">
                  <span className="text-text-main text-xs font-black">{initials}</span>
               </div>
               <div className="overflow-hidden">
                  <p className="text-sm font-black text-text-main leading-tight truncate transition-colors duration-500">{user?.name || 'Explorer'}</p>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter truncate transition-colors duration-500">{user?.email}</p>
               </div>
            </div>

            {[
              { to: '/', label: 'Home' },
              { to: '/destinations', label: 'Destinations' },
              { to: '/saved-trips', label: 'My Trips' },
              { to: '/favorites', label: 'Favorites' },
            ].map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `px-8 py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-between ${
                    isActive 
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30' 
                      : 'text-text-muted hover:text-text-main hover:bg-brand-primary/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAboutModalOpen(true);
              }}
              className="px-8 py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] text-text-muted hover:text-text-main hover:bg-brand-primary/5 text-left border border-transparent transition-all"
            >
              About VoyageAI
            </button>
            <button 
              onClick={handleLogout}
              className="px-8 py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] text-brand-secondary hover:bg-brand-secondary/10 text-left border border-brand-secondary/20 transition-all flex items-center justify-between group"
            >
              Log Out
              <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="mt-2 pt-6 border-t border-surface-border flex items-center justify-between">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest transition-colors duration-500">Toggle Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>

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
