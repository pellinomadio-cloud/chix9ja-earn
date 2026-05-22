
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface RewardsProps {
  currentDay: number;
  canClaim: boolean;
  onClaim: () => void;
  lastClaimedTimestamp: number;
  onBack: () => void;
}

const Rewards: React.FC<RewardsProps> = ({ currentDay, canClaim, onClaim, lastClaimedTimestamp, onBack }) => {
  const [timeLeft, setTimeLeft] = useState('');

  // Generate days 1 to 100
  const days = Array.from({ length: 100 }, (_, i) => i + 1);

  useEffect(() => {
    if (canClaim) {
        setTimeLeft('00:00:00');
        return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const nextClaimTime = lastClaimedTimestamp + twentyFourHours;
      
      const diff = nextClaimTime - now;
      
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${h.toString().padStart(2, '0')}h : ${m.toString().padStart(2, '0')}m : ${s.toString().padStart(2, '0')}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [canClaim, lastClaimedTimestamp]);

  const progressPercentage = Math.min(((currentDay - 1) / 100) * 100, 100);

  return (
    <div className="bg-black min-h-screen animate-in fade-in duration-500">
      <div className="px-4 py-4 space-y-6">
        
        {/* Header with Green Back Button */}
        <div className="flex items-center pt-2">
            <button 
                onClick={onBack} 
                className="bg-green-glow hover:bg-green-dark text-black px-6 py-2 rounded-full flex items-center text-sm font-bold shadow-md transition-colors"
            >
                 <Icons.ArrowLeft size={18} className="mr-2" strokeWidth={3} /> Back
            </button>
            <h1 className="ml-4 text-2xl font-bold text-green-glow text-glow-green">chix9ja</h1>
        </div>

        {/* Progress Card */}
        <div className="bg-gray-900 rounded-3xl p-6 shadow-green border border-green-glow/20">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-300">Progress: {Math.round(progressPercentage)}%</span>
                <span className="text-xs text-gray-500">{currentDay - 1}/100 days</span>
            </div>
            <div className="w-full bg-black rounded-full h-4 border border-gray-800 overflow-hidden">
                <div 
                    className="bg-green-glow h-4 rounded-full transition-all duration-500 shadow-green-lg animate-green-pulse"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
        </div>

        {/* Green Timer/Action Card */}
        <div className="bg-green-glow rounded-3xl p-8 text-center text-black shadow-green-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="mb-4 bg-black rounded-full p-2 shadow-green">
                     <Icons.Clock size={32} className="text-green-glow" fill="currentColor" />
                </div>
                
                {!canClaim ? (
                    <>
                        <p className="text-black/70 text-sm mb-2 font-medium">Next reward available in:</p>
                        <div className="bg-black/10 backdrop-blur-sm rounded-xl px-6 py-2 mb-2 border border-black/5">
                             <h2 className="text-3xl font-mono font-bold tracking-widest">{timeLeft}</h2>
                        </div>
                         <div className="mt-2 px-8 py-3 bg-black/10 backdrop-blur-md text-black/50 font-bold text-lg rounded-xl border border-black/10">
                            Claimed for today
                        </div>
                    </>
                ) : (
                    <div className="mb-2 w-full">
                        <p className="text-black/70 text-sm mb-2 font-medium">Your reward is ready!</p>
                         <button 
                            onClick={onClaim}
                            className="w-full px-8 py-4 bg-black text-green-glow font-bold text-xl rounded-xl transition-all shadow-green-lg animate-green-glow-button flex items-center justify-center"
                        >
                            Ready to Claim! 🎉
                        </button>
                    </div>
                )}
            </div>

            <style>{`
              @keyframes green-glow-button {
                0% { box-shadow: 0 0 5px rgba(0, 255, 65, 0.4); filter: brightness(1); }
                50% { box-shadow: 0 0 25px rgba(0, 255, 65, 0.9); filter: brightness(1.4); }
                100% { box-shadow: 0 0 5px rgba(0, 255, 65, 0.4); filter: brightness(1); }
              }
              .animate-green-glow-button {
                animation: green-glow-button 2s infinite ease-in-out;
              }
            `}</style>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-4 gap-3 pb-10">
            {days.map((day) => {
                const isClaimed = day < currentDay;
                const isCurrent = day === currentDay;
                
                return (
                    <div 
                        key={day}
                        className={`
                            aspect-[4/5] rounded-2xl flex flex-col items-center justify-center p-1 border transition-all
                            ${isClaimed 
                                ? 'bg-gray-900 border-green-glow shadow-[0_0_5px_rgba(0,255,65,0.1)]' 
                                : isCurrent && canClaim
                                    ? 'bg-gray-900 border-green-glow shadow-lg transform scale-105 z-10 ring-1 ring-green-glow/50' 
                                    : 'bg-gray-900/50 border-gray-800'
                            }
                        `}
                    >
                        <span className="text-[10px] font-medium text-gray-500 mb-1">Day {day}</span>
                        <span className={`text-[9px] font-black mb-2 ${isClaimed || isCurrent ? 'text-green-glow' : 'text-gray-600'}`}>
                            ₦100,000
                        </span>
                        {isClaimed && (
                            <div className="flex items-center text-[8px] text-green-glow font-bold bg-green-glow/10 px-1.5 py-0.5 rounded-full">
                                <span className="mr-0.5">✓</span> Claimed
                            </div>
                        )}
                         {isCurrent && !isClaimed && (
                            <span className={`text-[8px] ${canClaim ? 'bg-green-glow text-black animate-pulse' : 'bg-gray-800 text-gray-500'} px-2 py-0.5 rounded-full font-bold`}>
                                {canClaim ? 'Ready' : 'Locked'}
                            </span>
                        )}
                        {!isClaimed && !isCurrent && (
                             <Icons.Lock size={12} className="text-gray-700" />
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
