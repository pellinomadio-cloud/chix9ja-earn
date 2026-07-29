import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { 
  Zap, 
  ShieldCheck, 
  Check, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Star, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Lock, 
  Crown, 
  CreditCard,
  ChevronRight,
  AlertCircle,
  Banknote,
  CheckCircle2
} from 'lucide-react';

interface UpgradeProposalProps {
  onProceed: (tier: 'vip1' | 'vip2' | 'vip3') => void;
  onBack: () => void;
  onGoToSubscribe?: () => void;
  onGoToWithdraw?: () => void;
  user?: User;
}

export const Vip2CountdownTimer: React.FC<{ timestamp?: number }> = ({ timestamp }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 2,
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    // 3 days in milliseconds = 3 * 24 * 60 * 60 * 1000 = 259,200,000 ms
    const durationMs = 3 * 24 * 60 * 60 * 1000;
    const startTime = timestamp || Date.now();
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      const now = Date.now();
      const difference = Math.max(0, endTime - now);

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 rounded-3xl p-5 sm:p-6 text-black shadow-2xl shadow-amber-300/60 border-2 border-amber-300 relative overflow-hidden space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-black/15 pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest text-black">
            LIVE VIP 2 CASHOUT COUNTDOWN
          </span>
        </div>
        <span className="px-3 py-1 bg-black text-amber-400 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
          2 Working Days
        </span>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs font-black text-black/90 uppercase tracking-wider">
          Time Remaining Before Withdrawal Clears From Pending
        </p>
        
        {/* BIG Digital Clock Display */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center pt-1">
          <div className="bg-amber-950 text-amber-400 rounded-2xl p-2.5 sm:p-3.5 border-2 border-amber-300 shadow-xl">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight block">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-200/80 block mt-1">
              Days
            </span>
          </div>
          <div className="bg-amber-950 text-amber-400 rounded-2xl p-2.5 sm:p-3.5 border-2 border-amber-300 shadow-xl">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight block">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-200/80 block mt-1">
              Hours
            </span>
          </div>
          <div className="bg-amber-950 text-amber-400 rounded-2xl p-2.5 sm:p-3.5 border-2 border-amber-300 shadow-xl">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight block">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-200/80 block mt-1">
              Minutes
            </span>
          </div>
          <div className="bg-amber-950 text-amber-400 rounded-2xl p-2.5 sm:p-3.5 border-2 border-amber-300 shadow-xl">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight block">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-200/80 block mt-1">
              Seconds
            </span>
          </div>
        </div>

        <p className="text-[11px] font-extrabold text-amber-950/90 leading-tight pt-1">
          ⚡ VIP 2 Active: Your withdrawal will be credited automatically upon countdown completion!
        </p>
      </div>
    </div>
  );
};

const UpgradeProposal: React.FC<UpgradeProposalProps> = ({ 
  onProceed, 
  onBack, 
  onGoToSubscribe,
  onGoToWithdraw,
  user 
}) => {
  const [selectedTier, setSelectedTier] = useState<'vip1' | 'vip2' | 'vip3'>('vip1');
  const [showPreviewAnyway, setShowPreviewAnyway] = useState(false);

  const isSubscribed = !!user?.isSubscribed;
  const hasPendingWithdrawal = user?.transactions?.some(t => t.type === 'debit' && t.status === 'pending');
  const isVip2Active = user?.vipTier === 'vip2' || user?.pendingActivation === 'vip2';

  const vipTiers = [
    {
      id: 'vip1' as const,
      name: 'VIP 1 — Instant Cashout',
      price: '₦20,000',
      badge: '⚡ INSTANT CASHOUT (BEST)',
      badgeBg: 'bg-emerald-500 text-white',
      timeline: 'Instant (0 Days)',
      description: 'Clears pending cashout immediately & credits your bank account without delay.',
      features: [
        'Instant withdrawal removal from pending',
        'Immediate bank payout credit',
        'Unlimited daily transaction limit',
        '₦1,000,000 VIP Business Fund access',
      ],
      color: 'border-emerald-500 bg-emerald-50/40',
    },
    {
      id: 'vip2' as const,
      name: 'VIP 2 — Express Cashout',
      price: '₦15,000',
      badge: '⏱️ 2 WORKING DAYS',
      badgeBg: 'bg-amber-500 text-black',
      timeline: '2 Working Days (3-Day Countdown)',
      description: 'Wait 2 working days before your withdrawal is removed from pending and credited.',
      features: [
        '3-Day Live Countdown displayed on VIP page',
        'Cashout removed from pending in 2 working days',
        'Priority queue processing',
        'Dedicated VIP support link',
      ],
      color: 'border-amber-400 bg-amber-50/40',
    },
    {
      id: 'vip3' as const,
      name: 'VIP 3 — Standard VIP Cashout',
      price: '₦9,850',
      badge: '🗓️ 7 WORKING DAYS',
      badgeBg: 'bg-amber-800 text-white',
      timeline: '7 Working Days',
      description: 'Economical VIP tier for scheduled cashout within 7 working days.',
      features: [
        'Cashout processed within 7 working days',
        'Verified VIP Status badge',
        'Zero hidden fees',
        'Budget-friendly VIP entry',
      ],
      color: 'border-amber-300 bg-white',
    },
  ];

  // SCENARIO 1: USER NOT SUBSCRIBED YET
  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-100/40 text-amber-950 font-sans p-4 sm:p-6 pb-24">
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-md shadow-amber-200/50">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center text-amber-900 transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-black text-amber-950 uppercase tracking-tight">
                Chix9ja VIP Hub
              </h1>
              <p className="text-[10px] font-bold text-amber-700 tracking-wider uppercase font-mono">
                Premium Financial Privileges
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-700">
              <Crown size={20} className="fill-amber-500" />
            </div>
          </div>

          {/* Hero Banner with Encouraging Message */}
          <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 rounded-3xl p-6 text-black shadow-xl shadow-amber-300/50 border border-amber-300 relative overflow-hidden space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-black/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-black border border-black/10 shrink-0">
                <Sparkles size={32} fill="currentColor" />
              </div>
              <div>
                <span className="px-3 py-0.5 bg-black text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-1">
                  High Payout & Premium Services
                </span>
                <h2 className="text-xl font-black text-black tracking-tight uppercase leading-tight">
                  Welcome to Chix9ja VIP
                </h2>
              </div>
            </div>

            <p className="text-xs font-semibold text-amber-950 leading-relaxed bg-black/5 p-3.5 rounded-2xl border border-black/10">
              🌟 <strong className="text-black">High Payout Guarantee:</strong> Chix9ja delivers Nigeria’s highest return yields, rapid payout processing, and instant node transfers. Subscribe today to unlock total financial freedom!
            </p>
          </div>

          {/* Key Chix9ja Benefits List */}
          <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-md shadow-amber-200/40 space-y-4">
            <div className="flex items-center space-x-2 border-b border-amber-200/80 pb-3">
              <Award className="text-amber-600" size={20} />
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-950">
                Why Chix9ja Premium Services?
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Industry Highest Payouts
                  </h4>
                  <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                    Earn up to 100% daily returns on task rewards, crypto trading, and VIP node investments.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <Zap size={18} fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Instant Bank Settlements
                  </h4>
                  <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                    Direct integration with CBN-approved banking rails ensures zero transaction loss and lightning-fast payouts.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    24/7 Priority VIP Node Access
                  </h4>
                  <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                    VIP node members receive ₦1,000,000 Business Fund allocation & zero pending delay options.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <Crown size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Exclusive Member Signals & Lounge
                  </h4>
                  <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                    Gain direct access to certified trading broadcasts and daily administrative alerts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Encouraging Subscription Banner */}
          <div className="bg-amber-100/90 border-2 border-amber-300 rounded-3xl p-5 text-center space-y-3">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              Ready to start receiving high payouts?
            </h4>
            <p className="text-[11px] font-semibold text-amber-900 leading-relaxed">
              Activate your subscription now to start withdrawing funds, unlocking VIP cashout acceleration, and enjoying premium Chix9ja services!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={onGoToSubscribe || onBack}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold rounded-2xl shadow-xl shadow-amber-300/60 transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
            >
              <span>Activate Subscription Now</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 text-amber-800 font-bold uppercase tracking-wider text-xs hover:text-amber-950 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    );
  }

  // SCENARIO 2: USER IS SUBSCRIBED BUT HAS NO PENDING WITHDRAWALS (AND IS NOT VIP / SHOW PREVIEW)
  if (isSubscribed && !hasPendingWithdrawal && !user?.isVIP && !isVip2Active && !showPreviewAnyway) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-100/40 text-amber-950 font-sans p-4 sm:p-6 pb-24">
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-md shadow-amber-200/50">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center text-amber-900 transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-black text-amber-950 uppercase tracking-tight">
                VIP Cashout Accelerator
              </h1>
              <p className="text-[10px] font-bold text-amber-700 tracking-wider uppercase font-mono">
                Chix9ja Subscribed Privilege
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-700">
              <Star size={20} className="fill-amber-500" />
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 rounded-3xl p-6 text-black shadow-xl shadow-amber-300/50 border border-amber-300 text-center space-y-3">
            <div className="w-14 h-14 bg-black/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-black border border-black/10">
              <Banknote size={32} />
            </div>
            <div>
              <span className="px-3 py-0.5 bg-black text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-1">
                Subscribed Account Active
              </span>
              <h2 className="text-xl font-black text-black tracking-tight uppercase">
                No Pending Withdrawals
              </h2>
              <p className="text-xs font-semibold text-amber-950 leading-relaxed max-w-xs mx-auto mt-1">
                VIP Tier upgrades are specifically designed to clear pending cashout requests into direct bank credit.
              </p>
            </div>
          </div>

          {/* Notice Card */}
          <div className="bg-white border-2 border-amber-300/80 rounded-3xl p-5 shadow-md shadow-amber-200/40 space-y-4">
            <div className="flex items-center space-x-2 text-amber-700 border-b border-amber-200 pb-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                How VIP Cashout Works
              </h3>
            </div>

            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              When you initiate a withdrawal, your transaction status becomes <strong className="text-amber-950">Pending</strong>. You can then select a VIP package on this page to remove your cashout from pending:
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-950 uppercase block">VIP 1 — ₦20,000</span>
                  <span className="text-[10px] text-emerald-800 font-semibold">Instant Cashout from pending</span>
                </div>
                <span className="px-2 py-1 bg-emerald-600 text-white font-extrabold text-[9px] rounded-lg uppercase">Instant</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-amber-950 uppercase block">VIP 2 — ₦15,000</span>
                  <span className="text-[10px] text-amber-800 font-semibold">2 Working Days (Live 3-Day Countdown)</span>
                </div>
                <span className="px-2 py-1 bg-amber-500 text-black font-extrabold text-[9px] rounded-lg uppercase">2 Days</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-stone-900 uppercase block">VIP 3 — ₦9,850</span>
                  <span className="text-[10px] text-stone-700 font-semibold">7 Working Days standard cashout</span>
                </div>
                <span className="px-2 py-1 bg-amber-800 text-white font-extrabold text-[9px] rounded-lg uppercase">7 Days</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={onGoToWithdraw || onBack}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold rounded-2xl shadow-xl shadow-amber-300/60 transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
            >
              <span>Make a Cashout Request</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewAnyway(true)}
              className="w-full py-3.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-extrabold rounded-2xl transition-all text-xs uppercase tracking-wider"
            >
              Preview VIP Tier Packages
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 text-amber-800 font-bold uppercase tracking-wider text-xs hover:text-amber-950 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>

        </div>
      </div>
    );
  }

  // SCENARIO 3: SUBSCRIBED USER WITH PENDING WITHDRAWALS (OR IS VIP / PREVIEW)
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-100/40 text-amber-950 font-sans p-4 sm:p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-md shadow-amber-200/50">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center text-amber-900 transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-amber-950 uppercase tracking-tight">
              VIP Membership Tiers
            </h1>
            <p className="text-[10px] font-bold text-amber-700 tracking-wider uppercase font-mono">
              Chix9ja Cashout Accelerator
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-700">
            <Star size={20} className="fill-amber-500" />
          </div>
        </div>

        {/* VIP 2 Countdown Timer (If VIP 2 active or pending) */}
        {isVip2Active && (
          <Vip2CountdownTimer timestamp={user?.vipActivationTimestamp || user?.lastUploadTimestamp} />
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 rounded-3xl p-6 text-black shadow-xl shadow-amber-300/50 border border-amber-300 relative overflow-hidden text-center space-y-3">
          <div className="w-16 h-16 bg-black/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-black border border-black/10">
            <Zap size={36} fill="currentColor" />
          </div>
          <div>
            <span className="px-3 py-1 bg-black text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-1">
              Select Cashout Speed
            </span>
            <h2 className="text-2xl font-black text-black tracking-tight uppercase">
              Upgrade Your VIP Cashout
            </h2>
            <p className="text-xs text-amber-950 font-semibold leading-relaxed max-w-xs mx-auto mt-1">
              Choose your VIP package to clear pending withdrawals and credit your bank account.
            </p>
          </div>
        </div>

        {/* VIP Tiers List */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5 ml-1">
            <ShieldCheck size={16} className="text-amber-600" />
            Available VIP Tiers
          </h3>

          {vipTiers.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`cursor-pointer rounded-3xl p-5 border-2 transition-all shadow-md relative overflow-hidden ${
                  isSelected
                    ? `${tier.color} shadow-amber-300/60 ring-2 ring-amber-500`
                    : 'bg-white border-amber-200 hover:border-amber-300 opacity-90'
                }`}
              >
                {/* Header of Tier Card */}
                <div className="flex items-start justify-between gap-2 border-b border-amber-200/80 pb-3">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${tier.badgeBg}`}>
                      {tier.badge}
                    </span>
                    <h4 className="text-lg font-black text-amber-950 mt-1 uppercase tracking-tight">
                      {tier.name}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-amber-950 tracking-tight block">
                      {tier.price}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">
                      One-time fee
                    </span>
                  </div>
                </div>

                {/* Description & Timeline */}
                <div className="py-3 space-y-2">
                  <p className="text-xs text-amber-900 font-medium leading-relaxed">
                    {tier.description}
                  </p>

                  <div className="bg-amber-100/70 p-2.5 rounded-xl border border-amber-200/60 flex items-center space-x-2 text-xs font-extrabold text-amber-950">
                    <Clock size={16} className="text-amber-700 shrink-0" />
                    <span>Cashout Timeline: {tier.timeline}</span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-1.5 pt-1">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-xs text-amber-950 font-semibold">
                        <Check size={14} className="text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Selection Radio / Indicator */}
                <div className="pt-2 flex items-center justify-between border-t border-amber-200/80">
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-amber-600 bg-amber-500' : 'border-amber-300'}`}>
                      {isSelected && <Check size={12} className="text-black font-bold" />}
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                      {isSelected ? 'Selected Package' : 'Click to Select'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={() => onProceed(selectedTier)}
            className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-extrabold rounded-2xl shadow-xl shadow-amber-300/60 transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
          >
            <span>Proceed to Pay {vipTiers.find(t => t.id === selectedTier)?.price}</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 text-amber-800 font-bold uppercase tracking-wider text-xs hover:text-amber-950 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default UpgradeProposal;
