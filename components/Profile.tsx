import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onUpdateProfile: (updatedUser: Partial<User>) => void;
  onLinkAccountClick: () => void;
  onCardClearanceClick?: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
  vendorTelegramLink?: string;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile, onLinkAccountClick, onCardClearanceClick, darkMode, toggleDarkMode, onLogout, vendorTelegramLink }) => {
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVipMember = Boolean(user.isVIP || user.vipTier);

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
            className="sr-only" 
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

        {/* Message Verified Vendor - Subscribed Users Only */}
        {user.isSubscribed && (
          <div className="py-2 border-t border-gray-800/50 mt-1 pt-3 animate-in fade-in slide-in-from-bottom-2 duration-350">
            <button 
              onClick={() => {
                if (vendorTelegramLink) {
                  window.open(vendorTelegramLink, "_blank");
                } else {
                  window.open("https://t.me/chix9ja_vendor", "_blank");
                }
              }}
              className="w-full p-4 bg-green-glow/10 border border-green-glow/20 rounded-2xl flex items-center justify-between group hover:bg-green-glow/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-glow/20 rounded-xl text-green-glow group-hover:scale-110 transition-transform">
                  <Icons.Send size={20} className="stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white leading-tight">Message Verified Vendor</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Instant Verified Node</p>
                </div>
              </div>
              <Icons.ChevronRight size={18} className="text-green-glow/55" />
            </button>
          </div>
        )}

        {/* VIP Bank Payment Card Clearance Button */}
        {isVipMember && (
          <div className="py-2 border-t border-gray-800/50 mt-1 pt-3 animate-in fade-in duration-300">
            <button 
              onClick={onCardClearanceClick}
              className="w-full p-4 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 border border-amber-500/40 rounded-2xl flex items-center justify-between group hover:border-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-950/20"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl text-black font-extrabold group-hover:scale-110 transition-transform shadow-md">
                  <Icons.Card size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-amber-300 leading-tight">
                    {user.cardClearance ? 'Update Bank Payment Card Clearance' : 'Add Bank Payment Card for Clearance'}
                  </p>
                  <p className="text-[10px] text-amber-500/90 font-bold uppercase tracking-wider">
                    {user.cardClearance ? '✓ Clearance Details Submitted' : 'Required for VIP Cashout'}
                  </p>
                </div>
              </div>
              <Icons.ChevronRight size={18} className="text-amber-400" />
            </button>
          </div>
        )}
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