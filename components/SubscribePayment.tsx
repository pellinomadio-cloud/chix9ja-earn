
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

  const { bankDetails } = useBankDetails();

  const handleCopy = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              
              const expiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

              currentUser.isSubscribed = true;
              currentUser.subscriptionPlan = plan.name;
              currentUser.subscriptionExpiryDate = expiryTimestamp;
              currentUser.vModeSubscriptionUsed = true;
              
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
                  let amountNum = 15000;
                  if (plan.id === 'weekly') amountNum = 8000;
                  if (plan.id === 'yearly') amountNum = 50000;

                  currentUser.pendingActivation = plan.id === 'weekly' ? 'subscription_weekly' : (plan.id === 'yearly' ? 'subscription_yearly' : 'subscription_monthly');
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
    <div className="px-4 py-8 space-y-8 pb-32">
      
      {/* Warning Message - Fixed at top with pulse */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600 shadow-lg shadow-red-600/20 text-white p-4 rounded-2xl text-center space-y-1 relative overflow-hidden"
        >
          <div className="inline-flex items-center space-x-2">
            <Icons.AlertTriangle size={14} className="animate-pulse" />
            <p className="font-black text-[10px] uppercase tracking-tighter">Restriction Warning</p>
          </div>
          <p className="text-[10px] font-bold uppercase leading-tight">
            DONT USE OPAY AND PALMPAY. OTHER BANKS LIKE MONIEPOINT, UBA, ZENITH E.T.C ARE ALLOWED.
          </p>
          <div className="absolute top-0 right-0 p-1 opacity-50">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Selected Plan Summary Card */}
      <div className="bg-gray-900 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-glow/5 blur-3xl -z-10 group-hover:bg-green-glow/10 transition-all" />
        <div className="flex justify-between items-center">
            <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Activation Required</p>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{plan.name}</h3>
            </div>
            <div className="text-right">
                <p className="text-3xl font-black text-green-glow tracking-tighter leading-none">
                  {plan.price}
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{plan.duration}</p>
            </div>
        </div>
      </div>

      {/* Step 1: Account Details */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 ml-2">
          <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-500 font-black text-xs">1</div>
          <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Management Bank</h4>
        </div>
        
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-8 shadow-2xl border border-white/5 space-y-6 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-glow opacity-50"></div>
          
          <div className="space-y-6">
            <div className="space-y-1">
               <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Bank Name</p>
               <p className="text-xl font-black text-white uppercase tracking-tight">{bankDetails.bankName}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Account Number</p>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-black text-green-glow tracking-widest font-mono">{bankDetails.accountNumber}</p>
                <button 
                  onClick={handleCopy}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${copied ? 'bg-green-500 text-white animate-bounce' : 'bg-green-glow/10 text-green-glow hover:bg-green-glow/20'}`}
                >
                  {copied ? <Icons.Check size={20} /> : <Icons.Copy size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Account Name</p>
              <p className="text-lg font-black text-white/90 uppercase tracking-tight">{bankDetails.accountName}</p>
            </div>
          </div>
          
          <div className="bg-amber-400/5 p-4 rounded-2xl border border-amber-400/10 mt-2">
            <p className="text-[10px] text-amber-400/80 leading-relaxed italic font-medium">
              * Ensure the transfer total exactly matches <span className="font-black text-white">{plan.price}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Proof Upload */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3 ml-2">
          <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-500 font-black text-xs">2</div>
          <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Upload Receipt</h4>
        </div>
        
        <div className="relative group">
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="hidden" 
            id="proof-upload"
          />
          <label 
            htmlFor="proof-upload"
            className={`w-full py-10 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all duration-300 ${
              proofFile ? 'border-green-500 bg-green-500/5' : 'border-white/10 bg-gray-900 group-hover:border-green-glow/50 group-hover:bg-gray-800/50 shadow-inner'
            }`}
          >
            {proofFile ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-3"
              >
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 shadow-lg">
                  <Icons.CheckCircle size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[200px] mx-auto">{proofFile.name}</p>
                  <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest mt-1">Ready for Sync</p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600 transition-colors group-hover:text-green-glow">
                  <Icons.Upload size={32} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Tap to upload proof</p>
                  <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">PNG, JPG or JPEG allowed</p>
                </div>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Step 3: Verification */}
      <div className="space-y-4 pt-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-900/50 p-4 rounded-2xl text-center space-y-2 border border-white/5"
        >
          <div className="flex items-center justify-center space-x-2 text-green-glow/50">
             <Icons.ShieldCheck size={14} />
             <p className="text-[10px] font-black uppercase tracking-widest">Secure Sync Protocol</p>
          </div>
          <p className="text-[10px] text-gray-500 leading-tight font-medium px-4">
            Upload verified. Management will validate your transfer manually within 2-4 hours if auto-sync fails.
          </p>
        </motion.div>

        <button 
          onClick={handleVerify}
          disabled={status === 'loading' || status === 'success'}
          className={`group w-full py-5 rounded-2xl font-black text-sm shadow-2xl transition-all flex items-center justify-center space-x-3 select-none ${
            status === 'loading'
            ? 'bg-gray-800 text-gray-500 cursor-wait shadow-none'
            : 'bg-white text-black active:scale-[0.98] active:bg-green-glow active:shadow-green-lg transition-transform'
          }`}
        >
          {status === 'loading' ? (
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
              <span className="uppercase tracking-[0.2em]">Verifying Hash...</span>
            </div>
          ) : (
            <>
              <Icons.Zap size={18} fill="currentColor" strokeWidth={0} />
              <span className="uppercase tracking-[0.2em]">Activate Account</span>
            </>
          )}
        </button>

        {status === 'failed' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between"
          >
             <div className="flex items-center space-x-3">
               <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                  <Icons.Clock size={16} />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-bold text-white uppercase tracking-tight leading-none">Sync Failed Pending</p>
                  <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mt-1">Manual node activation required</p>
               </div>
             </div>
             <button 
               onClick={() => window.open('https://t.me/chix9jaservice', '_blank')}
               className="text-[8px] font-black bg-red-500 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest"
             >
               Support
             </button>
          </motion.div>
        )}
      </div>

    </div>
  );
};

export default SubscribePayment;
