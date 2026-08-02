
import React, { useState } from 'react';
import { Icons } from './Icons';

interface TelegramAdProps {
  onJoin: () => void;
  onContinue: () => void;
}

const TelegramAd: React.FC<TelegramAdProps> = ({ onJoin, onContinue }) => {
  const [hasClickedJoin, setHasClickedJoin] = useState(false);

  const handleJoin = () => {
    setHasClickedJoin(true);
    onJoin();
  };

  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden text-center space-y-6 animate-in zoom-in-95 duration-300 border border-gray-800">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-glow/10 to-transparent pointer-events-none"></div>
        
        <div className="relative">
             <div className="w-20 h-20 bg-green-glow rounded-full mx-auto flex items-center justify-center shadow-lg mb-4 animate-pulse">
                <Icons.Send size={40} className="text-black ml-1" />
             </div>
             <h2 className="text-2xl font-black text-white">Join Our Community!</h2>
             <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                Stay updated! Join our official Telegram channel for exclusive rewards, updates, and support.
             </p>
             <p className="text-green-glow font-bold mt-1">@chix9ja</p>
        </div>

        <div className="space-y-3">
            <button 
                onClick={handleJoin}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2"
            >
                <Icons.Send size={18} />
                <span>Join Official Telegram Channel</span>
                {hasClickedJoin && <Icons.Check size={16} className="text-black stroke-[3]" />}
            </button>
            <button 
                onClick={handleContinue}
                className="w-full py-3.5 font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-emerald-400/40"
            >
              <span>Continue to Dashboard</span>
            </button>
        </div>

        <p className="text-[11px] text-emerald-300/80 font-semibold">
          ✨ You can join our channel now or continue directly to your dashboard.
        </p>
      </div>
    </div>
  );
};

export default TelegramAd;
