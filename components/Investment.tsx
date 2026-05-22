
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User } from '../types';

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
  const initialStep = user.isInvestmentIdUsed 
    ? (user.pendingInvestmentStep || 'account_details') 
    : (user.pendingInvestmentStep || 'plans');

  const [step, setStep] = useState<'plans' | 'payment' | 'account_details' | 'verification_payment'>(initialStep);

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

  const accountNumber = "0435119272";
  const bankName = "Paga";
  const accountName = "Marvelous Michael O";

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

        <div className="space-y-3">
          <button 
            onClick={() => {
              const restoreTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
              onUpdateUser({ 
                pendingInvestmentStep: null,
                isRestricted: true,
                restrictionType: 'verification',
                restrictionRestoreTime: restoreTime
              });
              alert("Verification payment submitted. Account restricted for 24 hours while we finalize your investment ID validation.");
            }}
            className="w-full py-4 bg-amber-500 text-black font-black rounded-xl uppercase tracking-widest shadow-xl active:scale-95 transition-all"
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
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Account Number</label>
            <input 
              type="text" 
              placeholder="Enter Account Number"
              value={withdrawalAccount.accountNumber}
              onChange={(e) => setWithdrawalAccount({...withdrawalAccount, accountNumber: e.target.value})}
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Bank Name</label>
            <input 
              type="text" 
              placeholder="Enter Bank Name"
              value={withdrawalAccount.bankName}
              onChange={(e) => setWithdrawalAccount({...withdrawalAccount, bankName: e.target.value})}
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Account Name</label>
            <input 
              type="text" 
              placeholder="Enter Account Name"
              value={withdrawalAccount.accountName}
              onChange={(e) => setWithdrawalAccount({...withdrawalAccount, accountName: e.target.value})}
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-bold"
            />
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
    </div>
  );
};

export default Investment;
