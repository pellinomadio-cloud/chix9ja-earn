import React, { useState } from 'react';
import { Icons } from './Icons';

interface BalanceCardProps {
  balance: number;
  isSubscribed?: boolean;
  isVIP?: boolean;
  subscriptionPlan?: string;
  onAdminClick?: () => void;
  onHistoryClick?: () => void;
  onDepositClick?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, isSubscribed = false, isVIP = false, subscriptionPlan = '', onAdminClick, onHistoryClick, onDepositClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  const formatCurrency = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 rounded-2xl p-4 mb-4 relative overflow-hidden transition-all duration-500 border border-amber-600 shadow-[0_0_25px_rgba(245,158,11,0.5)] group">
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
                        <div className="flex items-center text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black w-fit uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-gold-shine">
                            <Icons.Star size={12} className="mr-1 fill-amber-950" /> VIP Member
                        </div>
                    ) : isSubscribed ? (
                        <div className="flex items-center text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black w-fit uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-gold-shine">
                            <Icons.Star size={12} className="mr-1 fill-amber-950" /> Subscribed Member
                        </div>
                    ) : null}
                </div>
                <button onClick={onDepositClick} className="text-sm text-black/70 flex items-center font-medium hover:text-black transition-colors active:scale-95 cursor-pointer">
                    Add Money <Icons.ChevronRight size={14} />
                </button>
            </div>

            <div className="flex justify-between items-end">
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-extrabold text-black tracking-tight">
                            {isVisible ? formatCurrency(balance) : '₦ •••••••'}
                        </h1>
                        {isSubscribed && (
                            <span className="ml-2 text-xl animate-pulse" role="img" aria-label="congratulations">🎉</span>
                        )}
                        <Icons.ChevronRight className="text-black ml-1" size={20} />
                    </div>
                </div>
                <button 
                    onClick={onHistoryClick}
                    className="shining-diamond-button px-4 py-2 rounded-full text-xs font-black shadow-lg active:scale-95 transition-all flex items-center space-x-1"
                >
                    <span className="text-xs">💎</span>
                    <span>Transaction History</span>
                </button>
            </div>

            <div className="mt-4 pt-2 border-t border-black/10 flex justify-between items-center">
                <p className="text-xs text-black/80 font-medium flex items-center">
                    <span className="bg-black text-amber-400 text-[10px] px-1 rounded mr-2 font-bold">10</span>
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