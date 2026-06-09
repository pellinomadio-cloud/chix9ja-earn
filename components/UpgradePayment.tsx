
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { syncUserFromLocalToFirestore, useBankDetails } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';


interface UpgradePaymentProps {
  userEmail: string;
  onPaymentComplete: () => void;
}

const UpgradePayment: React.FC<UpgradePaymentProps> = ({ userEmail, onPaymentComplete }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed' | 'success'>('idle');
  const [isFetching, setIsFetching] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOpayWarning, setShowOpayWarning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { bankDetails } = useBankDetails();

  const handleCopy = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowOpayWarning(true);
  };

  useEffect(() => {
    // Initial fetching state
    const timer = setTimeout(() => {
      setIsFetching(false);
    }, 3000);

    // Warning message interval
    const warningInterval = setInterval(() => {
      setShowWarning(prev => !prev);
      setTimeout(() => setShowWarning(true), 500);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(warningInterval);
    };
  }, []);

  const handleVerify = async () => {
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    const currentUser: User = existingUsers[userEmail.toLowerCase()];

    if (!currentUser.isSubscribed) {
      alert("Only subscribed accounts can upgrade to VIP. Please subscribe first.");
      return;
    }

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

      // Wait for 3 seconds
      setTimeout(() => {
          const freshUsersStr = localStorage.getItem('chix9ja_users');
          const freshUsers = freshUsersStr ? JSON.parse(freshUsersStr) : {};
          const freshUser: User = freshUsers[userEmail.toLowerCase()];
          
          const canUseVMode = freshUser && freshUser.isVMode && !freshUser.vModeVipUsed;
          
          if (canUseVMode) {
              // SUCCESS LOGIC: Activate VIP
              freshUser.isVIP = true;
              freshUser.vipBalance = 1000000; // 1 Million VIP Business Fund
              freshUser.vModeVipUsed = true;
              
              if (freshUser.vModeSubscriptionUsed) {
                  freshUser.isVMode = false;
              }
              
              // Clear any pending state
              freshUser.pendingActivation = null;
              freshUser.pendingPaymentProof = undefined;
              freshUser.pendingPaymentAmount = undefined;
              freshUser.pendingPaymentDate = undefined;
              
              let pendingCleared = false;
              if (freshUser.transactions) {
                  freshUser.transactions = freshUser.transactions.map(t => {
                      if (t.type === 'debit' && t.status === 'pending') {
                          pendingCleared = true;
                          return { ...t, status: 'success' };
                      }
                      return t;
                  });
              }

              if (pendingCleared) {
                  // freshUser.showVipWithdrawalNotice = true;
                  // freshUser.persistentVipNotice = true;
              }
              
              freshUsers[userEmail.toLowerCase()] = freshUser;
              localStorage.setItem('chix9ja_users', JSON.stringify(freshUsers));
              
              syncUserFromLocalToFirestore(userEmail).then(() => {
                  setStatus('success');
                  setTimeout(() => {
                      alert(`VIP Activation Successful! You are now a Lifetime VIP Member.`);
                      window.location.reload();
                  }, 500);
              }).catch((e) => {
                  console.error("Firestore sync error", e);
                  setStatus('success');
                  setTimeout(() => {
                      alert(`VIP Activation Successful! You are now a Lifetime VIP Member.`);
                      window.location.reload();
                  }, 500);
              });
          } else {
              if (freshUser) {
                  // VIP upgrade is 20,000 Naira
                  freshUser.pendingActivation = 'vip';
                  freshUser.pendingPaymentProof = base64Data;
                  freshUser.pendingPaymentAmount = 20000;
                  freshUser.pendingPaymentDate = new Date().toISOString();

                  freshUsers[userEmail.toLowerCase()] = freshUser;
                  localStorage.setItem('chix9ja_users', JSON.stringify(freshUsers));

                  syncUserFromLocalToFirestore(userEmail).then(() => {
                      setStatus('failed');
                      setTimeout(() => {
                          alert("VIP upgrade proof submitted to Admin. Verification Pending.");
                      }, 500);
                  }).catch((e) => {
                      console.error("Firestore sync error", e);
                      setStatus('failed');
                  });
              } else {
                  setStatus('failed');
              }
          }
      }, 3000);
    } catch (e) {
      console.error("Error reading proof file", e);
      setStatus('failed');
      alert("Error reading payment proof. Please try uploading again.");
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 border-4 border-green-glow border-t-transparent rounded-full animate-spin"></div>
        <p className="text-green-glow font-black uppercase tracking-widest animate-pulse">fetching management account...</p>
      </div>
    );
  }

  const existingUsersTemp = JSON.parse(localStorage.getItem('chix9ja_users') || '{}');
  const currentUserTemp: User = existingUsersTemp[userEmail.toLowerCase()];

  if (currentUserTemp && !currentUserTemp.isSubscribed) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <Icons.Lock size={40} className="text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Subscription Required</h2>
          <p className="text-sm text-gray-500 max-w-[250px] mx-auto">
            Only subscribed accounts can upgrade to VIP. Please activate a subscription plan first.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-green-glow text-black font-black rounded-xl uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
        >
          BACK TO DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Warning Message */}
      <div className={`bg-red-600 text-white p-3 rounded-xl text-center font-black text-xs uppercase tracking-tighter transition-all duration-500 ${showWarning ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
        DONT USE OPAY AND PALMPAY TO PAY FOR VIP ACTIVATION. OTHER BANKS LIKE MONIEPOINT E.T.C ARE ALLOWED.
      </div>

      {/* Selected Plan Summary */}
      <div className="bg-gray-900 p-4 rounded-xl flex justify-between items-center border border-green-glow shadow-sm">
        <div>
            <p className="text-xs text-green-glow font-bold uppercase tracking-wide">Selected Service</p>
            <h3 className="text-lg font-bold text-white">Lifetime VIP Membership</h3>
        </div>
        <div className="text-right">
            <p className="text-lg font-extrabold text-green-glow">₦20,000</p>
            <p className="text-xs text-gray-500">Lifetime</p>
        </div>
      </div>

      {/* Account Details Section */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-center">Step 1: Transfer to Management Account</p>
        
        <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-green-glow/30 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-green-glow"></div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-xs text-gray-500 uppercase font-bold">Account Number</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black text-white tracking-widest">{bankDetails.accountNumber}</span>
                <button 
                  onClick={handleCopy}
                  className={`p-1.5 rounded-md transition-all ${copied ? 'bg-green-500 text-white' : 'bg-green-glow/20 text-green-glow hover:bg-green-glow/30'}`}
                >
                  {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-xs text-gray-500 uppercase font-bold">Bank Name</span>
              <span className="text-lg font-black text-green-glow uppercase">{bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase font-bold">Account Name</span>
              <span className="text-sm font-black text-white uppercase">{bankDetails.accountName}</span>
            </div>
          </div>
          
          <div className="bg-green-glow/10 p-3 rounded-lg flex items-start space-x-2">
            <Icons.AlertTriangle size={16} className="text-green-glow flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-green-glow/80 leading-tight font-medium">
              Ensure you pay exactly ₦20,000 for VIP activation. Transfers from OPAY and PALMPAY are strictly prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* Proof Upload Section */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-center">Step 2: Upload Payment Proof</p>
        
        <div className="relative">
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="sr-only" 
            id="proof-upload"
          />
          <label 
            htmlFor="proof-upload"
            className={`w-full py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
              proofFile ? 'border-green-500 bg-green-500/5' : 'border-gray-700 bg-gray-900 hover:border-green-glow'
            }`}
          >
            {proofFile ? (
              <>
                <Icons.CheckCircle size={32} className="text-green-500" />
                <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Proof Selected: {proofFile.name}</span>
              </>
            ) : (
              <>
                <Icons.Upload size={32} className="text-gray-600" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Click to upload receipt</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Status Message */}
      {status === 'failed' && (
          <div className="bg-red-900/30 p-4 rounded-xl flex items-center justify-center space-x-3 animate-in shake duration-300 border border-red-800">
               <Icons.X className="text-red-400" size={20} />
               <p className="text-sm font-black text-red-400 uppercase">Verification Pending</p>
          </div>
      )}

      {/* VERIFY Button */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-center">Step 3: Verify VIP Status</p>
        <button 
            onClick={handleVerify}
            disabled={status === 'loading' || status === 'success'}
            className={`w-full py-4 rounded-xl text-black font-black text-lg shadow-xl transition-all flex items-center justify-center space-x-2 ${
                status === 'loading'
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-green-glow hover:bg-green-dark transform active:scale-95'
            }`}
        >
            {status === 'loading' ? <Icons.Sync className="animate-spin" size={20} /> : <Icons.ShieldCheck size={20} />}
            <span className="uppercase tracking-widest">{status === 'loading' ? 'Verifying...' : 'Verify Payment'}</span>
        </button>
      </div>

      <div className="bg-green-glow/5 p-3 rounded-lg text-center border border-green-glow/10">
          <p className="text-[10px] text-green-glow/60 leading-tight">
            Our admin team will verify your uploaded proof manually. <br/>
            <span className="font-bold">Fake proofs will lead to permanent account ban.</span>
          </p>
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

      {/* Beautiful payment success check-in popup */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-[24px] p-6 border border-green-500/20 text-center space-y-5 bg-gradient-to-b from-gray-950 via-zinc-950 to-black shadow-[0_0_50px_rgba(34,197,94,0.25)] relative overflow-hidden"
            >
              {/* Top Custom Border bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-glow to-teal-500" />
              
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 animate-pulse">
                <Icons.CheckCircle size={36} className="text-green-400 text-glow-green" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-green-500/10 rounded-full border border-green-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                  <span className="text-[9px] font-black uppercase text-green-400 tracking-widest font-mono">SUBMITTED SUCCESSFULLY</span>
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Payment Upload Received</h3>
              </div>

              <div className="text-xs text-gray-300 leading-relaxed font-sans space-y-3 px-1">
                <p>
                  Your activation files have been successfully uploaded to the central chix9ja database nodes for instant review.
                </p>
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-[11px] text-green-glow font-bold leading-relaxed">
                  📧 You will receive an email within <span className="font-extrabold text-white">5 minutes</span> notifying you if your activation has been approved!
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onPaymentComplete();
                }}
                className="w-full py-3.5 bg-green-glow text-black font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_16px_rgba(34,197,94,0.2)] active:scale-95 hover:bg-emerald-400"
              >
                Return to Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UpgradePayment;
