
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface ActiveSubscriptionNotificationProps {
  planName: string;
  expiryDate: number;
}

const ActiveSubscriptionNotification: React.FC<ActiveSubscriptionNotificationProps> = ({ planName, expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
        const now = Date.now();
        const diff = expiryDate - now;
        
        if (diff <= 0) {
            setTimeLeft('Expiring...');
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            setTimeLeft(`${days} days, ${hours} hours left`);
        } else if (hours > 0) {
             setTimeLeft(`${hours} hours, ${minutes} mins left`);
        } else {
             setTimeLeft(`${minutes} minutes left`);
        }
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Every minute
    return () => clearInterval(interval);
  }, [expiryDate]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-black p-3 text-white shadow-md mb-3 animate-in slide-in-from-top-4 duration-500 border border-green-glow/20">
      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-green-glow opacity-10 blur-xl"></div>
      
      <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-glow/20 text-green-glow ring-1 ring-green-glow/30">
              <Icons.CheckCircle size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight">{planName} Active</h3>
              <p className="text-[10px] text-gray-400 leading-tight font-medium mt-0.5">
                 <span className="font-bold text-green-glow">{timeLeft}</span> until expiration
              </p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ActiveSubscriptionNotification;