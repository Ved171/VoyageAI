import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, Shield, User as UserIcon } from 'lucide-react';
import { TripMemberInfo, UserSearchInfo } from '../types';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currentUserRole?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, tripId, currentUserRole = 'viewer' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchInfo[]>([]);
  const [members, setMembers] = useState<TripMemberInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen && tripId) {
      fetchMembers();
    }
  }, [isOpen, tripId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getTripMembers(tripId);
      setMembers(data);
    } catch (error: any) {
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await apiService.searchUsers(query);
      // Filter out users who are already members
      const existingUserIds = new Set(members.map(m => m.userId?._id));
      setSearchResults(results.filter(u => !existingUserIds.has(u._id)));
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await apiService.addTripMember(tripId, userId, 'member');
      toast.success('Member added successfully');
      setSearchQuery('');
      setSearchResults([]);
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await apiService.leaveTrip(tripId, userId);
      toast.success('Member removed');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Modal Overlay */}
      <div
        className="absolute inset-0 bg-void/80 backdrop-blur-xl transition-all"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg glass-card rounded-[32px] overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(255,145,83,0.1)] animate-fadeInUp">

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-surface-border bg-void/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[50px] -translate-y-1/2 translate-x-1/2" />
          <div>

            <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter italic">
              Trip Members
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-2xl glass-panel text-text-muted hover:text-text-main hover:bg-brand-primary/10 transition-all text-sm border-surface-border relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">

          {/* Search Bar - ONLY VISIBLE FOR OWNERS */}
          {currentUserRole === 'owner' && (
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-brand-primary">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-void/50 border border-surface-border rounded-2xl py-4 pl-12 pr-4 text-text-main text-sm font-medium placeholder:text-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all shadow-inner"
              />
              {isSearching && (
                <div className="absolute right-5 top-4">
                  <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {currentUserRole === 'owner' && searchResults.length > 0 && (
            <div className="mb-8 glass-panel rounded-2xl border border-brand-tertiary/20 overflow-hidden shadow-lg shadow-brand-tertiary/5">
              <h3 className="px-5 py-3 text-[10px] font-black text-brand-tertiary uppercase tracking-widest bg-brand-tertiary/10 border-b border-brand-tertiary/20">
                Suggested Travelers
              </h3>
              <div className="divide-y divide-surface-border max-h-48 overflow-y-auto scrollbar-hide">
                {searchResults.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-4 hover:bg-brand-primary/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-lg border border-brand-primary/20 group-hover:bg-brand-primary transition-all">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm">
                        <p className="text-text-main font-bold capitalize">{user.name}</p>
                        <p className="text-text-muted text-xs font-mono opacity-70">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user._id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-brand-tertiary hover:bg-brand-tertiary transition-all shadow-lg active:scale-95"
                      title="Add user"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Members */}
          <div>
            <h3 className="text-[10px] font-black text-text-muted tracking-widest uppercase mb-4 pl-2">
              Active Members ({members.length})
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Ensure Owners are at the top */}
                {[...members].sort((a, b) => (a.role === 'owner' ? -1 : 1)).map(member => (
                  <div key={member._id} className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-surface-border hover:border-brand-primary/20 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${member.role === 'owner' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'glass-panel text-text-muted transition-colors'}`}>
                        {member.role === 'owner' ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6 opacity-70" />}
                      </div>
                      <div className="text-sm">
                        <p className="text-text-main font-bold text-base capitalize tracking-tight">
                          {member.userId?.name || 'Unknown Explorer'}
                        </p>
                        <p className="text-text-muted text-[10px] uppercase tracking-widest font-black mt-1 flex items-center gap-2">
                          {member.role === 'owner' ? (
                            <span className="text-brand-primary">Trip Owner</span>
                          ) : (
                            <span className="opacity-70">Member</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Only show remove button if current user is owner, AND the member being rendered is not owner */}
                    {currentUserRole === 'owner' && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.userId._id)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-text-muted hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all opacity-50 group-hover:opacity-100"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-border bg-void/80">
          <button
            onClick={onClose}
            className="w-full btn-primary py-4 shadow-brand-primary/20 text-sm font-black uppercase tracking-widest rounded-2xl"
          >
            Confirm & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
