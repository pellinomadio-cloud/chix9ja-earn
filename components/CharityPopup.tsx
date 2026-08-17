import React, { useState } from 'react';
import { User, CharityDonation } from '../types';
import { Heart, HandHeart, Sparkles, ShieldCheck, ChevronRight, ArrowDownRight, Calendar, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CharityPopupProps {
  user: User;
  onClose: () => void;
  onViewTransactions?: () => void;
}

export const CharityPopup: React.FC<CharityPopupProps> = ({
  user,
  onClose,
  onViewTransactions,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  // Calculate statistics
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const donations: CharityDonation[] = user.charityDonations || [];
  
  // Weekly total (within last 7 days)
  const weeklyUserDonation = donations
    .filter((d) => (d.timestamp || new Date(d.date).getTime()) >= sevenDaysAgo)
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  // Recent donation (most recent item or calculated from last upload)
  const recentDonation = donations[0] || null;
  const recentAmount = recentDonation ? recentDonation.amount : (user.balance > 0 ? Math.round(user.balance * 0.15) : 0);

  // Total all-time
  const totalAllTime = user.totalCharityDonated || donations.reduce((sum, d) => sum + (d.amount || 0), 0);

  // Format date nicely
  const formatDate = (dateStr?: string, timestamp?: number) => {
    if (timestamp) {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return 'Today';
  };

  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center px-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className="bg-zinc-950 border border-emerald-500/30 rounded-3xl p-6 w-full max-w-sm text-center shadow-[0_0_60px_rgba(16,185,129,0.25)] relative overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500"></div>
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1.5 rounded-full hover:bg-zinc-900 transition-colors z-20"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto space-y-5 pr-0.5 custom-scrollbar">
          {/* Animated Header Badge */}
          <div className="flex justify-center pt-1">
            <div className="relative">
              <div className="w-18 h-18 bg-emerald-950/60 border border-emerald-500/40 rounded-3xl flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-pulse">
                <Heart size={34} className="text-emerald-400 fill-emerald-400/20" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-black p-1 rounded-full shadow-md">
                <HandHeart size={14} className="stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Title and Tagline */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              <Sparkles size={11} className="text-emerald-400" />
              <span>Daily Welfare & Charity Initiative</span>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Charity Impact Statistics
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every day, <span className="text-emerald-400 font-extrabold">15%</span> of your dashboard balance is automatically contributed to national charity & welfare relief.
            </p>
          </div>

          {/* Core Stat Cards */}
          <div className="grid grid-cols-2 gap-3 text-left">
            {/* Recent Deduction Card */}
            <div className="bg-zinc-900/90 border border-emerald-500/25 rounded-2xl p-3.5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-300">
                  Recent Donation
                </span>
                <ArrowDownRight size={14} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-black text-white font-mono tracking-tight">
                  ₦{recentAmount.toLocaleString()}
                </div>
                <div className="text-[9px] text-zinc-500 font-medium mt-0.5 flex items-center gap-1">
                  <span>15% Balance deduction</span>
                </div>
              </div>
            </div>

            {/* Weekly Total Card */}
            <div className="bg-zinc-900/90 border border-emerald-500/25 rounded-2xl p-3.5 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-300">
                  7-Day Weekly Total
                </span>
                <Calendar size={13} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-black text-emerald-400 font-mono tracking-tight">
                  ₦{(weeklyUserDonation || recentAmount).toLocaleString()}
                </div>
                <div className="text-[9px] text-zinc-500 font-medium mt-0.5">
                  Your weekly impact
                </div>
              </div>
            </div>
          </div>

          {/* Collective Community Impact Bar */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3.5 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                Community Weekly Pool
              </span>
              <span className="text-xs font-black font-mono text-emerald-300">
                ₦{(5420000 + (weeklyUserDonation || recentAmount)).toLocaleString()}
              </span>
            </div>
            
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full w-[88%]" />
            </div>

            <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
              <span>Goal: ₦6,000,000</span>
              <span className="text-emerald-400 font-bold">88% Reached</span>
            </div>
          </div>

          {/* Causes Breakdown */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1">
                <Info size={12} className="text-emerald-400" />
                Where Your 15% Goes
              </span>
              <span className="text-[9px] font-mono text-emerald-400">100% Vetted</span>
            </div>
            
            <div className="space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex items-center justify-between">
                <span>🍲 Orphanage & Food Security</span>
                <span className="font-mono font-bold text-zinc-300">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🏥 Indigent Patient Hospital Bills</span>
                <span className="font-mono font-bold text-zinc-300">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>📚 Underprivileged Child Education</span>
                <span className="font-mono font-bold text-zinc-300">20%</span>
              </div>
            </div>
          </div>

          {/* Toggle View History */}
          {donations.length > 0 && (
            <div className="text-left">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-between w-full py-1.5 px-2 bg-zinc-900/40 rounded-xl border border-zinc-800/80 transition-colors"
              >
                <span>Recent Contribution History ({donations.length})</span>
                <ChevronRight
                  size={14}
                  className={`transform transition-transform ${showHistory ? 'rotate-90' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1"
                  >
                    {donations.slice(0, 5).map((d) => (
                      <div
                        key={d.id}
                        className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">15% Daily Deduction</div>
                          <div className="text-[9px] text-zinc-500 font-mono">
                            {formatDate(d.date, d.timestamp)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-emerald-400 font-mono">
                            -₦{d.amount.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-zinc-500 font-mono">
                            Bal: ₦{(d.newBalance || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* All-time Total Badge */}
          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 pt-1">
            <span>Total Life Contribution:</span>
            <span className="font-bold text-white font-mono">
              ₦{(totalAllTime || recentAmount).toLocaleString()}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-black font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 transition-all uppercase tracking-wider text-xs font-mono"
            >
              Continue to Dashboard
            </button>

            {onViewTransactions && (
              <button
                onClick={() => {
                  onClose();
                  onViewTransactions();
                }}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-2xl border border-zinc-800 transition-colors text-xs font-mono uppercase tracking-wider"
              >
                View Transaction History
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
