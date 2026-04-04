import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X, Check } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          btn: 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
        };
      case 'warning':
      case 'warning':
        return {
          icon: 'text-orange-500',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          btn: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
        };
      default:
        return {
          icon: 'text-brand-primary',
          bg: 'bg-brand-primary/10',
          border: 'border-brand-primary/20',
          btn: 'bg-brand-primary hover:bg-brand-primary/80 shadow-brand-primary/20'
        };
    }
  };

  const styles = getVariantStyles();

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-fadeIn">
      {/* Clickable Backdrop with strong blur */}
      <div 
        className="fixed inset-0 bg-void/60 transition-all duration-500" 
        style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        onClick={onCancel} 
      />
      <div className={`w-full max-w-sm glass-card ${styles.border} animate-scaleIn shadow-2xl relative overflow-y-auto max-h-[90vh] group z-10 custom-scrollbar`}>
        {/* Background glow base on variant */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${variant === 'danger' ? 'bg-red-500/5' : 'bg-brand-primary/5'} blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none`} />

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl ${styles.bg} flex items-center justify-center shrink-0`}>
              <AlertCircle className={`h-6 w-6 ${styles.icon}`} />
            </div>
            <div>
              <h3 className="text-sm font-black text-text-main tracking-[0.2em] uppercase">{title}</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 opacity-60">Authentication Required</p>
            </div>
          </div>

          <p className="text-sm font-medium text-text-muted leading-relaxed mb-10">
            {message}
          </p>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-4 glass-panel border-white/5 hover:bg-white/5 text-[10px] font-black text-text-muted uppercase tracking-widest transition-all active:scale-95"
            >
              {cancelLabel}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              className={`flex-[1.5] ${styles.btn} py-4 rounded-xl text-void text-[10px] font-black uppercase tracking-[0.3em] shadow-lg transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2`}
            >
              <Check className="h-4 w-4" />
              {confirmLabel}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-main"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
};
