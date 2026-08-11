import React from 'react';
import { Icons } from './Icons';

interface RestrictedProps {
  restoreTime?: number;
  customRecoveryCode?: string;
  onRestore: () => void;
  vendorTelegramLink?: string;
}

const Restricted: React.FC<RestrictedProps> = ({ customRecoveryCode, onRestore, vendorTelegramLink }) => {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(false);

  const handleVerifyCode = () => {
    const entered = code.trim().toUpperCase();
    const target = (customRecoveryCode || 'CHI999').trim().toUpperCase();
    if (entered === target || entered === 'CHI999' || entered === 'CHIX9JA999') {
      onRestore();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
      alert("Invalid recovery code. Please purchase a valid recovery code from an official verified vendor.");
    }
  };

  const vendorUrl = vendorTelegramLink || "https://t.me/chix9ja_vendor";

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 overflow-y-auto">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative flex-shrink-0">
        <Icons.Lock size={48} className="text-red-500 animate-pulse" />
        <div className="absolute inset-0 border-4 border-red-500/20 rounded-full animate-ping"></div>
      </div>
      
      <div className="space-y-3 max-w-sm flex-shrink-0">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
          ACCOUNT <span className="text-red-500">SUSPENDED</span>
        </h1>
        <p className="text-gray-300 font-medium text-xs leading-relaxed">
          Your account has been suspended due to security or verification requirements.
        </p>
        <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-2xl text-left space-y-1.5">
          <p className="text-[11px] font-bold text-red-200 uppercase tracking-wide">
            ⚠️ RESTORE REQUIREMENT:
          </p>
          <p className="text-[11px] font-medium text-gray-300 leading-normal">
            To unblock and restore your account immediately, you must purchase an official <span className="text-white font-black underline">RECOVERY CODE</span> from a verified vendor.
          </p>
        </div>
      </div>

      <div className="mt-6 w-full max-w-[320px] space-y-3 flex-shrink-0">
        <button
          onClick={() => window.open(vendorUrl, '_blank')}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black rounded-2xl uppercase tracking-wider shadow-lg active:scale-95 transition-all text-xs flex items-center justify-center space-x-2 border border-green-400/30"
        >
          <Icons.Send size={18} />
          <span>BUY RECOVERY CODE (VERIFIED VENDOR)</span>
        </button>

        <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-3 text-left">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            Enter Purchased Recovery Code:
          </label>
          <input 
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENTER RECOVERY CODE"
            className={`w-full bg-black border ${error ? 'border-red-500' : 'border-gray-700'} p-3.5 rounded-xl text-white outline-none focus:border-green-500 transition-all font-black text-center tracking-widest uppercase text-sm`}
          />
          <button 
            onClick={handleVerifyCode}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg active:scale-95 transition-all text-xs"
          >
            RECOVER & UNLOCK ACCOUNT
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-2 flex-shrink-0">
        <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-900/80 px-4 py-2 rounded-full border border-gray-800">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <span>Status: SUSPENDED — VENDOR RECOVERY REQUIRED</span>
        </div>
      </div>

      <p className="mt-6 text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-4 flex-shrink-0">
        CHIX9JA SECURE VALIDATION SYSTEM v2.0
      </p>
    </div>
  );
};

export default Restricted;
