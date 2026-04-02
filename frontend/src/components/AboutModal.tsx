import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Rocket, Shield, Globe, Compass, Zap } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-bg-void/80 backdrop-blur-xl flex items-center justify-center z-[200] animate-fadeIn p-6 transition-colors duration-500"
      onClick={onClose}
    >
      <div
        className="glass-card max-w-3xl w-full mx-auto p-12 relative animate-fadeInUp border-surface-border overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-tertiary/10 blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <button
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 rounded-xl glass-panel flex items-center justify-center border-surface-border text-text-muted hover:text-text-main transition-all hover:rotate-90 z-20"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="w-16 h-16 bg-gradient-solar rounded-[22px] flex items-center justify-center mb-8 rotate-12 shadow-2xl shadow-brand-primary/20">
              <Rocket className="h-8 w-8 text-void" />
            </div>
            <h2 className="text-5xl font-black text-text-main tracking-tighter mb-4 uppercase transition-colors duration-500">
              ABOUT <span className="text-gradient">US</span>
            </h2>
            <div className="px-6 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20">
              <p className="text-[10px] font-black tracking-[0.4em] text-brand-primary uppercase">Smart Travel Planning, Powered by AI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest transition-colors duration-500">Global Reach</h3>
              </div>
              <p className="text-sm text-text-muted font-medium leading-relaxed transition-colors duration-500">
                Using AI and global travel data to create personalized itineraries for any destination worldwide.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-brand-tertiary" />
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest transition-colors duration-500">Your Data is Safe</h3>
              </div>
              <p className="text-sm text-text-muted font-medium leading-relaxed transition-colors duration-500">
                Your travel plans and personal data are encrypted and kept private. We never share your information.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest transition-colors duration-500">Off the Beaten Path</h3>
              </div>
              <p className="text-sm text-text-muted font-medium leading-relaxed transition-colors duration-500">
                Our AI finds unique experiences and hidden gems, not just the usual tourist spots.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-brand-primary" />
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest transition-colors duration-500">AI-Powered</h3>
              </div>
              <p className="text-sm text-text-muted font-medium leading-relaxed transition-colors duration-500">
                Powered by advanced AI, we turn your preferences into a complete day-by-day travel itinerary.
              </p>
            </div>
          </div>

          <div className="p-8 glass-panel border-brand-primary/20 rounded-[32px] bg-brand-primary/5">
            <p className="text-lg font-bold text-text-main italic text-center leading-relaxed transition-colors duration-500">
              "We don't just plan trips; we craft the stories that make every journey unforgettable."
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default React.memo(AboutModal);