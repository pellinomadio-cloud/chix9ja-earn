import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface CommunityPageProps {
  user: User;
  onBack: () => void;
  onGoToUpgrade?: () => void;
}

interface ChatMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: any;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ user, onBack, onGoToUpgrade }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isVip = !!user.isVIP;

  useEffect(() => {
    if (!isVip) {
      setLoading(false);
      return;
    }

    const chatsQuery = query(
      collection(db, 'community_chats'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          name: data.name || 'Anonymous',
          email: data.email || '',
          message: data.message || '',
          timestamp: data.timestamp
        });
      });
      setMessages(msgs);
      setLoading(false);
      
      // Auto-scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error("Error reading chats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isVip]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    const msg = inputText.trim();
    setInputText('');

    try {
      await addDoc(collection(db, 'community_chats'), {
        name: user.name,
        email: user.email,
        message: msg,
        timestamp: serverTimestamp() || Date.now()
      });
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSending(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  if (!isVip) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 pb-24 font-sans relative overflow-hidden animate-in fade-in duration-200 flex flex-col justify-center items-center px-4">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-md w-full bg-zinc-900/60 backdrop-blur-md rounded-3xl p-8 border border-amber-500/20 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
            <Icons.Lock className="text-amber-500 h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-wider uppercase font-mono">
              VIP <span className="text-amber-500">Community</span>
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The Chix9ja VIP Community Chat is an exclusive lounge for our certified VIP members. Discuss investments, trading signals, and connect with fellow high-earners.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={onGoToUpgrade}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:from-amber-500 hover:to-amber-600 active:scale-95 transition-all cursor-pointer"
            >
              Upgrade to VIP Lounge
            </button>
            <button
              onClick={onBack}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 pb-24 font-sans relative overflow-hidden animate-in fade-in duration-200 flex flex-col">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md p-4 sticky top-0 z-30 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
          <Icons.ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-black text-white tracking-wider uppercase font-mono">
            Chix9ja <span className="text-amber-500">VIP Chat</span>
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Lounge Active
          </p>
        </div>
        <div className="w-8" />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full h-[60vh] min-h-[50vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Icons.Sync className="animate-spin text-amber-500" size={24} />
            <p className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">Hydrating VIP lounge feed...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-xs font-mono font-bold uppercase tracking-widest space-y-3">
            <p>👋 No messages yet in the VIP Lounge.</p>
            <p className="text-[10px] text-zinc-600 font-medium normal-case">Be the first to say hello to fellow VIPs!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.email.toLowerCase() === user.email.toLowerCase();
            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-bold text-zinc-500 font-mono">
                  <span>{isMe ? 'You' : msg.name}</span>
                  {!isMe && (
                    <span className="bg-amber-500/10 text-amber-400 text-[8px] px-1 py-0.2 rounded border border-amber-500/20 uppercase scale-90">VIP</span>
                  )}
                </div>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words ${
                    isMe
                      ? 'bg-emerald-600 text-black font-semibold rounded-tr-none'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-900 sticky bottom-16 left-0 right-0 z-20">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            maxLength={500}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-black rounded-2xl transition-all cursor-pointer shrink-0"
          >
            <Icons.Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
