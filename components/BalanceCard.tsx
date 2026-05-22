import React, { useState } from 'react';
import { Icons } from './Icons';

interface BalanceCardProps {
  balance: number;
  isSubscribed?: boolean;
  isVIP?: boolean;
  onAdminClick?: () => void;
  onHistoryClick?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, isSubscribed = false, isVIP = false, onAdminClick, onHistoryClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  const formatCurrency = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-gradient-to-br from-green-light via-green-glow to-green-dark rounded-2xl p-4 mb-4 relative overflow-hidden transition-all duration-500 border border-green-dark shadow-green-lg group">
        {/* Background decoration */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/30 rounded-full mix-blend-overlay filter blur-2xl opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2 text-black/70 text-sm font-medium">
                        <div className="flex items-center text-black bg-white/30 px-2 py-0.5 rounded-full text-xs font-bold">
                            <span className="mr-1">✓</span> Available Balance
                        </div>
                        <button onClick={() => setIsVisible(!isVisible)} className="text-black/60 hover:text-black transition-colors">
                            {isVisible ? <Icons.Eye size={16} /> : <Icons.EyeOff size={16} />}
                        </button>
                    </div>
                    {isVIP ? (
                        <div className="flex items-center text-amber-900 bg-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black w-fit uppercase tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-gold-shine">
                            <Icons.Star size={12} className="mr-1 fill-amber-900" /> VIP Member
                        </div>
                    ) : isSubscribed ? (
                        <div className="flex items-center text-amber-900 bg-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black w-fit uppercase tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-gold-shine">
                            <Icons.Star size={12} className="mr-1 fill-amber-900" /> Subscribed Member
                        </div>
                    ) : null}
                </div>
                <button className="text-sm text-black/70 flex items-center font-medium hover:text-black transition-colors">
                    Add Money <Icons.ChevronRight size={14} />
                </button>
            </div>

            <div className="flex justify-between items-end">
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <h1 className="text-3xl font-extrabold text-black tracking-tight">
                            {isVisible ? formatCurrency(balance) : '₦ •••••••'}
                        </h1>
                        <Icons.ChevronRight className="text-black ml-1" size={24} />
                    </div>
                </div>
                <button 
                    onClick={onHistoryClick}
                    className="bg-black hover:bg-gray-900 text-fuchsia-400 px-4 py-2 rounded-full text-xs font-bold shadow-lg active:scale-95 transition-all"
                >
                    Transaction History
                </button>
            </div>

            <div className="mt-4 pt-2 border-t border-black/10 flex justify-between items-center">
                <p className="text-xs text-black/80 font-medium flex items-center">
                    <span className="bg-black text-fuchsia-400 text-[10px] px-1 rounded mr-2 font-bold">10</span>
                    Higher return? Increase deposit with <span className="text-black ml-1 font-bold">20% p.a.</span>
                </p>
                <button 
                    onClick={onAdminClick}
                    className="text-black text-xs font-bold flex items-center hover:bg-black/10 px-2 py-1 rounded-md transition-colors"
                >
                    Go <Icons.ChevronRight size={12} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default BalanceCard;