import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleTheme();
      }}
      className={`relative w-20 h-10 rounded-full transition-all duration-500 border border-white/10 flex items-center p-1 cursor-pointer group hover:border-brand-primary/30 
        ${theme === 'dark' ? 'bg-bg-void/80' : 'bg-brand-primary/5'}`}
      aria-label="Toggle Theme"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className={`absolute w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg 
        ${theme === 'dark' 
          ? 'translate-x-[40px] bg-brand-primary shadow-brand-primary/20' 
          : 'translate-x-[0px] bg-white shadow-xl'}`}
      >
        {theme === 'dark' ? (
          <Moon className="h-5 w-5 text-void" />
        ) : (
          <Sun className="h-5 w-5 text-brand-primary" />
        )}
      </div>
      
      <div className="flex justify-between w-full px-3 opacity-40 group-hover:opacity-60 transition-opacity">
        <Sun className={`h-5 w-5 ${theme === 'light' ? 'invisible' : ''}`} />
        <Moon className={`h-5 w-5 ${theme === 'dark' ? 'invisible' : ''}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
