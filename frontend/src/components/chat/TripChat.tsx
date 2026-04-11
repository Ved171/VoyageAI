import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  Maximize2, 
  MessageSquare, 
  Paperclip,
  Loader2,
  Clock
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { apiService } from '../../services/apiService';
import { Message, UserSearchInfo } from '../../types';
import toast from 'react-hot-toast';

interface TripChatProps {
  tripId: string;
  currentUser: UserSearchInfo | null;
}

export const TripChat: React.FC<TripChatProps> = ({ tripId, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initial Load
    const fetchHistory = async () => {
      try {
        const history = await apiService.getTripMessages(tripId);
        setMessages(history);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();

    // 2. Socket Connection
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current.emit('join_trip', tripId);

    socketRef.current.on('message_received', (newMessage: Message) => {
      let isNearBottom = true;
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      }
      
      setMessages(prev => {
        // If not our message and not at bottom, we have an unread message
        if (newMessage.userId._id !== currentUser?._id && !isNearBottom) {
          setHasUnreadMessages(true);
        }
        return [...prev, newMessage];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [tripId]);

  // Auto-scroll logic
  useEffect(() => {
    // Only auto-scroll if we don't have unread messages 
    // (meaning we were already at the bottom or it's our own message being sent)
    if (!hasUnreadMessages) {
      scrollToBottom();
    }
  }, [messages, hasUnreadMessages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isAtBottom && hasUnreadMessages) {
        setHasUnreadMessages(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    const formData = new FormData();
    if (text.trim()) formData.append('text', text);
    if (selectedFile) formData.append('image', selectedFile);

    // Optimistic UI could be implemented but for simplicity we wait for socket/API
    try {
      await apiService.sendTripMessage(tripId, formData);
      setText('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass-card animate-pulse">
        <Loader2 className="h-10 w-10 text-brand-primary animate-spin mb-4" />
        <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Connecting to Comms Module...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[93vh] glass-card border-brand-primary/20 overflow-hidden relative group shadow-2xl">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-void/50 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
            <MessageSquare className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-main tracking-[0.2em] uppercase">Expedition Channel</h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Real-time active link
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-8 space-y-6 scrollbar-hide bg-void/30 relative"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale saturate-0 animate-fadeIn transition-all">
            <MessageSquare className="h-16 w-16 text-text-muted mb-4 opacity-20" />
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Broadcast frequency Clear</p>
            <p className="text-[9px] font-bold text-text-muted mt-2">Start the logs by typing below.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.userId._id === currentUser?._id;
            const msgDate = new Date(msg.createdAt).toLocaleDateString();
            const prevMsgDate = idx > 0 ? new Date(messages[idx - 1].createdAt).toLocaleDateString() : null;
            const showDateSeparator = msgDate !== prevMsgDate;

            return (
              <React.Fragment key={msg._id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-8">
                    <div className="h-[1px] flex-grow bg-white/5" />
                    <div className="px-6 py-2 rounded-full glass-panel border-white/5">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">
                        {new Date(msg.createdAt).toDateString() === new Date().toDateString()
                          ? 'Today'
                          : new Date(msg.createdAt).toDateString() === new Date(Date.now() - 86400000).toDateString()
                            ? 'Yesterday'
                            : new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="h-[1px] flex-grow bg-white/5" />
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeInUp`}>
                  <div className={`flex items-end gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar / Initial */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all ${isMe ? 'bg-brand-primary border-brand-primary text-void' : 'glass-panel border-white/10 text-text-muted'}`}>
                      {msg.userId.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Message Bubble */}
                    <div className={`relative px-5 py-4 rounded-3xl group/msg transition-all hover:scale-[1.01] ${isMe ? 'bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 border-brand-primary/30 text-text-main rounded-tr-none shadow-lg shadow-brand-primary/5' : 'glass-panel border-white/10 text-text-muted rounded-tl-none shadow-md'}`}>
                      {!isMe && (
                        <p className="text-[10px] font-black text-brand-tertiary uppercase tracking-widest mb-1 opacity-90">
                          {msg.userId.name}
                        </p>
                      )}

                      {msg.messageType === 'image' && msg.fileData && (
                        <div className="relative rounded-2xl overflow-hidden mb-2 group/media cursor-pointer" onClick={() => setExpandedImage(msg.fileData || null)}>
                          <img
                            src={msg.fileData}
                            alt="Shared log"
                            className="max-h-60 w-auto object-contain rounded-2xl transition-transform duration-500 group-hover/media:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 flex items-center justify-center transition-all">
                            <Maximize2 className="h-8 w-8 text-white scale-75 group-hover/media:scale-100 transition-all duration-500" />
                          </div>
                        </div>
                      )}

                      {msg.messageText && (
                        <p className="text-sm font-medium leading-relaxed">{msg.messageText}</p>
                      )}

                      <div className="mt-2 flex items-center gap-2 opacity-30">
                        <Clock className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={lastMessageRef} />

        {/* Scroll to Bottom Button */}
        {hasUnreadMessages && (
          <button 
            onClick={() => {
              setHasUnreadMessages(false);
              scrollToBottom();
            }}
            className="fixed bottom-32 right-12 z-50 w-12 h-12 rounded-full bg-brand-primary text-void shadow-2xl flex items-center justify-center animate-bounce transition-all hover:scale-110 active:scale-95"
          >
            <Clock className="h-5 w-5 rotate-180" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-void" />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-void/50 backdrop-blur-xl border-t border-white/5 relative z-20">
        {/* Preview Bubble - Improved for visibility and overflow */}
        {previewUrl && (
          <div className="absolute top-0 left-6 right-6 -translate-y-full mb-2 z-30 animate-fadeInUp">
            <div className="bg-void/90 dark:bg-bg-void/95 backdrop-blur-2xl p-3 rounded-2xl border border-brand-primary/40 flex items-center gap-4 shadow-2xl shadow-brand-primary/20 max-w-sm mx-auto md:mx-0">
              <div className="h-14 w-14 rounded-xl overflow-hidden border border-white/10 shadow-inner flex-shrink-0">
                 <img src={previewUrl} className="h-full w-full object-cover" alt="Upload preview" />
              </div>
              <div className="flex-grow min-w-0">
                 <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] mb-0.5">Ready for Transmission</p>
                 <p className="text-[10px] text-text-main font-bold truncate transition-colors duration-500">{selectedFile?.name}</p>
                 <p className="text-[8px] text-text-muted font-black uppercase tracking-tighter">{(selectedFile!.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-void transition-all border border-red-500/20"
                title="Discard attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-4 relative">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl glass-panel border-white/5 hover:border-brand-primary/40 hover:bg-brand-primary/5 flex items-center justify-center transition-all active:scale-95 text-text-muted hover:text-brand-primary group"
          >
            <Paperclip className="h-5 w-5 transition-transform group-hover:rotate-12" />
          </button>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <div className="flex-grow relative">
              <input 
                type="text"
                placeholder="Transmit mission update..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleSendMessage(e);
                  }
                }}
                className="w-full bg-void/50 border border-white/10 rounded-2xl pl-6 pr-6 py-5 text-text-main focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all font-medium placeholder:text-text-muted/40 shadow-inner"
              />
          </div>

          <button 
            type="submit"
            disabled={(!text.trim() && !selectedFile) || isSending}
            className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center text-void shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-30"
          >
            {isSending ? (
               <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
               <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>

      {/* Lightbox — Portaled to root to escape parent overflow & filters */}
      {expandedImage && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-3xl p-4 md:p-12 flex items-center justify-center animate-fadeIn cursor-zoom-out"
          onClick={() => setExpandedImage(null)}
        >
          <button className="absolute top-6 right-6 md:top-10 md:right-10 p-4 text-white hover:rotate-90 transition-all z-[10000]">
             <X className="h-8 w-8 md:h-10 md:w-10" />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <img 
              src={expandedImage} 
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl md:rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
              alt="Expanded mission log view" 
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
