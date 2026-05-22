
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const SystemNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const triggerNotification = () => {
      setIsVisible(true);
      // Hide after 4 seconds
      setTimeout(() => setIsVisible(false), 4000);
    };

    // Initial trigger
    const initialTimer = setTimeout(triggerNotification, 2000);

    // Repeat every 7 seconds
    const interval = setInterval(triggerNotification, 7000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-[92%] max-w-sm transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
      <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-start space-x-3 border border-red-400/50">
        <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
             <Icons.ShieldCheck size={18} className="text-white" strokeWidth={3} />
        </div>
        <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">chix9ja system</p>
            <p className="text-[11px] font-bold leading-relaxed">
              kindly notes that if your dashboard balance increases more than <span className="underline decoration-white/50 underline-offset-2">200,000</span> you cant subscribe to weekly anymore, so we advice you subscribe early and make your withdrawal easy for you. thank you
            </p>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white">
          <Icons.X size={16} />
        </button>
      </div>
    </div>
  );
};

export default SystemNotification;
