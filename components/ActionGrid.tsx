
import React from 'react';
import { Icons } from './Icons';
import { MenuItem } from '../types';

const topRowItems: MenuItem[] = [
  { id: 'bank', label: 'Withdraw', icon: Icons.Send },
  { id: 'community', label: 'Community', icon: Icons.MessageCircle },
  { id: 'quiz_game', label: 'Gaming Hub', icon: Icons.Gamepad2 },
  { id: 'subscribe', label: 'Subscribe', icon: Icons.Subscribe },
];

const bottomGridItems: MenuItem[] = [
  { id: 'referrals', label: 'Refer & Earn', icon: Icons.Users, color: 'text-emerald-400', badge: 'Gift' },
  { id: 'invest', label: 'Invest', icon: Icons.Invest, color: 'text-amber-400' },
  { id: 'support', label: 'Support', icon: Icons.Support, color: 'text-blue-500' },
  { id: 'free_withdraw', label: 'Task', icon: Icons.Gift, color: 'text-orange-500 dark:text-orange-400', badge: 'Unlock' },
  { id: 'business', label: 'My Business Hub', icon: Icons.Business, color: 'text-blue-600 dark:text-blue-400' },
  { id: 'advertise', label: 'Advertise', icon: Icons.Megaphone, color: 'text-fuchsia-500' },
  { id: 'upgrade', label: 'VIP', icon: Icons.Upgrade, color: 'text-amber-500 dark:text-amber-400' },
  { id: 'ux-trade', label: 'UX-Trade', icon: Icons.Invest, color: 'text-green-glow font-bold' },
  { id: 'sync', label: 'Sync Account', icon: Icons.Sync, color: 'text-gray-500 dark:text-gray-400' },
];

interface ActionGridProps {
  onActionClick?: (id: string) => void;
  balance?: number;
}

const ActionGrid: React.FC<ActionGridProps> = ({ onActionClick, balance = 0 }) => {
  const showQuizPointer = balance <= 100000;
  return (
    <div className="space-y-4">
      {/* Top Row - Primary Actions */}
      <div className="bg-gray-900 rounded-xl p-4 shadow-sm grid grid-cols-4 gap-2 transition-colors duration-200 border border-gray-800">
        {topRowItems.map((item) => {
          const Icon = item.icon;
          const isWhiteGlowing = item.id === 'subscribe';
          const isGoldGlowing = item.id === 'bank';
          const isPinkGlowing = item.id === 'quiz_game';
          
          return (
            <div 
              key={item.id} 
              onClick={() => onActionClick?.(item.id)}
              className="flex flex-col items-center justify-center space-y-2 cursor-pointer active:opacity-70 group relative"
            >
              {item.id === 'quiz_game' && showQuizPointer && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-bounce-slow">
                  <div className="bg-fuchsia-600 text-white text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap shadow-lg border border-fuchsia-400">
                    Play & Earn
                  </div>
                  <Icons.ChevronDown className="text-fuchsia-500 -mt-1" size={16} fill="currentColor" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isWhiteGlowing 
                  ? 'bg-white animate-white-glow shadow-[0_0_15px_rgba(255,255,255,0.6)] text-black' 
                  : isGoldGlowing
                    ? 'bg-amber-400 animate-gold-glow shadow-[0_0_15px_rgba(251,191,36,0.6)] text-black'
                    : isPinkGlowing
                      ? 'bg-fuchsia-500 animate-pink-glow shadow-[0_0_15px_rgba(232,121,249,0.6)] text-white'
                      : 'bg-green-glow/10 group-hover:bg-green-glow/20 text-green-glow'
              }`}>
                <Icon size={24} fill="currentColor" className={isWhiteGlowing || isGoldGlowing ? 'text-black' : (isPinkGlowing ? 'text-white' : 'text-green-glow')} />
              </div>
              <span className="text-xs font-medium text-gray-300 text-center leading-tight">{item.label}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes white-glow {
          0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); transform: scale(1); filter: brightness(1); }
          50% { box-shadow: 0 0 35px rgba(255, 255, 255, 0.8); transform: scale(1.08); filter: brightness(1.3); }
          100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); transform: scale(1); filter: brightness(1); }
        }
        @keyframes gold-glow {
          0% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.3); transform: scale(1); filter: brightness(1); }
          50% { box-shadow: 0 0 35px rgba(251, 191, 36, 0.8); transform: scale(1.08); filter: brightness(1.3); }
          100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.3); transform: scale(1); filter: brightness(1); }
        }
        @keyframes pink-glow {
          0% { box-shadow: 0 0 5px rgba(232, 121, 249, 0.3); transform: scale(1); filter: brightness(1); }
          50% { box-shadow: 0 0 35px rgba(232, 121, 249, 0.8); transform: scale(1.08); filter: brightness(1.3); }
          100% { box-shadow: 0 0 5px rgba(232, 121, 249, 0.3); transform: scale(1); filter: brightness(1); }
        }
        .animate-white-glow {
          animation: white-glow 2s infinite ease-in-out;
        }
        .animate-gold-glow {
          animation: gold-glow 2s infinite ease-in-out;
        }
        .animate-pink-glow {
          animation: pink-glow 2s infinite ease-in-out;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-5px) translateX(-50%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>

      {/* Secondary Actions Grid */}
      <div className="bg-gray-900 rounded-xl p-4 shadow-sm grid grid-cols-4 gap-x-2 gap-y-6 transition-colors duration-200 border border-gray-800">
        {bottomGridItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id} 
              onClick={() => onActionClick?.(item.id)}
              className="flex flex-col items-center justify-start space-y-2 cursor-pointer active:opacity-70 relative"
            >
              {item.badge && (
                <div className="absolute -top-3 right-1 bg-green-glow text-black text-[8px] font-bold px-1.5 py-0.5 rounded-tr-lg rounded-bl-lg z-10 shadow-sm">
                    {item.badge}
                </div>
              )}
              <div className={`w-8 h-8 flex items-center justify-center ${item.color || 'text-green-glow'}`}>
                 {/* Using fill for solid look where appropriate, simulating the bold icons in screenshot */}
                <Icon size={28} strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-gray-300 text-center leading-tight w-full break-words px-1">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionGrid;
