import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  User as UserIcon,
  Filter,
  History,
  TrendingUp,
  Receipt,
  CreditCard,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { Expense, Settlement, BalanceSummary, TripMemberInfo, UserSearchInfo } from '../../types';
import toast from 'react-hot-toast';
import { AddExpenseModal } from './AddExpenseModal';
import { SettleUpModal } from './SettleUpModal';
import { ConfirmationModal } from '../ConfirmationModal';
import { BalanceDetailsModal } from './BalanceDetailsModal';

interface TripExpensesProps {
  tripId: string;
  members: TripMemberInfo[];
  currentUser: UserSearchInfo | null;
}

export const TripExpenses: React.FC<TripExpensesProps> = ({ tripId, members, currentUser }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; expenseId: string | null }>({
    isOpen: false,
    expenseId: null
  });

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expData, settleData, summaryData] = await Promise.all([
        apiService.getExpenses(tripId),
        apiService.getSettlements(tripId),
        apiService.getBalanceSummary(tripId)
      ]);
      setExpenses(expData);
      setSettlements(settleData);
      setSummary(summaryData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load expense data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpenseRequest = (id: string) => {
    setDeleteConfirm({ isOpen: true, expenseId: id });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.expenseId) return;
    try {
      await apiService.deleteExpense(tripId, deleteConfirm.expenseId);
      toast.success('Expense deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense');
    } finally {
      setDeleteConfirm({ isOpen: false, expenseId: null });
    }
  };

  const myBalance = currentUser && summary ? (summary.balances[currentUser._id] || 0) : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card animate-pulse">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Syncing Ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeInUp">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 border-brand-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-primary/20 transition-colors" />
          <div className="relative">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-2">Total Expedition Spend</p>
            <h2 className="text-4xl font-black text-text-main tracking-tighter">₹{summary?.totalTripExpenses.toLocaleString() || 0}</h2>
            <div className="mt-4 flex items-center gap-2 text-brand-primary">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Active Credits</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setIsBalanceModalOpen(true)}
          role="button"
          tabIndex={0}
          className={`glass-card p-8 border-white/5 relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all ${myBalance > 0 ? 'border-emerald-500/20 hover:shadow-emerald-500/10' : myBalance < 0 ? 'border-red-500/20 hover:shadow-red-500/10' : ''}`}
        >
           <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] -translate-y-1/2 translate-x-1/2 transition-colors ${myBalance > 0 ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`} />
           <div className="relative">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-2">Your Net Balance</p>
            <h2 className={`text-4xl font-black tracking-tighter ${myBalance > 0 ? 'text-emerald-400' : myBalance < 0 ? 'text-red-400' : 'text-text-main'}`}>
              {myBalance === 0 ? '₹0' : (myBalance > 0 ? `+₹${myBalance.toLocaleString()}` : `-₹${Math.abs(myBalance).toLocaleString()}`)}
            </h2>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                {myBalance > 0 ? 'You are owed' : myBalance < 0 ? 'You owe friends' : 'You are all settled up'}
              </p>
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black text-text-main uppercase tracking-widest group-hover:bg-brand-primary group-hover:text-void group-hover:border-brand-primary transition-all shadow-sm">
                 View Details
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 border-white/5 flex flex-col justify-between">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-6">Financial Operations</p>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center justify-center gap-2 py-3 text-[10px] font-black"
            >
              <Plus className="h-4 w-4" /> ADD EXPENSE
            </button>
            <button 
              onClick={() => setIsSettleModalOpen(true)}
              className="glass-panel border-white/10 hover:bg-brand-secondary/10 flex items-center justify-center gap-2 py-3 text-[10px] font-black text-text-main transition-all active:scale-95"
            >
              <CreditCard className="h-4 w-4" /> SETTLE UP
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Expenses List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Transaction Log</h3>
            </div>
            <div className="flex gap-2">
               <button className="glass-panel p-2 rounded-lg border-white/5 text-text-muted hover:text-text-main">
                  <Filter className="h-4 w-4" />
               </button>
            </div>
          </div>

          <div className="space-y-4">
            {expenses.length === 0 ? (
               <div className="glass-card p-20 text-center border-dashed border-white/10">
                  <History className="h-12 w-12 text-text-muted mx-auto mb-4 opacity-20" />
                  <p className="text-text-muted font-bold">No expenses recorded yet.</p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-6 text-brand-primary text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    + Record First Transaction
                  </button>
               </div>
            ) : (
              expenses.map((exp) => (
                <div key={exp._id} className="glass-panel p-6 rounded-3xl border-white/5 hover:border-white/20 transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl glass-panel flex flex-col items-center justify-center border-white/10">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter">
                        {new Date(exp.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-xl font-black text-text-main leading-tight">
                        {new Date(exp.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-main group-hover:text-brand-primary transition-colors">{exp.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          Paid by <span className="text-text-main">{exp.paidBy?.name || 'Someone'}</span>
                        </span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          {exp.participants.length} Participants
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 text-right">
                    <div>
                      <p className="text-xl font-black text-text-main">₹{exp.amount.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-brand-tertiary uppercase tracking-widest">Total Transaction</p>
                    </div>
                    
                    {/* Delete button (only for creator/owner) */}
                    {(exp.createdBy?._id === currentUser?._id || members.find(m => m.userId._id === currentUser?._id && m.role === 'owner')) && (
                      <button 
                        onClick={() => handleDeleteExpenseRequest(exp._id)}
                        className="p-3 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-white/40 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Friends Balances */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-orange-400" />
             </div>
             <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Expedition Members</h3>
          </div>

          <div className="glass-card p-6 space-y-6 border-white/5">
            {members.map((member) => {
               const bal = summary?.balances[member.userId._id] || 0;
               return (
                 <div key={member._id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center border-white/10 group-hover:border-brand-primary/40 transition-colors">
                          <UserIcon className="h-5 w-5 text-text-muted" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-text-main">
                            {member.userId.name} {member.userId._id === currentUser?._id && <span className="opacity-40">(You)</span>}
                          </p>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{member.role}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm font-black ${bal > 0 ? 'text-emerald-400' : bal < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                          {bal === 0 ? 'Settled' : (bal > 0 ? `+₹${bal.toLocaleString()}` : `-₹${Math.abs(bal).toLocaleString()}`)}
                       </p>
                       <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40">Net</p>
                    </div>
                 </div>
               );
            })}
          </div>

          {/* Settlements History */}
          <div className="pt-6 border-t border-white/5">
             <div className="flex items-center gap-3 mb-6">
                <History className="h-4 w-4 text-brand-secondary" />
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Recent Settlements</h4>
             </div>
             <div className="space-y-4">
                {settlements.slice(0, 5).map((s) => (
                  <div key={s._id} className="flex items-center justify-between text-xs glass-panel p-4 rounded-2xl border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-brand-secondary" />
                       </div>
                       <div>
                          <p className="font-bold text-text-main">
                             {s.fromUser.name} paid {s.toUser.name}
                          </p>
                          <p className="text-[9px] text-text-muted uppercase font-black">{new Date(s.date).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <p className="font-black text-brand-secondary">₹{s.amount.toLocaleString()}</p>
                  </div>
                ))}
                {settlements.length === 0 && <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest text-center py-4">No settlements yet</p>}
             </div>
          </div>
        </div>
      </div>

      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        tripId={tripId} 
        members={members} 
        currentUser={currentUser}
        onSuccess={fetchData} 
      />
      
      <SettleUpModal 
        isOpen={isSettleModalOpen} 
        onClose={() => setIsSettleModalOpen(false)} 
        tripId={tripId} 
        members={members.filter(m => m.userId._id !== currentUser?._id)} 
        onSuccess={fetchData} 
      />

      <BalanceDetailsModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        balances={summary?.balances || {}}
        members={members}
        currentUser={currentUser}
      />

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Zero-Out Transaction"
        message="Are you sure you want to delete this expense? This will permanently adjust the expedition balance for all participants."
        confirmLabel="Confirm Deletion"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, expenseId: null })}
        variant="danger"
      />
    </div>
  );
};
