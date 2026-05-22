import React from 'react';
import { Icons } from './Icons';
import { User } from '../types';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: User | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, user }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Icons.Home },
    { id: 'loan', label: 'Loan', icon: Icons.LoanTab },
    { id: 'finance', label: 'Finance', icon: Icons.Finance },
    { id: 'reward', label: 'Reward', icon: Icons.Reward },
    { id: 'me', label: 'Me', icon: Icons.Me },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 pb-safe-area transition-colors duration-200 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isMeAndHasImage = tab.id === 'me' && user?.profileImage;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full py-1 transition-colors ${
                isActive ? 'text-green-glow' : 'text-gray-500 hover:text-green-glow'
              }`}
            >
              {isActive && tab.id === 'home' ? (
                 <div className="bg-green-glow rounded-full p-1 mb-1 shadow-md">
                    <Icon size={20} className="text-black" />
                 </div>
              ) : isMeAndHasImage ? (
                <div className={`w-7 h-7 rounded-full overflow-hidden mb-1 border-2 ${isActive ? 'border-green-glow' : 'border-transparent'}`}>
                  <img src={user!.profileImage} alt="Me" className="w-full h-full object-cover" />
                </div>
              ) : (
                <Icon size={24} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
              )}
              
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;