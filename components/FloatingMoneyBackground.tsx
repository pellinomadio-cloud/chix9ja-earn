import React from 'react';

const floatingMoneyItems = [
  { symbol: '💵', left: '5%', delay: '0s', duration: '12s', size: 'text-2xl sm:text-3xl' },
  { symbol: '₦', left: '18%', delay: '3.5s', duration: '15s', size: 'text-3xl sm:text-4xl' },
  { symbol: '💰', left: '28%', delay: '1s', duration: '11s', size: 'text-2xl sm:text-3xl' },
  { symbol: '💸', left: '38%', delay: '4.5s', duration: '14s', size: 'text-3xl sm:text-4xl' },
  { symbol: '🪙', left: '48%', delay: '2s', duration: '10s', size: 'text-xl sm:text-2xl' },
  { symbol: '💵', left: '58%', delay: '5.5s', duration: '13s', size: 'text-3xl sm:text-4xl' },
  { symbol: '₦', left: '68%', delay: '0.5s', duration: '16s', size: 'text-4xl sm:text-5xl' },
  { symbol: '💸', left: '78%', delay: '2.8s', duration: '12s', size: 'text-2xl sm:text-3xl' },
  { symbol: '💰', left: '88%', delay: '4.2s', duration: '15s', size: 'text-3xl sm:text-4xl' },
  { symbol: '✨', left: '94%', delay: '1.5s', duration: '9s', size: 'text-xl sm:text-2xl' },
  { symbol: '💵', left: '12%', delay: '7s', duration: '13s', size: 'text-2xl sm:text-3xl' },
  { symbol: '₦', left: '82%', delay: '6.2s', duration: '14s', size: 'text-3xl sm:text-4xl' },
];

export const FloatingMoneyBackground: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {/* Keyframe animations */}
      <style>{`
        @keyframes floatMoneyUp {
          0% {
            transform: translateY(110vh) rotate(0deg) scale(0.7);
            opacity: 0;
          }
          15% {
            opacity: 0.75;
          }
          85% {
            opacity: 0.75;
          }
          100% {
            transform: translateY(-15vh) rotate(360deg) scale(1.1);
            opacity: 0;
          }
        }
        .animate-money-float {
          animation: floatMoneyUp linear infinite;
        }
      `}</style>

      {/* Floating Money Symbols */}
      {floatingMoneyItems.map((item, index) => (
        <div
          key={index}
          className={`absolute font-black select-none animate-money-float ${item.size}`}
          style={{
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
            filter: 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.45))',
          }}
        >
          {item.symbol}
        </div>
      ))}

      {/* Ambient Gold & Green Glow Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default FloatingMoneyBackground;
