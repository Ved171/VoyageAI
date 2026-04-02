import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, User as UserIcon, Calendar, Receipt, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { TripMemberInfo } from '../../types';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    members: TripMemberInfo[];
    currentUser: any;
    onSuccess: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    isOpen,
    onClose,
    tripId,
    members,
    currentUser,
    onSuccess
}) => {
    const { user } = useAuth();
    // Use prop if provided, fallback to context
    const activeUserId = currentUser?._id || user?._id;
    const [title, setTitle] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && members.length > 0) {
            setTitle('');
            setTotalAmount('');
            // Default to current user if they are in the trip, otherwise first member
            const myMember = members.find(m => m.userId._id.toString() === user?._id?.toString());
            setPaidBy(myMember?.userId._id || members[0]?.userId._id || '');
            setSelectedParticipants(members.map(m => m.userId._id));
            setDate(new Date().toISOString().split('T')[0]);
            setNotes('');
        }
    }, [isOpen, members, user?._id]);

    const handleToggleParticipant = (id: string) => {
        if (id === paidBy) return; // Cannot toggle payer off

        setSelectedParticipants(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    // Ensure paidBy is always in selectedParticipants
    useEffect(() => {
        if (paidBy && !selectedParticipants.includes(paidBy)) {
            setSelectedParticipants(prev => [...prev, paidBy]);
        }
    }, [paidBy]);



    const calculateSplits = () => {
        const amount = parseFloat(totalAmount) || 0;
        if (selectedParticipants.length === 0) return [];

        // Simple even split
        const share = amount / selectedParticipants.length;
        return selectedParticipants.map(id => ({
            userId: id,
            shareAmount: share
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !totalAmount || !paidBy || selectedParticipants.length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const splits = calculateSplits();
            await apiService.addExpense(tripId, {
                title,
                amount: parseFloat(totalAmount),
                paidBy,
                participants: splits,
                date,
                notes
            });
            toast.success('Expense recorded!');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-void/80 backdrop-blur-xl animate-fadeIn overflow-y-auto">
            <style>{`
        .expense-modal-solid { background-color: #0f172a; } /* Solid Slate-900 in Dark Theme */
        .light .expense-modal-solid { background-color: #ffffff; } /* Solid White in Light Theme */
      `}</style>
            <div className="w-full max-w-lg expense-modal-solid border border-brand-primary/20 rounded-[32px] animate-scaleIn shadow-2xl shadow-brand-primary/10 my-8">
                <div className="p-8 border-b border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-main tracking-tight uppercase">New Transaction</h2>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Shared Expedition Expense</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 glass-panel border-surface-border rounded-xl hover:bg-brand-primary/10 text-text-muted hover:text-text-main transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Expense Title (e.g. Dinner at Lumiere)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-void/80 border border-surface-border hover:border-brand-primary/30 rounded-2xl pl-12 pr-4 py-4 text-text-main focus:outline-none focus:border-brand-primary transition-all font-medium shadow-sm"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-text-muted group-focus-within:text-brand-primary transition-colors">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Total Amount"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    className="w-full bg-void/80 border border-surface-border hover:border-brand-primary/30 rounded-2xl pl-10 pr-4 py-4 text-text-main focus:outline-none focus:border-brand-primary transition-all font-black text-lg shadow-sm"
                                    required
                                />
                            </div>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-brand-primary transition-colors" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-void/80 border border-surface-border hover:border-brand-primary/30 rounded-2xl pl-12 pr-4 py-4 text-text-main focus:outline-none focus:border-brand-primary transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Payer Selection</p>
                            <div className="flex flex-wrap gap-2">
                                {/* Sort members so 'YOU' is always first */}
                                {[...members].sort((a, b) => {
                                    const aId = a.userId._id.toString();
                                    const bId = b.userId._id.toString();
                                    const myId = activeUserId?.toString();
                                    if (aId === myId) return -1;
                                    if (bId === myId) return 1;
                                    return 0;
                                }).map(member => {
                                    const mId = member.userId._id.toString();
                                    const uId = activeUserId?.toString();
                                    const mEmail = member.userId.email;
                                    const uEmail = user?.email;
                                    const mName = member.userId.name;
                                    const uName = user?.name;

                                    const isMe = mId === uId || (mEmail && uEmail && mEmail === uEmail);
                                    const isActive = paidBy === member.userId._id;

                                    return (
                                        <button
                                            key={member._id}
                                            type="button"
                                            onClick={() => setPaidBy(member.userId._id)}
                                            className={`px-5 py-3 rounded-xl text-[10px] cursor-pointer font-black uppercase tracking-widest border transition-all ${isActive ? 'bg-brand-primary text-[#020617] border-brand-primary shadow-xl shadow-brand-primary/30' : 'glass-panel border-surface-border text-text-muted opacity-50 hover:opacity-100'}`}
                                        >
                                            {isMe ? "YOU" : member.userId.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Split Configuration</p>
                            <div className="flex flex-wrap gap-2">
                                {members.map(member => {
                                    const isPayer = member.userId._id === paidBy;
                                    const isSelected = selectedParticipants.includes(member.userId._id);

                                    const mId = member.userId._id.toString();
                                    const uId = activeUserId?.toString();
                                    const mEmail = member.userId.email;
                                    const uEmail = user?.email;
                                    const mName = member.userId.name;
                                    const uName = user?.name;

                                    const isMe = mId === uId || (mEmail && uEmail && mEmail === uEmail);

                                    return (
                                        <button
                                            key={member._id}
                                            type="button"
                                            disabled={isPayer}
                                            onClick={() => handleToggleParticipant(member.userId._id)}
                                            title={isPayer ? "Payer is automatically included in the split" : `Include ${member.userId.name} in split`}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] cursor-pointer font-black uppercase tracking-widest border transition-all ${isSelected ? 'bg-brand-tertiary text-[#020617] border-brand-tertiary shadow-lg shadow-brand-tertiary/30' : 'glass-panel border-surface-border text-text-muted opacity-40 hover:opacity-100'} ${isPayer ? 'cursor-not-allowed opacity-90' : ''}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#020617]' : 'bg-text-muted'}`} />
                                            {isMe ? "YOU" : member.userId.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-2 text-[9px] text-text-muted font-bold opacity-60 flex justify-between uppercase">
                                <span>Equitable Distribution</span>
                                {parseFloat(totalAmount) > 0 && selectedParticipants.length > 0 && (
                                    <span>Individual Share: ₹{(parseFloat(totalAmount) / selectedParticipants.length).toFixed(2)}</span>
                                )}
                            </div>
                        </div>
                        <textarea
                            placeholder="Notes (optional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-void/80 border border-surface-border hover:border-brand-primary/30 rounded-2xl p-4 text-sm text-text-muted focus:outline-none focus:border-brand-primary transition-all font-medium min-h-[80px] shadow-sm"
                        />
                    </div>

                    <div className="pt-4 border-t border-surface-border flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-text-main transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] btn-primary py-4 uppercase tracking-[0.2em] font-black text-xs shadow-brand-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting ? <div className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Record Transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
