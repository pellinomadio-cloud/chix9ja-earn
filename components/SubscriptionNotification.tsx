
import React from 'react';
import { Icons } from './Icons';

interface SubscriptionNotificationProps {
  onSubscribe: () => void;
}

const SubscriptionNotification: React.FC<SubscriptionNotificationProps> = ({ onSubscribe }) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-black p-3 text-white shadow-md mb-3 animate-in slide-in-from-top-4 duration-500 border border-green-glow/20">
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-green-glow opacity-10 blur-xl"></div>
      <div className="absolute bottom-0 left-0 -ml-4 -mb-4 h-16 w-16 rounded-full bg-green-glow opacity-5 blur-xl"></div>

      <div className="relative z-10 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-glow/20 text-green-glow ring-1 ring-green-glow/50">
              <Icons.Lock size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight">Account Restricted</h3>
              <p className="text-[9px] text-gray-400 leading-tight">Transfers & Withdrawals Locked</p>
            </div>
          </div>
          <span className="rounded-full bg-green-glow text-black px-1.5 py-0.5 text-[9px] font-bold shadow-sm animate-pulse">
            Action Required
          </span>
        </div>

        <button 
          onClick={onSubscribe}
          className="w-full flex items-center justify-center space-x-2 rounded-lg bg-white py-1.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-transform active:scale-95 hover:bg-gray-100 animate-white-glow-button"
        >
          <span>Subscribe to Unlock</span>
          <Icons.ArrowRight size={12} />
        </button>
      </div>
      <style>{`
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

export default SubscriptionNotification;
