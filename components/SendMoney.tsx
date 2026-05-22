
import React, { useState } from 'react';
import { Icons } from './Icons';
import { User } from '../types';

interface SendMoneyProps {
  user: User;
  onTransfer: (amount: number, recipientInfo: string) => void;
  onSubscribeRedirect: () => void;
  onGoHome: () => void;
}

const banks = [
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

const SendMoney: React.FC<SendMoneyProps> = ({ user, onTransfer, onSubscribeRedirect, onGoHome }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate deactivation state dynamically
  const isDeactivated = user.deactivationDate && Date.now() > user.deactivationDate;

  // Simulate account name lookup
  const handleAccountNumberBlur = () => {
    if (accountNumber.length === 10) {
       // Simulate looking up name
       if (!accountName) setAccountName("NOVA USER");
    }
  };

  const checkWithdrawalLimit = (transferAmount: number): string | null => {
    // If somehow not subscribed (should be caught earlier), block
    if (!user.subscriptionPlan) return "Subscription required";

    let limit = 0;
    let periodMs = 0;
    let planName = user.subscriptionPlan;

    // Determine limits based on plan name
    // Matches names set in AdminDashboard and Subscribe component
    if (planName === 'Weekly Plan') {
        limit = 500000;
        periodMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    } else if (planName === 'Monthly Plan') {
        limit = 2000000;
        periodMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else if (planName === 'Yearly Plan') {
        return null; // Unlimited
    } else {
        // Fallback for unknown plans or legacy data
        return null;
    }

    // Calculate total withdrawals in the rolling period
    const now = Date.now();
    const startTime = now - periodMs;
    
    const recentWithdrawals = (user.transactions || [])
        .filter(t => t.type === 'debit' && new Date(t.date).getTime() > startTime)
        .reduce((sum, t) => sum + t.amount, 0);

    if (recentWithdrawals + transferAmount > limit) {
        return `Limit exceeded. You have used ₦${recentWithdrawals.toLocaleString()} of your ₦${limit.toLocaleString()} limit for this period.`;
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isDeactivated) {
        setError("Account is deactivated");
        return;
    }

    if (!user.isSubscribed) {
        setError("Subscription Required");
        return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
        setError("Please enter a valid amount");
        return;
    }

    if (transferAmount > user.balance) {
        setError("Insufficient funds");
        return;
    }

    // Check Subscription Limits
    const limitError = checkWithdrawalLimit(transferAmount);
    if (limitError) {
        setError(limitError);
        return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
        onTransfer(transferAmount, `Withdraw to ${bank} - ${accountName}`);
        setIsLoading(false);
        setStep('success');
    }, 1500);
  };

  if (isDeactivated) {
    return (
        <div className="px-4 py-10 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-300">
           <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Icons.Ban size={48} className="text-red-400" />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-white mb-2">Withdrawal Restricted</h2>
              <div className="bg-red-900/20 p-4 rounded-xl border border-red-800">
                 <p className="text-red-300 font-bold text-sm leading-relaxed">
                     User must pay 20,000 naira to activate account, using a POS.
                 </p>
              </div>
          </div>
          <button 
              onClick={onGoHome}
              className="w-full max-w-sm bg-gray-800 text-white font-bold py-3 rounded-full transition-all"
          >
              Back to Dashboard
          </button>
        </div>
    );
  }

  if (!user.isSubscribed && step === 'form') {
      return (
        <div className="px-4 py-8 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-green-glow/10 rounded-full flex items-center justify-center mb-2">
                <Icons.Lock size={40} className="text-green-glow" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Feature Locked</h2>
                <p className="text-gray-500 max-w-xs mx-auto">
                    You must subscribe to a premium plan to perform bank withdrawals.
                </p>
            </div>
            <button 
                onClick={onSubscribeRedirect}
                className="w-full max-w-sm bg-white hover:bg-gray-100 text-black font-bold py-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all animate-white-glow-button"
            >
                Subscribe Now
            </button>
             <button 
                onClick={onGoHome}
                className="text-gray-500 text-sm font-medium hover:text-green-glow transition-colors"
            >
                Go Back Home
            </button>
        </div>
      );
  }

  if (step === 'success') {
    return (
      <div className="px-4 py-8 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-300">
         <div className="w-24 h-24 bg-green-glow/10 rounded-full flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-green-glow opacity-20 animate-ping"></div>
            <Icons.Check size={48} className="text-green-glow" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white mb-1">Withdrawal Successful!</h2>
            <p className="text-gray-500 text-sm">
                You successfully withdrew <span className="font-bold text-white">₦{parseFloat(amount).toLocaleString()}</span> to {accountName}.
            </p>
        </div>

        {user.transactions?.some(t => t.type === 'debit' && t.status === 'pending') && (
             <div className="w-full max-w-sm bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-start space-x-3 text-left border-l-4 border-blue-400">
                <Icons.Upgrade size={24} className="flex-shrink-0 text-blue-200" />
                <div>
                    <h3 className="font-bold text-xs uppercase tracking-wide">Transaction Pending</h3>
                    <p className="text-[10px] mt-1 font-medium leading-relaxed">Upgrade to VIP to remove your transaction on pending so your alerts drop immediately.</p>
                </div>
             </div>
        )}

        <div className="bg-gray-900 p-4 rounded-xl w-full max-w-sm border border-gray-800">
            <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-xs text-gray-500">Bank</span>
                <span className="text-sm font-bold text-white">{bank}</span>
            </div>
             <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-xs text-gray-500">Account</span>
                <span className="text-sm font-bold text-white">{accountNumber}</span>
            </div>
            <div className="flex justify-between py-2">
                <span className="text-xs text-gray-500">Transaction ID</span>
                <span className="text-xs font-mono text-white">TRX-{Math.floor(Math.random() * 100000000)}</span>
            </div>
        </div>
        <button 
            onClick={onGoHome}
            className="w-full max-w-sm bg-green-glow text-black font-bold py-3 rounded-full shadow-md transition-all"
        >
            Done
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
         <h2 className="text-xl font-bold text-white">Withdraw to Bank</h2>
         {user.subscriptionPlan && (
             <span className="inline-block mt-1 px-3 py-1 bg-green-glow/10 text-green-glow rounded-full text-[10px] font-bold uppercase tracking-wider">
                 Plan: {user.subscriptionPlan}
             </span>
         )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
             <div className="bg-red-900/20 text-red-400 text-sm p-3 rounded-lg text-center border border-red-800 animate-pulse">
                {error}
              </div>
        )}

        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Select Bank</label>
            <div className="relative">
                <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    required
                    className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl appearance-none text-white focus:ring-2 focus:ring-green-glow outline-none"
                >
                    <option value="" disabled>Choose a bank</option>
                    {banks.map(b => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>
                <Icons.ChevronRight className="absolute right-3 top-3.5 text-gray-400 rotate-90" size={20} />
            </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Account Number</label>
            <input
                type="number"
                value={accountNumber}
                onChange={(e) => {
                    if (e.target.value.length <= 10) setAccountNumber(e.target.value);
                }}
                onBlur={handleAccountNumberBlur}
                placeholder="0123456789"
                required
                className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-green-glow outline-none font-mono text-lg tracking-wider"
            />
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${accountNumber.length === 10 || accountName ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Account Name</label>
            <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Receiver Name"
                required
                className="w-full p-3 bg-gray-800 border border-transparent rounded-xl text-white font-bold focus:ring-2 focus:ring-green-glow outline-none"
            />
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Amount</label>
            <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-bold">₦</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full p-3 pl-8 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold text-lg focus:ring-2 focus:ring-green-glow outline-none"
                />
            </div>
            <div className="flex justify-between items-center mt-1">
                {user.isSubscribed && (
                    <div className="flex items-center text-amber-900 bg-amber-400 px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter border border-amber-600 shadow-sm animate-bounce">
                        <Icons.Star size={6} className="mr-1 fill-amber-900" /> Golden
                    </div>
                )}
                <p className="text-xs text-gray-500 text-right flex-1">
                    Balance: ₦{user.balance.toLocaleString()}
                </p>
            </div>
        </div>

        <button
            type="submit"
            disabled={isLoading || !bank || !accountNumber || !amount}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-800 text-black font-bold rounded-full shadow-lg transition-all mt-4 flex items-center justify-center space-x-2 animate-gold-glow-button"
        >
            {isLoading ? (
                <span>Processing...</span>
            ) : (
                <>
                    <span>Withdraw Money</span>
                    <Icons.ArrowUpRight size={20} />
                </>
            )}
        </button>
      </form>
      <style>{`
        @keyframes gold-glow-button {
          0% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.4); }
          50% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.8); }
          100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.4); }
        }
        .animate-gold-glow-button {
          animation: gold-glow-button 2s infinite ease-in-out;
        }
        @keyframes green-glow-button {
          0% { box-shadow: 0 0 5px rgba(0, 255, 127, 0.4); }
          50% { box-shadow: 0 0 15px rgba(0, 255, 127, 0.8); }
          100% { box-shadow: 0 0 5px rgba(0, 255, 127, 0.4); }
        }
        .animate-green-glow-button {
          animation: green-glow-button 2s infinite ease-in-out;
        }
        @keyframes white-glow-button {
          0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.4); }
          50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
          100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.4); }
        }
        .animate-white-glow-button {
          animation: white-glow-button 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SendMoney;
