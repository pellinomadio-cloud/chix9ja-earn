import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { NotificationPreferences } from '../types';

interface LiveNotificationsProps {
  preferences: NotificationPreferences;
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
  "access bank", "kuda bank", "gtbank", "zenith bank", "opay bank", 
  "palmpay bank", "first bank", "uba bank", "fidelity bank", "wema bank", 
  "moniepoint bank"
];

const LiveNotifications: React.FC<LiveNotificationsProps> = ({ preferences }) => {
  const [notification, setNotification] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show random notification function
    const showRandomNotification = () => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const initial = initials[Math.floor(Math.random() * initials.length)];
      const bank = banks[Math.floor(Math.random() * banks.length)];
      
      // Random realistic withdrawal amount between 15,000 and 950,000 naira
      const amountVal = Math.floor(Math.random() * (950000 - 15000 + 1) + 15000);
      const amountStr = amountVal.toLocaleString();

      // Format: "Mary . O withdraw ₦560,789 to access bank"
      const message = `${firstName} . ${initial} withdraw ₦${amountStr} to ${bank}`;
      setNotification(message);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => setIsVisible(false), 5000);
    };

    // Initial delay before first notification
    const initialTimeout = setTimeout(showRandomNotification, 3000);

    // Loop interval (every 12 seconds)
    const interval = setInterval(() => {
      showRandomNotification();
    }, 12000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [preferences]);

  if (!notification) return null;

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] w-[92%] max-w-sm transition-all duration-700 ease-in-out ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-90 pointer-events-none'}`}>
      <div className="bg-[#0b2545] border border-[#134074] text-white px-5 py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center space-x-4 relative overflow-hidden">
        {/* Crisp white check icon inside a dark blue container */}
        <div className="bg-white text-[#0b2545] p-2 rounded-full flex-shrink-0 shadow-lg animate-bounce-slow">
          <Icons.CheckCircle size={18} className="text-[#0b2545]" strokeWidth={3} />
        </div>
        
        <div className="flex-1 relative z-10">
          <p className="text-[13px] leading-snug font-bold text-white tracking-wide">
            {notification}
          </p>
        </div>

        {/* Crisp white/light-blue progress bar at the bottom */}
        {isVisible && (
          <div className="absolute bottom-0 left-0 h-[3.5px] bg-white rounded-b-2xl animate-progress-bar"></div>
        )}
      </div>
      <style>{`
        @keyframes progress-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-progress-bar {
          animation: progress-bar 5s linear forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LiveNotifications;
