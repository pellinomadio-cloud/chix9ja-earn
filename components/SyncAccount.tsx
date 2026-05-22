
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User } from '../types';

interface SyncAccountProps {
  user: User;
  onRestore: (user: User) => void;
}

const SyncAccount: React.FC<SyncAccountProps> = ({ user, onRestore }) => {
  const [restoreCode, setRestoreCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  
  // Timestamp state to control code generation time
  const [codeTimestamp, setCodeTimestamp] = useState(Date.now());

  // Refresh timestamp every 5 minutes to generate new code
  useEffect(() => {
    const interval = setInterval(() => {
        setCodeTimestamp(Date.now());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Generate Sync Code: Base64 encode the payload { t: timestamp, d: user }
  const generateSyncCode = () => {
    try {
      const payload = {
        t: codeTimestamp,
        d: user
      };
      const jsonString = JSON.stringify(payload);
      return btoa(jsonString);
    } catch (e) {
      return "Error generating code";
    }
  };

  const syncCode = generateSyncCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!restoreCode.trim()) {
        setError('Please enter a sync code.');
        return;
    }

    try {
        const jsonString = atob(restoreCode.trim());
        const payload = JSON.parse(jsonString);
        
        let restoredUser: User | null = null;
        let timestamp = 0;

        // Check format
        if (payload.d && payload.t) {
            restoredUser = payload.d;
            timestamp = payload.t;
        } else if (payload.email) {
            // Handle legacy format (optional, but safer to reject based on "old one will expire")
            // For this specific request, let's treat legacy codes as expired/invalid
            setError('This sync code format is no longer supported or invalid.');
            return;
        } else {
            setError('Invalid sync code data.');
            return;
        }

        // Check Expiration (5 minutes)
        const now = Date.now();
        const expirationTime = 5 * 60 * 1000; // 5 minutes in ms

        if (now - timestamp > expirationTime) {
            setError('This sync code has expired. Please generate a new one.');
            return;
        }

        // Basic validation to check if it looks like a User object
        if (restoredUser && restoredUser.email && restoredUser.balance !== undefined) {
            onRestore(restoredUser);
            setSuccess('Account restored successfully!');
        } else {
            setError('Invalid sync code format.');
        }
    } catch (e) {
        setError('Invalid sync code. Please check and try again.');
    }
  };

  // Calculate formatted time for display
  const getExpirationTime = () => {
     const expiry = new Date(codeTimestamp + 5 * 60 * 1000);
     return expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Sync Account</h2>
        <p className="text-sm text-gray-500">Move your account to another device or backup your data.</p>
      </div>

      <div className="flex p-1 bg-gray-900 rounded-xl">
        <button 
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'export' ? 'bg-gray-800 shadow-sm text-green-glow' : 'text-gray-500'}`}
        >
            Copy My Code
        </button>
        <button 
             onClick={() => setActiveTab('import')}
             className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'import' ? 'bg-gray-800 shadow-sm text-green-glow' : 'text-gray-500'}`}
        >
            Restore Account
        </button>
      </div>

      {activeTab === 'export' ? (
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-green-glow/10 rounded-full flex items-center justify-center text-green-glow">
                    <Icons.Upload size={24} />
                </div>
                <h3 className="font-bold text-white">Your Sync Code</h3>
                <p className="text-xs text-gray-500">
                    Copy this code to restore your balance and data. 
                    <br/>
                    <span className="text-red-500 font-bold">Expires at {getExpirationTime()}</span>
                </p>
            </div>

            <div className="relative">
                <textarea 
                    readOnly 
                    value={syncCode}
                    className="w-full h-32 p-3 bg-black border border-gray-800 rounded-xl text-xs font-mono text-gray-400 resize-none focus:outline-none"
                />
                <button 
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-gray-800 rounded-lg shadow-sm hover:bg-gray-700 transition-colors text-green-glow"
                >
                    {copied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
                </button>
            </div>

            <div className="flex items-center justify-center text-[10px] text-gray-500 space-x-1 mb-2">
                <Icons.Clock size={12} />
                <span>Auto-refreshes every 5 minutes</span>
            </div>

            <button 
                onClick={handleCopy}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
                <Icons.Copy size={18} />
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
        </div>
      ) : (
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-green-glow/10 rounded-full flex items-center justify-center text-green-glow">
                    <Icons.Sync size={24} />
                </div>
                <h3 className="font-bold text-white">Restore Account</h3>
                <p className="text-xs text-gray-500">Paste your sync code here. Codes expire after 5 minutes.</p>
            </div>

            {error && (
                <div className="bg-red-900/20 text-red-400 text-xs p-3 rounded-lg text-center border border-red-800">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-900/20 text-green-400 text-xs p-3 rounded-lg text-center border border-green-800">
                    {success}
                </div>
            )}

            <form onSubmit={handleRestoreSubmit} className="space-y-4">
                <textarea 
                    value={restoreCode}
                    onChange={(e) => setRestoreCode(e.target.value)}
                    placeholder="Paste your sync code here..."
                    className="w-full h-32 p-3 bg-black border border-gray-800 rounded-xl text-xs font-mono text-white resize-none focus:ring-2 focus:ring-green-glow outline-none"
                />

                <button 
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                    <Icons.Sync size={18} />
                    <span>Restore Account</span>
                </button>
            </form>
        </div>
      )}
    </div>
  );
};

export default SyncAccount;
