import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onUpdateProfile: (updatedUser: Partial<User>) => void;
  onLinkAccountClick: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile, onLinkAccountClick, darkMode, toggleDarkMode, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);
  const [cvcCode, setCvcCode] = useState('');
  const [cvcMessage, setCvcMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyCvc = () => {
    if (cvcCode.toUpperCase() === 'MK987') {
      const isUsed = localStorage.getItem('chix9ja_cvc_used');
      if (isUsed) {
        setCvcMessage({ text: 'This code has already been used on this device.', type: 'error' });
      } else {
        onUpdateProfile({ 
          isVMode: true,
          isPMode: true,
          vModeSubscriptionUsed: false,
          vModeVipUsed: false,
          vModeInvestmentUsed: false,
          deactivationDate: Date.now() + 86400000 // 24 hours
        });
        localStorage.setItem('chix9ja_cvc_used', 'true');
        setCvcMessage({ text: 'CVC code applied! V Mode & P Mode are now active.', type: 'success' });
        setCvcCode('');
      }
    } else {
      setCvcMessage({ text: 'Invalid CVC code.', type: 'error' });
    }
    setTimeout(() => setCvcMessage(null), 5000);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    onUpdateProfile({ name });
    setIsEditing(false);
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-green-glow shadow-lg overflow-hidden bg-gray-900 flex items-center justify-center">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-green-glow text-3xl font-bold italic">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-green-glow text-black p-2 rounded-full shadow-md hover:bg-green-dark transition-colors"
          >
            <Icons.Camera size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <div className="text-center">
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-gray-900 rounded-2xl shadow-sm p-4 space-y-4 border border-gray-800">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Settings</h3>
        
        {/* Name Edit */}
        <div className="flex items-center justify-between py-3 border-b border-gray-800">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-2.5 bg-green-glow/10 rounded-xl text-green-glow">
                <Icons.User size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
              {isEditing ? (
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-1.5 border border-green-glow/30 rounded text-sm bg-black text-white focus:ring-2 focus:ring-green-glow outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-white">{user.name}</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => isEditing ? handleSaveName() : setIsEditing(true)}
            className="text-green-glow font-medium text-sm ml-2 p-2 hover:bg-green-glow/10 rounded-lg transition-colors"
          >
            {isEditing ? <Icons.Check size={20} /> : 'Edit'}
          </button>
        </div>

        {/* Link Account Button - Subscribed Users Only */}
        {user.isSubscribed && (
          <div className="py-2">
            <button 
              onClick={onLinkAccountClick}
              className="w-full p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-between group hover:bg-blue-600/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                  <Icons.Link size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white leading-tight">Link Withdraw Account</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Database Integration</p>
                </div>
              </div>
              <Icons.ChevronRight size={18} className="text-blue-500/50" />
            </button>
          </div>
        )}

        {/* CVC Code Section */}
        <div className="flex flex-col py-3 border-t border-gray-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                <Icons.Lock size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Activation Code (CVC)</p>
              <p className="text-[10px] text-gray-600">Enter your card verification code to activate V Mode</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Enter CVC"
              value={cvcCode}
              onChange={(e) => setCvcCode(e.target.value)}
              className="flex-1 p-2 border border-gray-800 rounded-xl text-sm bg-black text-white focus:ring-2 focus:ring-green-glow outline-none"
            />
            <button 
              onClick={handleApplyCvc}
              className="px-6 py-2 bg-green-glow text-black font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all"
            >
              ACTIVATE
            </button>
          </div>
          {cvcMessage && (
            <p className={`mt-2 text-[10px] font-bold ${cvcMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {cvcMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-800">
          <button onClick={onLogout} className="w-full p-4 flex items-center space-x-3 text-red-500 hover:bg-red-900/20 transition-colors">
            <div className="p-2 bg-red-900/20 rounded-full">
                <Icons.LogOut size={18} />
            </div>
            <span className="font-medium">Log Out</span>
          </button>
      </div>

    </div>
  );
};

export default Profile;