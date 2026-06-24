
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { useBankDetails } from '../firebase';
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

interface InvestmentPlan {
  id: string;
  name: string;
  investAmount: number;
  returnAmount: number;
  duration: string;
  color: string;
}

interface InvestmentProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (updatedFields: Partial<User>) => void;
}

const Investment: React.FC<InvestmentProps> = ({ user, onBack, onUpdateUser }) => {
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed' | 'success'>('idle');
  const [investmentIdInput, setInvestmentIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOpayWarning, setShowOpayWarning] = useState(false);
  const initialStep = user.isInvestmentIdUsed 
    ? (user.pendingInvestmentStep || 'account_details') 
    : (user.pendingInvestmentStep || 'plans');

  const [step, setStep] = useState<'plans' | 'payment' | 'account_details' | 'verification_payment'>(initialStep);
  const [investProof, setInvestProof] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  useEffect(() => {
    if (user.isInvestmentIdUsed && step === 'plans') {
      setStep(user.pendingInvestmentStep || 'account_details');
    }
  }, [user.isInvestmentIdUsed, step, user.pendingInvestmentStep]);

  useEffect(() => {
    if (user.pendingInvestmentStep && user.pendingInvestmentStep !== step) {
      setStep(user.pendingInvestmentStep);
    }
  }, [user.pendingInvestmentStep]);
  
  // Withdrawal details state
  const [withdrawalAccount, setWithdrawalAccount] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });

  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [verificationError, setVerificationError] = useState('');

  // Auto verify investment withdrawal account
  useEffect(() => {
    if (withdrawalAccount.bankName && withdrawalAccount.accountNumber.trim().length === 10) {
      const verifyAccount = async () => {
        setVerificationStatus('verifying');
        setVerificationError('');
        setWithdrawalAccount(prev => ({ ...prev, accountName: '' }));
        
        const bankCode = BANK_CODES_MAP[withdrawalAccount.bankName];
        if (!bankCode) {
          setVerificationStatus('failed');
          setVerificationError('Manual input fallback.');
          return;
        }

        try {
          const response = await fetch('/api/verify-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountNumber: withdrawalAccount.accountNumber.trim(),
              bankCode,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Unable to verify account details.');
          }

          setWithdrawalAccount(prev => ({ ...prev, accountName: data.accountName }));
          setVerificationStatus('success');
        } catch (err: any) {
          console.error(err);
          setVerificationStatus('failed');
          setVerificationError(err.message || 'Auto-verification failed.');
        }
      };

      verifyAccount();
    } else {
      setVerificationStatus('idle');
      if (withdrawalAccount.accountNumber.trim().length !== 10) {
        setWithdrawalAccount(prev => ({ ...prev, accountName: '' }));
      }
    }
  }, [withdrawalAccount.bankName, withdrawalAccount.accountNumber]);

  const { bankDetails } = useBankDetails();
  const accountNumber = bankDetails.accountNumber;
  const bankName = bankDetails.bankName;
  const accountName = bankDetails.accountName;

  const plans: InvestmentPlan[] = [
    { id: 'silver', name: 'Silver Plan', investAmount: 10000, returnAmount: 70000, duration: '24 Hours', color: 'from-gray-400 to-gray-600' },
    { id: 'gold', name: 'Gold Plan', investAmount: 20000, returnAmount: 150000, duration: '24 Hours', color: 'from-amber-300 to-amber-600' },
    { id: 'platinum', name: 'Platinum Plan', investAmount: 30000, returnAmount: 200000, duration: '24 Hours', color: 'from-blue-400 to-blue-700' },
    { id: 'diamond', name: 'Diamond Plan', investAmount: 40000, returnAmount: 300000, duration: '24 Hours', color: 'from-cyan-300 to-cyan-600' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowOpayWarning(true);
  };

  const handleVerify = () => {
    if (investmentIdInput.trim().toUpperCase() !== "CHIX101") {
      alert("Invalid Investment ID. Please enter the correct ID from management.");
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      const existingUsersStr = localStorage.getItem('chix9ja_users');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
      const currentUser: User = existingUsers[user.email.toLowerCase()];
      
      // Check if ID already used on this account
      if (currentUser.isInvestmentIdUsed) {
        setStatus('failed');
        alert("This Investment ID has already been used on this account.");
        return;
      }

      // SUCCESS: Just the right code is enough
      currentUser.isInvestmentIdUsed = true;
      currentUser.pendingInvestmentStep = 'account_details';
      
      localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
      onUpdateUser({ 
        isInvestmentIdUsed: true,
        pendingInvestmentStep: 'account_details'
      });
      
      setStatus('success');
      setStep('account_details');
    }, 3000);
  };

  const handleVerifyWithdrawalAccount = () => {
    if (!withdrawalAccount.accountNumber || !withdrawalAccount.bankName || !withdrawalAccount.accountName) {
      alert("Please fill in all account details.");
      return;
    }
    onUpdateUser({ pendingInvestmentStep: 'verification_payment' });
    setStep('verification_payment');
  };

  if (!user.isVIP) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <Icons.Lock size={40} className="text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">VIP Access Required</h2>
          <p className="text-sm text-gray-500 max-w-[250px] mx-auto">
            Only VIP members can access investment plans. Please upgrade to VIP first.
          </p>
        </div>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-amber-500 text-black font-black rounded-xl uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
        >
          BACK TO DASHBOARD
        </button>
      </div>
    );
  }

  if (step === 'verification_payment') {
    return (
      <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center space-x-2">
          <button onClick={() => {
            setStep('account_details');
            onUpdateUser({ pendingInvestmentStep: 'account_details' });
          }} className="p-2 rounded-full hover:bg-gray-800">
            <Icons.ArrowLeft size={24} className="text-amber-500" />
          </button>
          <h2 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Verification Payment</h2>
        </div>

        <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/30">
          <p className="text-sm font-medium leading-relaxed text-amber-500">
            To confirm your withdrawal account is valid, you need to pay <span className="font-black">₦22,000</span> into the management account. 
            <br/><br/>
            <span className="text-white font-bold">NOTE: This ₦22,000 will be reversed to your account immediately after payment is confirmed. It's just for account validation.</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-amber-500/30 space-y-4">
             <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500 uppercase font-bold">Amount</span>
                <span className="text-lg font-black text-white">₦22,000</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500 uppercase font-bold">Account Number</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black text-white tracking-widest">{accountNumber}</span>
                  <button onClick={handleCopy} className={`p-1.5 rounded-md transition-all ${copied ? 'bg-green-500 text-white' : 'bg-amber-500/20 text-amber-500'}`}>
                    {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500 uppercase font-bold">Bank Name</span>
                <span className="text-lg font-black text-amber-500 uppercase">{bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase font-bold">Account Name</span>
                <span className="text-sm font-black text-white uppercase">{accountName}</span>
              </div>
          </div>
        </div>



        {/* Payment Proof Upload */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-center">Step 2: Upload Payment Proof</p>
          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setInvestProof(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="sr-only" 
              id="invest-proof-upload"
            />
            <label 
              htmlFor="invest-proof-upload"
              className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                investProof ? 'border-green-500 bg-green-900/20' : 'border-gray-800 hover:border-amber-500'
              }`}
            >
              {investProof ? (
                <>
                  <Icons.CheckCircle className="text-green-500" size={24} />
                  <span className="text-xs font-bold text-green-400 uppercase">Receipt Uploaded</span>
                </>
              ) : (
                <>
                  <Icons.Upload className="text-gray-500" size={24} />
                  <span className="text-xs font-bold text-gray-500 uppercase">Click to Upload Receipt (₦22,000)</span>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => {
              if (user && user.pendingPaymentProof) {
                alert("You already have a pending payment proof awaiting administrator verification. You cannot upload another receipt until it is approved or declined.");
                return;
              }
              const oneHour = 60 * 60 * 1000;
              if (user && user.lastUploadTimestamp && (Date.now() - user.lastUploadTimestamp < oneHour)) {
                const remainingMinutes = Math.ceil((oneHour - (Date.now() - user.lastUploadTimestamp)) / (60 * 1000));
                alert(`You can only upload a receipt once every hour. Please wait ${remainingMinutes} minutes before attempting another upload.`);
                return;
              }
              if (!investProof) {
                alert("Please upload a receipt photo of your payment first.");
                return;
              }
              const restoreTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
              onUpdateUser({ 
                pendingInvestmentStep: null,
                isRestricted: true,
                restrictionType: 'verification',
                restrictionRestoreTime: restoreTime,
                pendingActivation: 'investment',
                pendingPaymentProof: investProof,
                pendingPaymentAmount: 22000,
                pendingPaymentDate: new Date().toISOString(),
                lastUploadTimestamp: Date.now()
              });
              setShowSuccessModal(true);
            }}
            className="w-full py-4 bg-amber-500 text-black font-black rounded-xl uppercase tracking-widest shadow-xl active:scale-95 transition-all text-center"
          >
            I HAVE PAID
          </button>
        </div>
      </div>
    );
  }

  if (step === 'account_details') {
    return (
      <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center space-x-2">
          <button onClick={() => {
            if (user.isInvestmentIdUsed) {
              onBack();
              return;
            }
            setStep('plans');
            onUpdateUser({ pendingInvestmentStep: null });
          }} className="p-2 rounded-full hover:bg-gray-800">
            <Icons.ArrowLeft size={24} className="text-amber-500" />
          </button>
          <h2 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Withdrawal Account</h2>
        </div>

        <div className="bg-gray-900 border border-amber-500/20 p-6 rounded-2xl space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Bank Name</label>
            <select
              value={withdrawalAccount.bankName}
              onChange={(e) => setWithdrawalAccount({...withdrawalAccount, bankName: e.target.value})}
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer"
            >
              <option value="" disabled className="text-gray-500">Select Bank</option>
              {banksList.map((b) => (
                <option key={b} value={b} className="bg-black text-white">{b}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Account Number</label>
            <input 
              type="text" 
              placeholder="Enter 10-Digit Account Number"
              value={withdrawalAccount.accountNumber}
              onChange={(e) => setWithdrawalAccount({...withdrawalAccount, accountNumber: e.target.value})}
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-bold tracking-widest"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Account Name</label>
            <input 
              type="text" 
              placeholder="Will auto-resolve..."
              value={withdrawalAccount.accountName}
              onChange={(e) => setWithdrawalAccount({...withdrawalAccount, accountName: e.target.value})}
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-bold"
              disabled={verificationStatus === 'verifying'}
            />
            {/* Inline verification feedback */}
            {verificationStatus === 'verifying' && (
              <div className="text-xs text-amber-500 flex items-center space-x-1.5 mt-1 ml-1 animate-pulse">
                <div className="w-3.5 h-3.5 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>Resolving recipient name on central nodes...</span>
              </div>
            )}
            {verificationStatus === 'success' && (
              <div className="text-xs text-green-500 flex items-center space-x-1.5 mt-1 ml-1 font-bold">
                <Icons.CheckCircle size={14} className="text-green-500" />
                <span>Verified: <strong className="text-white tracking-wide">{withdrawalAccount.accountName}</strong></span>
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
          onClick={handleVerifyWithdrawalAccount}
          className="w-full py-4 bg-amber-500 text-black font-black rounded-xl uppercase tracking-widest text-lg shadow-xl active:scale-95 transition-all"
        >
          VERIFY ACCOUNT
        </button>
      </div>
    );
  }

  if (selectedPlan && step === 'payment') {
    return (
      <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center space-x-2">
          <button onClick={() => { setSelectedPlan(null); setStep('plans'); }} className="p-2 rounded-full hover:bg-gray-800">
            <Icons.ArrowLeft size={24} className="text-amber-500" />
          </button>
          <h2 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Payment Details</h2>
        </div>

        <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Selected Plan</p>
              <h3 className="text-lg font-bold text-white">{selectedPlan.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-amber-500">₦{selectedPlan.investAmount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Investment Amount</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Step 1: Transfer to Management Account</p>
          
          <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-amber-500/30 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500 uppercase font-bold">Account Number</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black text-white tracking-widest">{accountNumber}</span>
                  <button 
                    onClick={handleCopy}
                    className={`p-1.5 rounded-md transition-all ${copied ? 'bg-green-500 text-white' : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'}`}
                  >
                    {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-xs text-gray-500 uppercase font-bold">Bank Name</span>
                <span className="text-lg font-black text-amber-500 uppercase">{bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase font-bold">Account Name</span>
                <span className="text-sm font-black text-white uppercase">{accountName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Step 2: Enter Investment ID</p>
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="ENTER INVESTMENT ID"
              value={investmentIdInput}
              onChange={(e) => setInvestmentIdInput(e.target.value.toUpperCase())}
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-black text-center tracking-widest uppercase"
            />
            <p className="text-[10px] text-gray-500 font-medium text-center uppercase tracking-tight">
              Enter the ID provided after your successful transfer to verify.
            </p>
          </div>
        </div>

        {status === 'failed' && (
          <div className="bg-red-900/30 p-4 rounded-xl flex items-center justify-center space-x-3 animate-in shake duration-300 border border-red-800">
            <Icons.X className="text-red-400" size={20} />
            <p className="text-sm font-black text-red-400 uppercase">Verification Pending</p>
          </div>
        )}

        <button 
          onClick={handleVerify}
          disabled={status === 'loading'}
          className={`w-full py-4 rounded-xl text-black font-black text-lg shadow-xl transition-all flex items-center justify-center space-x-2 ${
            status === 'loading'
            ? 'bg-gray-700 cursor-not-allowed'
            : 'bg-amber-500 hover:bg-amber-600 transform active:scale-95'
          }`}
        >
          {status === 'loading' ? <Icons.Sync className="animate-spin" size={20} /> : <Icons.ShieldCheck size={20} />}
          <span className="uppercase tracking-widest">{status === 'loading' ? 'Verifying...' : 'Verify Investment'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800">
          <Icons.ArrowLeft size={24} className="text-amber-500" />
        </button>
        <h2 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Investment Plans</h2>
      </div>

      <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 shadow-sm">
        <p className="text-sm text-amber-500/80 leading-relaxed font-medium">
          Grow your wealth with our high-yield investment plans. Select a plan below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => { setSelectedPlan(plan); setStep('payment'); }}
            className={`relative overflow-hidden p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-amber-500 cursor-pointer active:scale-[0.98] transition-all group`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${plan.color} opacity-10 -mr-10 -mt-10 rounded-full group-hover:opacity-20 transition-opacity`}></div>
            
            <div className="relative z-10 flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{plan.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded uppercase">Return in {plan.duration}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase">Invest</p>
                <p className="text-lg font-black text-white">₦{plan.investAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Expected Return</p>
                <p className="text-xl font-black text-amber-500">₦{plan.returnAmount.toLocaleString()}</p>
              </div>
              <div className="bg-amber-500 text-black p-2 rounded-lg shadow-lg group-hover:translate-x-1 transition-transform">
                <Icons.ArrowRight size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

        <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 text-center">
          <p className="text-[10px] text-amber-500/60 font-medium uppercase tracking-widest leading-relaxed">
            All investments are processed within 24 hours. <br/>
            DON'T USE OPAY OR PALMPAY TO PAY FOR INVESTMENTS.
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
                  onBack();
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

export default Investment;
