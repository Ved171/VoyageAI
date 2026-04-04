import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, User as UserIcon, CreditCard, ArrowRight, ChevronDown, Check } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { TripMemberInfo } from '../../types';
import toast from 'react-hot-toast';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  members: TripMemberInfo[];
  onSuccess: () => void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  tripId,
  members,
  onSuccess
}) => {
  const [toUser, setToUser] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);
  const memberPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setToUser(members[0]?.userId._id || '');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setMemberMenuOpen(false);
    }
  }, [isOpen, members]);

  useEffect(() => {
    if (!memberMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = memberPickerRef.current;
      if (el && !el.contains(e.target as Node)) setMemberMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [memberMenuOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUser || !amount) {
      toast.error('Please specify target user and amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.addSettlement(tripId, {
        toUser,
        amount: parseFloat(amount),
        date
      });
      toast.success('Balance settled!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to settle balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-void/80 backdrop-blur-xl animate-fadeIn">
      <style>{`
        .settle-modal-solid { background-color: #0f172a; }
        .light .settle-modal-solid { background-color: #ffffff; }
      `}</style>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-visible rounded-[32px] border border-brand-secondary/20 settle-modal-solid shadow-2xl shadow-brand-secondary/10 animate-scaleIn">
        <div className="p-8 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-brand-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-main tracking-tight uppercase">Settle Up</h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Clear Outstanding Debt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 glass-panel border-white/5 rounded-xl hover:bg-white/5 transition-all"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center mb-3 border border-brand-primary/20">
                  <UserIcon className="h-8 w-8 text-brand-primary" />
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">You</p>
              </div>
              <ArrowRight className="h-6 w-6 text-text-muted opacity-40 animate-pulse" />
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center mb-3 border border-brand-secondary/20">
                  <UserIcon className="h-8 w-8 text-brand-secondary" />
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Friend</p>
              </div>
            </div>

            <div className="space-y-3 relative group">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Settling payment to:</p>
              <div className="relative" ref={memberPickerRef}>
                <button
                  type="button"
                  id="settle-payee-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={memberMenuOpen}
                  aria-controls="settle-payee-listbox"
                  onClick={() => setMemberMenuOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-void/50 px-6 py-4 text-left font-bold text-text-main shadow-sm transition-all hover:border-brand-secondary/30 focus:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary/20"
                >
                  <span className="truncate">
                    {members.find((m) => m.userId._id === toUser)?.userId.name ?? 'Choose member'}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-text-muted transition-transform group-hover:text-brand-secondary ${memberMenuOpen ? 'rotate-180 text-brand-secondary' : ''}`}
                  />
                </button>
                {memberMenuOpen && (
                  <ul
                    id="settle-payee-listbox"
                    role="listbox"
                    aria-labelledby="settle-payee-trigger"
                    className="glass-panel absolute left-0 right-0 z-[1300] mt-2 max-h-52 overflow-y-auto rounded-2xl py-2 shadow-2xl custom-scrollbar"
                  >
                    {members.map((member) => {
                      const selected = member.userId._id === toUser;
                      return (
                        <li key={member._id} role="presentation">
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              setToUser(member.userId._id);
                              setMemberMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold transition-colors ${
                              selected
                                ? 'bg-brand-secondary/15 text-brand-secondary'
                                : 'text-text-main hover:bg-brand-secondary/10'
                            }`}
                          >
                            <span className="truncate">{member.userId.name}</span>
                            {selected ? <Check className="h-4 w-4 shrink-0 text-brand-secondary" /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Amount Disbursed:</p>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-text-muted group-focus-within:text-brand-secondary transition-colors">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter value"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-void/50 border border-surface-border hover:border-brand-secondary/30 rounded-2xl pl-12 pr-6 py-4 text-text-main focus:outline-none focus:border-brand-secondary transition-all font-black text-3xl tracking-tight shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] bg-brand-secondary py-4 uppercase tracking-[0.2em] font-black text-xs text-void rounded-2xl shadow-brand-secondary/20 hover:shadow-brand-secondary/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
