
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Plan, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { syncUserFromLocalToFirestore, useBankDetails } from '../firebase';


interface SubscribePaymentProps {
  plan: Plan;
  userEmail: string;
  onPaymentComplete: () => void;
}

const SubscribePayment: React.FC<SubscribePaymentProps> = ({ plan, userEmail, onPaymentComplete }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed' | 'success'>('idle');
  const [isFetching, setIsFetching] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOpayWarning, setShowOpayWarning] = useState(false);

  const { bankDetails } = useBankDetails();

  const handleCopy = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowOpayWarning(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFetching(false);
    }, 2500);

    const warningInterval = setInterval(() => {
      setShowWarning(prev => !prev);
      setTimeout(() => setShowWarning(true), 1500);
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearInterval(warningInterval);
    };
  }, []);

  const handleVerify = async () => {
    if (!proofFile) {
      alert("Please upload payment proof first.");
      return;
    }
    setStatus('loading');

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(proofFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
      });

      setTimeout(() => {
          const existingUsersStr = localStorage.getItem('chix9ja_users');
          const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
          const currentUser: User = existingUsers[userEmail.toLowerCase()];
          
          const canUseVMode = currentUser && currentUser.isVMode && !currentUser.vModeSubscriptionUsed;

          if (canUseVMode) {
              let durationDays = 30; 
              if (plan.id === 'weekly') durationDays = 7;
              if (plan.id === 'yearly') durationDays = 365;
              if (plan.id === 'promo') durationDays = 1;
              
              const expiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

              currentUser.isSubscribed = true;
              currentUser.subscriptionPlan = plan.name;
              currentUser.subscriptionExpiryDate = expiryTimestamp;
              currentUser.vModeSubscriptionUsed = true;
              
              let bonusAmount = 0;
              let bonusDescription = "";
              
              const isWeekly = plan.id === 'weekly' || plan.name.toLowerCase().includes('weekly') || plan.name.toLowerCase().includes('saver');
              const isMonthly = plan.id === 'monthly' || plan.name.toLowerCase().includes('monthly') || plan.name.toLowerCase().includes('pro');
              
              if (isWeekly) {
                  bonusAmount = 120000;
                  bonusDescription = "Weekly Subscription Welcome Bonus";
              } else if (isMonthly) {
                  bonusAmount = 200000;
                  bonusDescription = "Monthly Subscription Welcome Bonus";
              }
              
              if (bonusAmount > 0) {
                  currentUser.balance = (currentUser.balance || 0) + bonusAmount;
                  const newTx = {
                      id: 'tx_sub_bonus_' + Math.random().toString(36).substring(2, 9),
                      type: 'credit' as const,
                      amount: bonusAmount,
                      description: bonusDescription,
                      date: new Date().toISOString(),
                      status: 'success' as const
                  };
                  currentUser.transactions = [newTx, ...(currentUser.transactions || [])];
              }
              
              if (currentUser.vModeVipUsed) {
                  currentUser.isVMode = false;
              }
              
              // Clear any pending state
              currentUser.pendingActivation = null;
              currentUser.pendingPaymentProof = undefined;
              currentUser.pendingPaymentAmount = undefined;
              currentUser.pendingPaymentDate = undefined;

              existingUsers[userEmail.toLowerCase()] = currentUser;
              localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
              
              syncUserFromLocalToFirestore(userEmail).then(() => {
                  setStatus('success');
                  setTimeout(() => {
                      alert(`Activation Successful! Your ${plan.name} is now active.`);
                      window.location.reload();
                  }, 500);
              }).catch((e) => {
                  console.error("Firestore sync error", e);
                  setStatus('success');
                  setTimeout(() => {
                      alert(`Activation Successful! Your ${plan.name} is now active.`);
                      window.location.reload();
                  }, 500);
              });
              } else {
                  if (currentUser) {
                      let amountNum = 17000;
                      if (plan.id === 'weekly') amountNum = 10000;
                      if (plan.id === 'yearly') amountNum = 70000;
                      if (plan.id === 'promo') amountNum = 7000;

                  currentUser.pendingActivation = plan.id === 'weekly' ? 'subscription_weekly' : (plan.id === 'yearly' ? 'subscription_yearly' : (plan.id === 'promo' ? 'subscription_promo' : 'subscription_monthly'));
                  currentUser.pendingPaymentProof = base64Data;
                  currentUser.pendingPaymentAmount = amountNum;
                  currentUser.pendingPaymentDate = new Date().toISOString();

                  existingUsers[userEmail.toLowerCase()] = currentUser;
                  localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
                  
                  syncUserFromLocalToFirestore(userEmail).then(() => {
                      setStatus('failed');
                      setTimeout(() => {
                          alert("Payment submitted for Admin activation. Server Synchronization Pending.");
                      }, 500);
                  }).catch((e) => {
                      console.error("Firestore sync error", e);
                      setStatus('failed');
                  });
              } else {
                  setStatus('failed');
              }
          }
      }, 3500);
    } catch (e) {
      console.error("Error reading file", e);
      setStatus('failed');
      alert("Error reading payment proof. Please try uploading again.");
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-white/5 rounded-full"></div>
          <div className="absolute top-0 w-20 h-20 border-4 border-green-glow border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Icons.Sync size={24} className="text-green-glow animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-black uppercase tracking-tighter text-lg">Syncing Node</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest animate-pulse">Establishing Secure Management Link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      
      {/* Warning Message - Fixed at top with pulse */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600 shadow-md shadow-red-600/10 text-white p-3 rounded-xl text-center space-y-1 relative overflow-hidden"
        >
          <div className="inline-flex items-center space-x-1.5">
            <Icons.AlertTriangle size={12} className="animate-pulse" />
            <p className="font-black text-[9px] uppercase tracking-wider">Restriction Warning</p>
          </div>
          <p className="text-[9px] font-bold uppercase leading-tight">
            DONT USE OPAY AND PALMPAY. OTHER BANKS LIKE MONIEPOINT, UBA, ZENITH E.T.C ARE ALLOWED.
          </p>
          <div className="absolute top-0 right-0 p-1 opacity-50">
             <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Selected Plan Summary Card */}
      <div className="bg-gray-900 border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-glow/5 blur-2xl -z-10 group-hover:bg-green-glow/10 transition-all" />
        <div className="flex justify-between items-center">
            <div className="space-y-0.5">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Selected Tier</p>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{plan.name}</h3>
            </div>
            <div className="text-right">
                <p className="text-xl font-black text-green-glow tracking-tight leading-none">
                  {plan.price}
                </p>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">{plan.duration}</p>
            </div>
        </div>
      </div>

      {/* Step 1: Account Details */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 ml-1">
          <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-gray-500 font-black text-[10px]">1</div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Transfer Funds</h4>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-5 shadow-lg border border-white/5 space-y-4 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-glow opacity-50"></div>
          
          <div className="space-y-4">
            <div className="space-y-0.5">
               <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Bank Name</p>
               <p className="text-base font-black text-white uppercase tracking-tight">{bankDetails.bankName}</p>
            </div>

            <div className="space-y-0.5">
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Account Number</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-black text-green-glow tracking-widest font-mono">{bankDetails.accountNumber}</p>
                <button 
                  onClick={handleCopy}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-green-500 text-white animate-bounce' : 'bg-green-glow/10 text-green-glow hover:bg-green-glow/20'}`}
                >
                  {copied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Account Name</p>
              <p className="text-sm font-black text-white/90 uppercase tracking-tight">{bankDetails.accountName}</p>
            </div>
          </div>
          
          <div className="bg-amber-400/5 p-3 rounded-xl border border-amber-400/10 mt-1">
            <p className="text-[9px] text-amber-400/80 leading-relaxed italic font-medium">
              * Ensure the transfer total exactly matches <span className="font-black text-white">{plan.price}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Proof Upload */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 ml-1">
          <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-gray-500 font-black text-[10px]">2</div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Upload Receipt</h4>
        </div>
        
        <div className="relative group">
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="sr-only" 
            id="proof-upload"
          />
          <label 
            htmlFor="proof-upload"
            className={`w-full py-6 border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3 cursor-pointer transition-all duration-300 ${
              proofFile ? 'border-green-500 bg-green-500/5' : 'border-white/10 bg-gray-900 group-hover:border-green-glow/30 group-hover:bg-gray-800/50 shadow-inner'
            }`}
          >
            {proofFile ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-2"
              >
                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 shadow-md">
                  <Icons.CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-white uppercase tracking-widest truncate max-w-[200px] mx-auto">{proofFile.name}</p>
                  <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest mt-0.5">Ready for Sync</p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-600 transition-colors group-hover:text-green-glow">
                  <Icons.Upload size={24} />
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tap to upload receipt</p>
                  <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">PNG, JPG or JPEG allowed</p>
                </div>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Step 3: Verification */}
      <div className="space-y-3 pt-2">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-900/50 p-3 rounded-xl text-center space-y-1.5 border border-white/5"
        >
          <div className="flex items-center justify-center space-x-1.5 text-green-glow/50">
             <Icons.ShieldCheck size={12} />
             <p className="text-[9px] font-black uppercase tracking-widest">Secure Sync Protocol</p>
          </div>
          <p className="text-[9px] text-gray-500 leading-normal font-medium px-4">
            Upload verified. Management will validate your transfer manually within 2-4 hours if auto-sync fails.
          </p>
        </motion.div>

        <button 
          onClick={handleVerify}
          disabled={status === 'loading' || status === 'success'}
          className={`group w-full py-3.5 rounded-xl font-black text-xs shadow-xl transition-all flex items-center justify-center space-x-2 select-none ${
            status === 'loading'
            ? 'bg-gray-800 text-gray-500 cursor-wait shadow-none'
            : 'bg-white text-black active:scale-[0.98] active:bg-green-glow active:shadow-green-sm transition-transform'
          }`}
        >
          {status === 'loading' ? (
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
              <span className="uppercase tracking-widest">Verifying Hash...</span>
            </div>
          ) : (
            <>
              <Icons.Zap size={16} fill="currentColor" strokeWidth={0} />
              <span className="uppercase tracking-widest">Activate Account</span>
            </>
          )}
        </button>

        {status === 'failed' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between"
          >
             <div className="flex items-center space-x-2.5">
               <div className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                  <Icons.Clock size={14} />
               </div>
               <div className="text-left">
                  <p className="text-[9px] font-bold text-white uppercase tracking-tight leading-none">Sync Failed Pending</p>
                  <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mt-0.5">Manual node activation required</p>
               </div>
             </div>
             <button 
               onClick={() => window.open('https://t.me/chix9jaservice', '_blank')}
               className="text-[8px] font-black bg-red-500 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest"
             >
               Support
             </button>
          </motion.div>
        )}
      </div>

      {/* Beautiful OPay & PalmPay warning modal overlay */}
      <AnimatePresence>
        {showOpayWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOpayWarning(false)}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[24px] p-6 border border-emerald-500/20 text-center space-y-5 bg-gradient-to-b from-gray-950 via-zinc-950 to-black shadow-[0_0_50px_rgba(239,68,68,0.25)] relative overflow-hidden"
            >
              {/* Top Accent Bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-550 via-amber-500 to-red-500" />
              
              {/* Outer Glowing Circle around Warning Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 animate-bounce">
                <Icons.AlertTriangle size={36} className="text-red-500 text-glow-red" />
              </div>

              {/* Header Titles */}
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-500/10 rounded-full border border-red-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[9px] font-black uppercase text-red-500 tracking-widest font-mono">CRITICAL WARNING</span>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Do Not Use OPay or PalmPay</h3>
              </div>

              {/* Informative Text block */}
              <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                Payments made through <strong className="text-red-405">OPay</strong> or <strong className="text-red-405">PalmPay</strong> accounts are <strong className="text-white">NOT supported</strong> by our automatic bank synchronization nodes. Transferring via these platforms can cause automatic activation timeouts or lost funds.
              </p>

              {/* Allowed Alternatives Box */}
              <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-xl p-3 space-y-2 text-left">
                <p className="text-[8px] font-black uppercase text-emerald-400 tracking-wider font-mono font-bold">SUPPORTED PAYMENT CHANNELS</p>
                <div className="flex flex-wrap gap-1.5">
                  {['GTBank', 'Zenith Bank', 'Access Bank', 'Moniepoint', 'UBA', 'Kuda', 'Wema'].map(bName => (
                    <span key={bName} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 font-mono text-[8.5px] font-bold">
                      ✓ {bName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setShowOpayWarning(false)}
                className="w-full py-3 bg-red-500 hover:bg-red-605 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_16px_rgba(239,68,68,0.2)] active:scale-95"
              >
                I Understand, Proceed
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SubscribePayment;
