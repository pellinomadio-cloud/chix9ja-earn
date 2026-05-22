import React from 'react';
import { Icons } from './Icons';

interface RestrictedProps {
  restoreTime?: number;
  onRestore: () => void;
}

const Restricted: React.FC<RestrictedProps> = ({ restoreTime, onRestore }) => {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(false);

  const getTimeRemaining = () => {
    if (!restoreTime) return "24 HOURS";
    const diff = restoreTime - Date.now();
    if (diff <= 0) return "RESTORING...";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}H ${minutes}M`;
  };

  const handleVerifyCode = () => {
    if (code.toUpperCase() === 'CHI999') {
      onRestore();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
      alert("Invalid recovery code. Please contact management.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 overflow-y-auto">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 relative flex-shrink-0">
        <Icons.Lock size={48} className="text-red-500 animate-pulse" />
        <div className="absolute inset-0 border-4 border-red-500/20 rounded-full animate-ping"></div>
      </div>
      
      <div className="space-y-4 max-w-sm flex-shrink-0">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
          ACCOUNT <span className="text-red-500">RESTRICTED</span>
        </h1>
        <p className="text-gray-400 font-medium leading-relaxed">
          Your account has been temporarily restricted for verification processing. 
          This is a standard security measure to ensure all validation payments are synchronized.
        </p>
      </div>

      <div className="mt-8 bg-gray-900 border border-red-500/20 rounded-3xl p-6 w-full max-w-[300px] space-y-2 flex-shrink-0">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estimated Restoration In</p>
        <p className="text-4xl font-black text-red-500 tracking-tighter font-mono">{getTimeRemaining()}</p>
      </div>

      <div className="mt-8 w-full max-w-[300px] space-y-4 flex-shrink-0">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Immediate Recovery</p>
          <div className="relative">
            <input 
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER RECOVERY CODE"
              className={`w-full bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-800'} p-4 rounded-2xl text-white outline-none focus:border-red-500 transition-all font-black text-center tracking-widest uppercase text-sm`}
            />
          </div>
        </div>
        <button 
          onClick={handleVerifyCode}
          className="w-full py-4 bg-red-500 text-white font-black rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all text-sm"
        >
          RECOVER ACCOUNT
        </button>
      </div>

      <div className="mt-8 space-y-2 flex-shrink-0">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-900/50 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Verification Status: PENDING</span>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-4 flex-shrink-0">
        CHIX9JA SECURE VALIDATION SYSTEM v2.0
      </p>
    </div>
  );
};

export default Restricted;
