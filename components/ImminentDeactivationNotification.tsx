
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface ImminentDeactivationNotificationProps {
  expiryDate: number;
}

const ImminentDeactivationNotification: React.FC<ImminentDeactivationNotificationProps> = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = expiryDate - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        return;
      }

      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  return (
    <div className="bg-black rounded-xl p-3 text-white shadow-lg mb-3 animate-pulse border-2 border-green-glow">
      <div className="flex items-center justify-between mb-1">
         <div className="flex items-center space-x-1.5">
             <Icons.AlertTriangle size={16} className="text-green-glow" />
             <span className="text-xs font-bold uppercase tracking-tight text-green-glow">Deactivation Imminent</span>
         </div>
         <div className="bg-green-glow px-2 py-0.5 rounded text-sm font-mono font-bold text-black border border-green-glow">
            {timeLeft}
         </div>
      </div>
      <p className="text-[11px] text-center font-medium leading-tight bg-green-glow/10 p-1.5 rounded border border-green-glow/20">
         To prevent closure, pay <span className="font-bold text-green-glow">₦20,000</span>. Click the <span className="font-extrabold text-black bg-green-glow px-1.5 py-0.5 rounded text-[10px]">To chix9ja</span> button.
      </p>
    </div>
  );
};

export default ImminentDeactivationNotification;
