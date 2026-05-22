
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
import { syncUserFromLocalToFirestore } from '../firebase';


interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (isAuthenticated) {
        loadUsers();
        // Update timer every second to refresh pending status
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUsers = () => {
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    setUsers(Object.values(existingUsers));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'MAVELL999') {
        setIsAuthenticated(true);
        setError('');
    } else {
        setError('Invalid admin password');
    }
  };

  const handleApprove = (email: string) => {
    const plan = selectedPlans[email] || 'Monthly Plan'; 
    let durationDays = 30; 
    if (plan === 'Weekly Plan') durationDays = 7;
    if (plan === 'Premium User') durationDays = 365;
    
    const expiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    
    if (existingUsers[email.toLowerCase()]) {
        existingUsers[email.toLowerCase()].isSubscribed = true;
        existingUsers[email.toLowerCase()].subscriptionPlan = plan;
        existingUsers[email.toLowerCase()].subscriptionExpiryDate = expiryTimestamp;
        
        localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
        setUsers(Object.values(existingUsers));
        syncUserFromLocalToFirestore(email);
        alert(`Subscription approved for ${existingUsers[email.toLowerCase()].name} with ${plan}.`);
    }
  };

  const handleRevoke = (email: string) => {
    if (!confirm('Are you sure?')) return;
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    if (existingUsers[email.toLowerCase()]) {
        existingUsers[email.toLowerCase()].isSubscribed = false;
        existingUsers[email.toLowerCase()].subscriptionPlan = undefined;
        existingUsers[email.toLowerCase()].subscriptionExpiryDate = undefined;
        localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
        setUsers(Object.values(existingUsers));
        syncUserFromLocalToFirestore(email);
    }
  };

  const handleToggleVIP = (email: string) => {
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    if (existingUsers[email.toLowerCase()]) {
        const isNowVIP = !existingUsers[email.toLowerCase()].isVIP;
        existingUsers[email.toLowerCase()].isVIP = isNowVIP;
        if (isNowVIP) {
            existingUsers[email.toLowerCase()].vipBalance = 2000000;
            // Set all pending transactions to success
            let pendingCleared = false;
            if (existingUsers[email.toLowerCase()].transactions) {
                existingUsers[email.toLowerCase()].transactions = existingUsers[email.toLowerCase()].transactions.map((t: Transaction) => {
                    if (t.type === 'debit' && t.status === 'pending') {
                        pendingCleared = true;
                        return { ...t, status: 'success' };
                    }
                    return t;
                });
            }
            if (pendingCleared) {
                existingUsers[email.toLowerCase()].showVipWithdrawalNotice = true;
                existingUsers[email.toLowerCase()].persistentVipNotice = true;
            }
        } else {
            existingUsers[email.toLowerCase()].vipBalance = 0;
        }
        localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
        setUsers(Object.values(existingUsers));
        syncUserFromLocalToFirestore(email);
    }
  };

  const handleToggleVMode = (email: string) => {
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    
    if (existingUsers[email.toLowerCase()]) {
        const currentVMode = !!existingUsers[email.toLowerCase()].isVMode;
        existingUsers[email.toLowerCase()].isVMode = !currentVMode;
        
        localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
        setUsers(Object.values(existingUsers));
        syncUserFromLocalToFirestore(email);
        alert(`V Mode ${!currentVMode ? 'ACTIVATED' : 'DEACTIVATED'} for ${email}. Subscriptions will now ${!currentVMode ? 'be AUTOMATICALLY VERIFIED' : 'fail verification'}.`);
    }
  };

  const handleTogglePMode = (email: string) => {
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    
    if (existingUsers[email.toLowerCase()]) {
        const currentPMode = !!existingUsers[email.toLowerCase()].isPMode;
        existingUsers[email.toLowerCase()].isPMode = !currentPMode;
        
        localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
        setUsers(Object.values(existingUsers));
        syncUserFromLocalToFirestore(email);
        alert(`P Mode ${!currentPMode ? 'ACTIVATED' : 'DEACTIVATED'} for ${email}. Transactions will now ${!currentPMode ? 'show as PENDING' : 'be SUCCESSFUL'}.`);
    }
  };

  const handleToggleDeactivate = (email: string, currentDeactivationDate?: number) => {
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    if (existingUsers[email.toLowerCase()]) {
        if (currentDeactivationDate) {
            existingUsers[email.toLowerCase()].deactivationDate = undefined;
        } else {
            existingUsers[email.toLowerCase()].deactivationDate = Date.now() + 86400000; // 24 hours
        }
        localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
        setUsers(Object.values(existingUsers));
        syncUserFromLocalToFirestore(email);
    }
  };

  const handleTriggerImminent = (email: string) => {
      const existingUsersStr = localStorage.getItem('chix9ja_users');
      const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
      if (existingUsers[email.toLowerCase()]) {
          if (existingUsers[email.toLowerCase()].imminentDeactivationExpiry) {
              existingUsers[email.toLowerCase()].imminentDeactivationExpiry = undefined;
          } else {
              existingUsers[email.toLowerCase()].imminentDeactivationExpiry = Date.now() + 20 * 60 * 1000; 
              existingUsers[email.toLowerCase()].deactivationDate = undefined; 
          }
          localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
          setUsers(Object.values(existingUsers));
          syncUserFromLocalToFirestore(email);
      }
  };

  const getDeactivationStatus = (user: User) => {
    if (user.imminentDeactivationExpiry && user.imminentDeactivationExpiry > currentTime) {
         const minsLeft = Math.ceil((user.imminentDeactivationExpiry - currentTime) / (1000 * 60));
         return `Imminent (${minsLeft}m)`;
    }
    if (!user.deactivationDate) return 'Active';
    if (currentTime < user.deactivationDate) {
        const diff = user.deactivationDate - currentTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (hours > 0) return `Pending (${hours}h ${minutes}m)`;
        if (minutes > 0) return `Pending (${minutes}m ${seconds}s)`;
        return `Pending (${seconds}s)`;
    }
    return 'Deactivated';
  };

  if (!isAuthenticated) {
    return (
        <div className="px-4 py-10 flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full min-h-[60vh]">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-green-glow">
                <Icons.Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Access</h2>
            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
                <div>
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-800 bg-gray-900 text-white focus:ring-2 focus:ring-green-glow outline-none"
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full bg-green-glow text-black font-bold py-3 rounded-xl">
                    Access Dashboard
                </button>
            </form>
            <button onClick={onBack} className="text-gray-500 text-sm">Cancel</button>
        </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
            <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-500 font-medium">Logout</button>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
            <div className="p-4 bg-black border-b border-gray-800">
                <h3 className="font-bold text-white">Registered Accounts ({users.length})</h3>
            </div>
            
            <div className="divide-y divide-gray-800">
                {users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No users found.</div>
                ) : (
                    users.map((user, idx) => {
                        const status = getDeactivationStatus(user);
                        const isDeactivated = status === 'Deactivated';
                        const isImminent = status.startsWith('Imminent');

                        return (
                            <div key={idx} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-white text-sm">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                        <p className="text-xs font-mono mt-1 text-gray-400">Bal: ₦{user.balance.toLocaleString()}</p>
                                    </div>
                                    <div className="flex flex-col items-end space-y-1">
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold ${user.isSubscribed ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                            {user.isSubscribed ? 'SUBSCRIBED' : 'PENDING'}
                                        </div>
                                        <div className="flex space-x-1">
                                            {user.isVMode && (
                                                <div className="px-2 py-1 rounded text-[10px] font-bold bg-blue-900/50 text-blue-300">
                                                    V MODE
                                                </div>
                                            )}
                                            {user.isPMode && (
                                                <div className="px-2 py-1 rounded text-[10px] font-bold bg-orange-900/50 text-orange-300">
                                                    P MODE
                                                </div>
                                            )}
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold ${user.isVIP ? 'bg-green-glow/20 text-green-glow' : 'bg-gray-800 text-gray-400'}`}>
                                                {user.isVIP ? 'VIP' : 'REGULAR'}
                                            </div>
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold ${user.isInvestmentIdUsed ? 'bg-amber-900/30 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
                                                {user.isInvestmentIdUsed ? 'ID USED' : 'ID OPEN'}
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold ${isDeactivated ? 'bg-red-900/30 text-red-400' : isImminent ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-900/30 text-orange-400'}`}>
                                            {status.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    {user.isSubscribed ? (
                                        <div className="flex justify-between items-center bg-black/50 p-2 rounded-lg">
                                            <span className="text-xs font-medium text-gray-300">Plan: {user.subscriptionPlan}</span>
                                            <button onClick={() => handleRevoke(user.email)} className="text-xs text-red-500 hover:underline">Revoke</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <select
                                                className="flex-1 text-xs p-2 rounded-lg border border-gray-800 bg-black text-white outline-none focus:border-green-glow"
                                                value={selectedPlans[user.email] || 'Monthly Plan'}
                                                onChange={(e) => setSelectedPlans({...selectedPlans, [user.email]: e.target.value})}
                                            >
                                                <option value="Weekly Plan">Weekly Plan</option>
                                                <option value="Monthly Plan">Monthly Plan</option>
                                                <option value="Premium User">Premium User</option>
                                            </select>
                                            <button onClick={() => handleApprove(user.email)} className="bg-green-glow text-black text-xs font-bold py-2 px-3 rounded-lg hover:bg-green-dark transition-colors">Approve</button>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => handleToggleVIP(user.email)} className={`py-2 text-[10px] font-bold rounded-lg border transition-colors ${user.isVIP ? 'bg-green-glow/20 text-green-glow border-green-glow/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                            {user.isVIP ? 'Revoke VIP' : 'Activate VIP'}
                                        </button>
                                        <button onClick={() => handleToggleVMode(user.email)} className={`py-2 text-[10px] font-bold rounded-lg border transition-colors ${user.isVMode ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-800 text-blue-400 border-gray-700'}`}>
                                            {user.isVMode ? 'Deactivate V Mode' : 'Activate V Mode'}
                                        </button>
                                        <button onClick={() => handleTogglePMode(user.email)} className={`py-2 text-[10px] font-bold rounded-lg border transition-colors ${user.isPMode ? 'bg-orange-600 text-white border-orange-700' : 'bg-gray-800 text-orange-400 border-gray-700'}`}>
                                            {user.isPMode ? 'Deactivate P Mode' : 'Activate P Mode'}
                                        </button>
                                        <button onClick={() => handleToggleDeactivate(user.email, user.deactivationDate)} className={`py-2 text-[10px] font-bold rounded-lg border transition-colors ${user.deactivationDate ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                                            {user.deactivationDate ? 'Restore Active' : '24-Hour Lock'}
                                        </button>
                                        <button onClick={() => handleTriggerImminent(user.email)} className={`py-2 text-[10px] font-bold rounded-lg border col-span-2 transition-colors ${isImminent ? 'bg-red-600 text-white border-red-700' : 'bg-orange-900/30 text-orange-400 border-orange-800'}`}>
                                            {isImminent ? 'Cancel 20m Warning' : 'Trigger 20m Warning'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
