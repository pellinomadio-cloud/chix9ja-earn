import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { NotificationPreferences } from '../types';

interface LiveNotificationsProps {
  preferences: NotificationPreferences;
}

interface CashoutData {
  firstName: string;
  initial: string;
  amountStr: string;
  bank: string;
  txRef: string;
}

// Nigerian names & standard initials
const firstNames = [
  "Mary", "John", "Chioma", "Emeka", "Olamide", "Sarah", "Grace", "David", 
  "Adewale", "Fatima", "Zainab", "Musa", "Blessing", "Emmanuel", "Amina", 
  "Chidi", "Tunde", "Bisi", "Kelechi", "Ngozi", "Yusuf", "Daniel", "Joy", 
  "Rita", "Florence", "Victor", "Babatunde", "Ifeanyi", "Nneka", "Amaka", 
  "Suleiman", "Ibrahim", "Tochukwu", "Kazeem", "Aisha", "Olumide", "Chinedu",
  "Uchenna", "Efe", "Tari", "Kufre", "Tobiloba", "Funmilayo", "Yetunde"
];

const initials = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "R", "S", "T", "U", "V", "W", "Y", "Z"];

const banks = [
  "Access Bank", "Kuda Bank", "GTBank", "Zenith Bank", "OPay", 
  "PalmPay", "First Bank", "UBA", "Fidelity Bank", "Wema Bank", 
  "Moniepoint"
];

const LiveNotifications: React.FC<LiveNotificationsProps> = ({ preferences }) => {
  const [cashout, setCashout] = useState<CashoutData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show random cashout testimony notification function
    const showRandomNotification = () => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const initial = initials[Math.floor(Math.random() * initials.length)];
      const bank = banks[Math.floor(Math.random() * banks.length)];
      
      // Random realistic withdrawal amount between 15,000 and 950,000 naira
      const amountVal = Math.floor(Math.random() * (950000 - 15000 + 1) + 15000);
      const amountStr = amountVal.toLocaleString();
      const randomRef = Math.floor(100000 + Math.random() * 900000);

      setCashout({
        firstName,
        initial,
        amountStr,
        bank,
        txRef: `CHX-${randomRef}`
      });
      setIsVisible(true);

      // Hide after 5.5 seconds
      setTimeout(() => setIsVisible(false), 5500);
    };

    // Initial delay before first notification
    const initialTimeout = setTimeout(showRandomNotification, 2500);

    // Loop interval (every 11 seconds)
    const interval = setInterval(() => {
      showRandomNotification();
    }, 11000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [preferences]);

  if (!cashout) return null;

  return (
    <div className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-[80] w-[92%] max-w-sm transition-all duration-700 ease-out ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-90 pointer-events-none'}`}>
      
      {/* Outer Shining Metallic Gold Frame */}
      <div className="p-[2px] rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-600 shadow-[0_12px_40px_rgba(234,179,8,0.5),0_0_20px_rgba(250,204,21,0.35)] animate-gold-glow relative overflow-hidden">
        
        {/* Continuous Diagonal Gold Light Sweep Reflection */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-100/35 to-transparent -skew-x-12 animate-gold-sweep pointer-events-none z-30" />

        {/* Inner Money / Banknote Card Container */}
        <div className="bg-gradient-to-b from-[#1c1303] via-[#2a1b04] to-[#120a01] text-white p-3.5 rounded-[14px] relative overflow-hidden border border-amber-400/60 shadow-2xl">
          
          {/* Subtle Banknote Watermark Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#facc15_1px,transparent_1px)] [background-size:10px_10px] opacity-[0.08] pointer-events-none" />

          {/* Money Banknote Inner Guilloché Border Frame */}
          <div className="border border-dashed border-amber-400/50 rounded-xl p-2.5 relative z-10 bg-gradient-to-b from-amber-950/40 via-yellow-950/20 to-black/60 backdrop-blur-sm">
            
            {/* Banknote Decorative Corner Flourishes */}
            <span className="absolute top-1 left-1.5 text-amber-400/80 text-[10px] font-black leading-none pointer-events-none">✦</span>
            <span className="absolute top-1 right-1.5 text-amber-400/80 text-[10px] font-black leading-none pointer-events-none">✦</span>
            <span className="absolute bottom-1 left-1.5 text-amber-400/80 text-[10px] font-black leading-none pointer-events-none">✦</span>
            <span className="absolute bottom-1 right-1.5 text-amber-400/80 text-[10px] font-black leading-none pointer-events-none">✦</span>

            {/* Header Badge Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-950 to-yellow-900 border border-amber-400/60 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 flex items-center gap-1">
                  <Icons.Sparkles size={11} className="text-yellow-300 animate-spin-slow" />
                  LIVE CASHOUT PROOF
                </span>
              </div>

              <span className="text-[9px] font-mono text-amber-300/90 font-bold tracking-tight bg-black/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                {cashout.txRef}
              </span>
            </div>

            {/* Main Content Body */}
            <div className="flex items-center space-x-3 my-1">
              {/* Shiny Metallic Gold Medallion Stamp */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 p-[2px] shadow-[0_0_18px_rgba(250,204,21,0.7)] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-amber-950 via-yellow-900 to-amber-950 flex items-center justify-center border border-yellow-300/70 relative">
                    <Icons.Banknote size={20} className="text-yellow-300 animate-pulse-gentle" />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 border border-yellow-200 rounded-full p-0.5 shadow-md">
                      <Icons.Check size={10} className="text-white stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* User Name & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-black text-amber-100 tracking-wide truncate">
                    {cashout.firstName} {cashout.initial}.
                  </p>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/50 shadow-sm flex-shrink-0">
                    PAID
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-amber-300/80 leading-tight">
                  Successfully cashed out to bank
                </p>
              </div>
            </div>

            {/* Realistic Banknote Money Highlight Box */}
            <div className="mt-2 bg-gradient-to-r from-[#291b03] via-[#3a2705] to-[#291b03] border border-amber-400/70 p-2 rounded-lg flex items-center justify-between shadow-[inset_0_1px_4px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.6)] relative overflow-hidden">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Amount:</span>
                <span className="text-base font-black font-mono text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] tracking-tight">
                  ₦{cashout.amountStr}
                </span>
              </div>

              <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-100 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-400/40 shadow-sm">
                <Icons.Bank size={11} className="text-amber-300" />
                <span className="truncate max-w-[100px]">{cashout.bank}</span>
              </div>
            </div>

            {/* Subtitle / Verification Tag */}
            <div className="mt-2 flex items-center justify-between text-[9px] text-amber-200/80 font-medium px-0.5">
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <Icons.CheckCircle size={10} className="text-emerald-400" />
                Direct Bank Credit
              </span>
              <span className="text-amber-300/70 italic">Just Now</span>
            </div>

          </div>

          {/* Glowing Metallic Gold Progress Bar */}
          {isVisible && (
            <div className="absolute bottom-0 left-0 h-[4px] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 shadow-[0_0_12px_rgba(250,204,21,1)] rounded-b-2xl animate-progress-bar" />
          )}

        </div>
      </div>

      <style>{`
        @keyframes progress-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes gold-sweep {
          0% { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(220%) skewX(-12deg); }
        }
        @keyframes gold-glow {
          0%, 100% {
            box-shadow: 0 10px 30px rgba(234, 179, 8, 0.45), 0 0 18px rgba(250, 204, 21, 0.3);
          }
          50% {
            box-shadow: 0 14px 45px rgba(234, 179, 8, 0.75), 0 0 28px rgba(250, 204, 21, 0.6);
          }
        }
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-progress-bar {
          animation: progress-bar 5.5s linear forwards;
        }
        .animate-gold-sweep {
          animation: gold-sweep 3.5s infinite ease-in-out;
        }
        .animate-gold-glow {
          animation: gold-glow 2.5s infinite ease-in-out;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s infinite ease-in-out;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LiveNotifications;
