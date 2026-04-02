import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { TripMemberInfo, UserSearchInfo } from '../../types';

interface Debt {
  from: string;
  to: string;
  amount: number;
}

interface BalanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<string, number>;
  members: TripMemberInfo[];
  currentUser: UserSearchInfo | null;
}

export const BalanceDetailsModal: React.FC<BalanceDetailsModalProps> = ({
  isOpen,
  onClose,
  balances,
  members,
  currentUser
}) => {
  const getMemberName = (id: string) => {
    if (id === currentUser?._id) return 'You';
    return members.find(m => m.userId._id === id)?.userId.name || 'Unknown';
  };

  const debts = useMemo(() => {
    if (!balances || !currentUser) return [];

    let debtors: { id: string; val: number }[] = [];
    let creditors: { id: string; val: number }[] = [];

    Object.keys(balances).forEach(id => {
      const val = balances[id];
      if (val < -0.01) debtors.push({ id, val: Math.abs(val) });
      else if (val > 0.01) creditors.push({ id, val });
    });

    debtors.sort((a, b) => b.val - a.val);
    creditors.sort((a, b) => b.val - a.val);

    const calculatedDebts: Debt[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amountToSettle = Math.min(debtor.val, creditor.val);

      calculatedDebts.push({
        from: debtor.id,
        to: creditor.id,
        amount: Number(amountToSettle.toFixed(2))
      });

      debtor.val -= amountToSettle;
      creditor.val -= amountToSettle;

      if (debtor.val < 0.01) i++;
      if (creditor.val < 0.01) j++;
    }

    return calculatedDebts;
  }, [balances, currentUser]);

  if (!isOpen || !currentUser) return null;

  const iOwe = debts.filter(d => d.from === currentUser._id);
  const oweMe = debts.filter(d => d.to === currentUser._id);
  const totalIOwe = iOwe.reduce((sum, d) => sum + d.amount, 0);
  const totalOweMe = oweMe.reduce((sum, d) => sum + d.amount, 0);

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-void/80 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      
      <style>{`
        .balance-modal-solid { background-color: #0f172a; }
        .light .balance-modal-solid { background-color: #ffffff; }
      `}</style>

      <div
        className="w-full max-w-lg balance-modal-solid border border-surface-border rounded-[32px] animate-scaleIn shadow-2xl flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-lg shadow-orange-500/10">
              <RefreshCcw className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-main tracking-tight uppercase">
                Net Balances
              </h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mt-1">
                Settlement Matrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center border border-surface-border text-text-muted hover:text-text-main transition-all hover:rotate-90 shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">

          {/* You Owe */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <TrendingDown className="h-4 w-4" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                You Owe
              </h3>
              <div className="ml-auto text-xs font-bold px-2 py-1 bg-red-500/10 rounded-md">
                ₹{totalIOwe.toFixed(2)} total
              </div>
            </div>

            {iOwe.length === 0 ? (
              <p className="text-xs text-text-muted font-medium italic opacity-60">
                You don't owe anyone.
              </p>
            ) : (
              <div className="space-y-2">
                {iOwe.map((debt, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-4 rounded-2xl border border-red-500/20 bg-red-500/5"
                  >
                    <span className="text-sm font-bold text-text-main">
                      {getMemberName(debt.to)}
                    </span>
                    <span className="text-sm font-black text-red-400">
                      ₹{debt.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Owed to You */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                Owed to You
              </h3>
              <div className="ml-auto text-xs font-bold px-2 py-1 bg-emerald-500/10 rounded-md">
                ₹{totalOweMe.toFixed(2)} total
              </div>
            </div>

            {oweMe.length === 0 ? (
              <p className="text-xs text-text-muted font-medium italic opacity-60">
                No one owes you.
              </p>
            ) : (
              <div className="space-y-2">
                {oweMe.map((debt, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5"
                  >
                    <span className="text-sm font-bold text-text-main">
                      {getMemberName(debt.from)}
                    </span>
                    <span className="text-sm font-black text-emerald-400">
                      ₹{debt.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
