import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Download, Shield, Cpu } from 'lucide-react';
import { TwitterIcon, InstagramIcon, LinkedInIcon } from './icons/Icons';
import { exportProjectGuide } from '../utils/projectGuideExporter';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full relative py-6 px-8 lg:px-20 mt-6 bg-card-bg backdrop-blur-3xl border-t border-surface-border transition-colors duration-500">
      {/* Distinction Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent shadow-[0_0_15px_#ff9153]" />

      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-white/5 pb-6">
          {/* Brand & Mission Statement */}
          <div className="md:col-span-8 pr-12">
            <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-gradient-solar rounded-xl flex items-center justify-center shadow-xl shadow-brand-primary/15 transition-transform duration-500 group-hover:scale-110">
              <Rocket className="h-5 w-5 text-void" />
            </div>
              <h2 className="text-2xl font-black text-text-main tracking-tighter transition-colors duration-500">
                VOYAGE<span className="text-gradient">AI</span>
              </h2>
            </div>
            <p className="text-sm font-medium text-text-muted leading-relaxed max-w-2xl mb-6 transition-colors duration-500">
              Your AI-powered travel companion. We help you plan personalized itineraries for any destination around the world.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" className="w-8 h-8 rounded-lg glass-panel border-surface-border flex items-center justify-center text-text-muted hover:text-brand-primary hover:border-brand-primary/30 transition-all">
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a href="https://instagram.com" className="w-8 h-8 rounded-lg glass-panel border-surface-border flex items-center justify-center text-text-muted hover:text-brand-secondary hover:border-brand-secondary/30 transition-all">
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" className="w-8 h-8 rounded-lg glass-panel border-surface-border flex items-center justify-center text-text-muted hover:text-blue-400 hover:border-blue-400/30 transition-all">
                <LinkedInIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Access */}
          <div className="md:col-span-4">
            <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] mb-6">Quick Links</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <Link to="/" className="text-[10px] font-black text-text-muted hover:text-text-main hover:bg-brand-primary/5 px-2 py-1 rounded-md uppercase tracking-widest transition-all">Home</Link>
              <Link to="/destinations" className="text-[10px] font-black text-text-muted hover:text-text-main hover:bg-brand-primary/5 px-2 py-1 rounded-md uppercase tracking-widest transition-all">Destinations</Link>
              <Link to="/saved-trips" className="text-[10px] font-black text-text-muted hover:text-text-main hover:bg-brand-primary/5 px-2 py-1 rounded-md uppercase tracking-widest transition-all">My Trips</Link>
            </div>
          </div>
        </div>

        {/* Footer Bottom Metadata */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-black text-text-muted opacity-60 uppercase tracking-[0.2em] transition-colors duration-500">
            &copy; {currentYear} // VOYAGEAI // ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-8">
            <span className="text-[10px] font-black text-text-muted opacity-80 uppercase tracking-widest flex items-center gap-3 transition-colors duration-500">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-tertiary shadow-[0_0_8px_#9bffce]" />
              All Systems Online
            </span>
            <span className="text-[10px] font-black text-text-muted opacity-80 uppercase tracking-widest transition-colors duration-500">
              Fast & Reliable
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);