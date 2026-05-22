
import React, { useState } from 'react';
import { Icons } from './Icons';
import { User } from '../types';

interface ImminentPaymentProps {
  user: User;
  onBack: () => void;
}

const ImminentPayment: React.FC<ImminentPaymentProps> = ({ user, onBack }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed'>('idle');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);

  const isDeactivated = user.deactivationDate ? Date.now() > user.deactivationDate : false;
  const amount = isDeactivated ? 30000 : 20000;

  const handlePayNow = () => {
    const accountNumber = "0435119272";
    navigator.clipboard.writeText(accountNumber);
    alert(
       `ACTIVATION DETAILS\n\n` +
       `Bank: Paga\n` +
       `Account Number: ${accountNumber}\n` +
       `Account Name: Marvelous Michael O\n\n` +
       `AMOUNT: ₦${amount.toLocaleString()}\n\n` +
       `Account number copied! Make payment and click "Verify" below.`
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!paymentProof) {
      alert("Please upload payment proof before verifying.");
      return;
    }
    setStatus('loading');
    
    // Simulate processing then fail
    setTimeout(() => {
      setStatus('failed');
    }, 3000);
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800">
             <Icons.ArrowLeft size={24} className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">Imminent Activation</h2>
      </div>

      <div className="bg-green-glow/10 p-4 rounded-xl border border-green-glow/20 shadow-sm">
        <h3 className="font-bold text-green-glow mb-2 flex items-center">
            <Icons.ShieldCheck className="mr-2" size={18} />
            Mandatory Activation
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed font-medium">
            New users and subscribers must complete the imminent payment to secure their account status. This is a one-time verification requirement.
        </p>
      </div>

      {/* PAY Now Section */}
      <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-green-glow"></div>
        
        <div className="text-center space-y-1">
            <p className="text-xs font-black text-green-glow uppercase tracking-widest">{isDeactivated ? 'Deactivation Penalty' : 'Verification Amount'}</p>
            <p className="text-3xl font-black text-white">₦{amount.toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left border-t border-gray-800 pt-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Bank Name</p>
            <p className="text-sm font-black text-white">Paga</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Account Name</p>
            <p className="text-sm font-black text-white">Marvelous Michael O</p>
          </div>
          <div className="col-span-2 space-y-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Account Number</p>
            <div className="flex items-center justify-between bg-black p-3 rounded-xl border border-gray-800">
              <p className="text-xl font-black text-green-glow tracking-wider">0435119272</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("0435119272");
                  alert("Account number copied to clipboard!");
                }}
                className="p-2 bg-green-glow/10 text-green-glow rounded-lg active:scale-90 transition-transform"
              >
                <Icons.Copy size={18} />
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handlePayNow}
          className="w-full py-5 bg-green-glow hover:bg-green-dark text-black font-black text-xl rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-3 group"
        >
          <Icons.Banknote size={28} className="group-hover:rotate-6 transition-transform" />
          <span className="uppercase tracking-widest">Copy Details</span>
        </button>
        
        <p className="text-[10px] text-gray-500 text-center font-medium italic">Make payment of ₦{amount.toLocaleString()} to the account above</p>
        
        <div className="bg-red-900/20 p-3 rounded-lg border border-red-800 text-center">
          <p className="text-[10px] text-red-400 font-bold leading-tight uppercase tracking-tight">
            ⚠️ DO NOT USE OPAY AND PALMPAY TO PAY FOR SUBSCRIPTION. <br/>
            MONIEPOINT AND ANY OTHER BANK IS ALLOWED.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t border-gray-800">
          {/* Payment Proof Upload */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-center">Step 2: Upload Payment Proof</p>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="hidden" 
                id="imminent-proof-upload"
              />
              <label 
                htmlFor="imminent-proof-upload"
                className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                  paymentProof ? 'border-green-500 bg-green-900/20' : 'border-gray-800 hover:border-green-glow'
                }`}
              >
                {paymentProof ? (
                  <>
                    <Icons.CheckCircle className="text-green-500" size={24} />
                    <span className="text-xs font-bold text-green-400 uppercase">Proof Uploaded</span>
                  </>
                ) : (
                  <>
                    <Icons.Upload className="text-gray-500" size={24} />
                    <span className="text-xs font-bold text-gray-500 uppercase">Click to Upload Receipt</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-center">Step 3: Confirm Activation</p>

          {status === 'failed' && (
              <div className="bg-red-900/30 p-4 rounded-xl flex items-center justify-center space-x-3 animate-in shake duration-300 border border-red-800">
                  <div className="bg-red-800 p-1 rounded-full">
                      <Icons.X className="text-red-100" size={18} />
                  </div>
                  <p className="text-sm font-bold text-red-300">Verification Pending. Ensure payment is sent.</p>
              </div>
          )}

          <button 
            onClick={handleSubmit} 
            disabled={status === 'loading'}
            className="w-full py-4 bg-green-glow hover:bg-green-dark disabled:bg-gray-800 text-black font-black rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 uppercase tracking-widest"
          >
              {status === 'loading' ? (
                  <>
                    <Icons.Sync className="animate-spin" size={20} />
                    <span>Verifying...</span>
                  </>
              ) : (
                  <span>Verify</span>
              )}
          </button>

          <div className="bg-gray-900 p-3 rounded-lg text-center border border-gray-800">
            <p className="text-[10px] text-gray-500 font-medium leading-tight">
                Our security protocol will automatically match your transaction ID. <br/>
                <span className="font-bold">Avoid duplicate activation attempts.</span>
            </p>
          </div>
      </div>
    </div>
  );
};

export default ImminentPayment;
