
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';


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
  const [activeReceiptUser, setActiveReceiptUser] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
        loadUsers();
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const globalUsers: User[] = [];
        querySnapshot.forEach((doc) => {
            globalUsers.push(doc.data() as User);
        });
        
        // Let's also sync local storage cache so it stays consistent
        const existingUsers: Record<string, User> = {};
        globalUsers.forEach(u => {
            if (u.email) {
                existingUsers[u.email.toLowerCase().trim()] = u;
            }
        });
        localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
        
        setUsers(globalUsers);
    } catch (err) {
        console.error("Error loading global users from Firestore:", err);
        const existingUsersStr = localStorage.getItem('chix9ja_users');
        const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
        setUsers(Object.values(existingUsers));
    }
  };

  const saveUserDocument = async (email: string, updatedUser: User) => {
    const emailKey = email.toLowerCase().trim();
    
    // Update local cache
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    existingUsers[emailKey] = updatedUser;
    localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
    
    // Update local state listing
    setUsers(prev => prev.map(u => u.email.toLowerCase().trim() === emailKey ? updatedUser : u));
    
    try {
        await setDoc(doc(db, 'users', emailKey), updatedUser);
    } catch (e) {
        console.error("Error updating user document in Firestore:", e);
    }
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
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
        const updatedUser = {
            ...targetUser,
            isSubscribed: true,
            subscriptionPlan: plan,
            subscriptionExpiryDate: expiryTimestamp,
            pendingActivation: null,
            pendingPaymentProof: undefined,
            pendingPaymentAmount: undefined,
            pendingPaymentDate: undefined
        };
        saveUserDocument(email, updatedUser);
        alert(`Subscription approved for ${targetUser.name} with ${plan}.`);
    }
  };

  const handleRevoke = (email: string) => {
    if (!confirm('Are you sure?')) return;
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
        const updatedUser = {
            ...targetUser,
            isSubscribed: false,
            subscriptionPlan: undefined,
            subscriptionExpiryDate: undefined
        };
        saveUserDocument(email, updatedUser);
    }
  };

  const handleToggleVIP = (email: string) => {
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
        const isNowVIP = !targetUser.isVIP;
        const updatedUser = { ...targetUser, isVIP: isNowVIP };
        
        if (isNowVIP) {
            updatedUser.vipBalance = 2000000;
            let pendingCleared = false;
            if (updatedUser.transactions) {
                updatedUser.transactions = updatedUser.transactions.map((t: Transaction) => {
                    if (t.type === 'debit' && t.status === 'pending') {
                        pendingCleared = true;
                        return { ...t, status: 'success' };
                    }
                    return t;
                });
            }
            if (pendingCleared) {
                updatedUser.showVipWithdrawalNotice = true;
                updatedUser.persistentVipNotice = true;
            }
        } else {
            updatedUser.vipBalance = 0;
        }
        
        saveUserDocument(email, updatedUser);
    }
  };

  const handleToggleVMode = (email: string) => {
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
        const currentVMode = !!targetUser.isVMode;
        const updatedUser = { ...targetUser, isVMode: !currentVMode };
        
        saveUserDocument(email, updatedUser);
        alert(`V Mode ${!currentVMode ? 'ACTIVATED' : 'DEACTIVATED'} for ${email}. Subscriptions will now ${!currentVMode ? 'be AUTOMATICALLY VERIFIED' : 'fail verification'}.`);
    }
  };

  const handleTogglePMode = (email: string) => {
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
        const currentPMode = !!targetUser.isPMode;
        const updatedUser = { ...targetUser, isPMode: !currentPMode };
        
        saveUserDocument(email, updatedUser);
        alert(`P Mode ${!currentPMode ? 'ACTIVATED' : 'DEACTIVATED'} for ${email}. Transactions will now ${!currentPMode ? 'show as PENDING' : 'be SUCCESSFUL'}.`);
    }
  };

  const handleToggleDeactivate = (email: string, currentDeactivationDate?: number) => {
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
        const updatedUser = { ...targetUser };
        if (currentDeactivationDate) {
            updatedUser.deactivationDate = undefined;
        } else {
            updatedUser.deactivationDate = Date.now() + 86400000; // 24 hours
        }
        saveUserDocument(email, updatedUser);
    }
  };

  const handleTriggerImminent = (email: string) => {
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
        const updatedUser = { ...targetUser };
        if (updatedUser.imminentDeactivationExpiry) {
            updatedUser.imminentDeactivationExpiry = undefined;
        } else {
            updatedUser.imminentDeactivationExpiry = Date.now() + 20 * 60 * 1000; 
            updatedUser.deactivationDate = undefined; 
        }
        saveUserDocument(email, updatedUser);
    }
  };

  const handleApproveActivation = async (userObj: User) => {
    const email = userObj.email.toLowerCase();
    const type = userObj.pendingActivation;
    const updatedUser = { ...userObj };
    
    if (type === 'subscription_weekly' || type === 'subscription_monthly' || type === 'subscription_yearly') {
        let durationDays = 30; 
        let planName = 'Monthly Pro';
        if (type === 'subscription_weekly') {
            durationDays = 7;
            planName = 'Weekly Saver';
        }
        if (type === 'subscription_yearly') {
            durationDays = 365;
            planName = 'Premium Elite';
        }
        
        const expiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        updatedUser.isSubscribed = true;
        updatedUser.subscriptionPlan = planName;
        updatedUser.subscriptionExpiryDate = expiryTimestamp;
    } else if (type === 'vip') {
        updatedUser.isVIP = true;
        updatedUser.vipBalance = 1000000; // 1 Million VIP Business Fund
        
        let pendingCleared = false;
        if (updatedUser.transactions) {
            updatedUser.transactions = updatedUser.transactions.map((t: Transaction) => {
                if (t.type === 'debit' && t.status === 'pending') {
                    pendingCleared = true;
                    return { ...t, status: 'success' };
                }
                return t;
            });
        }
        if (pendingCleared) {
            updatedUser.showVipWithdrawalNotice = true;
            updatedUser.persistentVipNotice = true;
        }
    } else if (type === 'link_account') {
        updatedUser.isAccountLinkedVerified = true;
    } else if (type === 'imminent_payment') {
        updatedUser.deactivationDate = undefined;
        updatedUser.imminentDeactivationExpiry = undefined;
    } else if (type === 'investment') {
        updatedUser.isRestricted = false;
        updatedUser.pendingInvestmentStep = null;
    }
    
    updatedUser.pendingActivation = null;
    updatedUser.pendingPaymentProof = undefined;
    updatedUser.pendingPaymentAmount = undefined;
    updatedUser.pendingPaymentDate = undefined;
    
    await saveUserDocument(email, updatedUser);
    alert(`Successfully approved and activated ${type} for ${updatedUser.name}!`);
  };

  const handleDeclineActivation = async (userObj: User) => {
    if (!confirm(`Are you sure you want to decline this activation for ${userObj.name}?`)) return;
    const email = userObj.email.toLowerCase();
    const updatedUser = { ...userObj };
    
    updatedUser.pendingActivation = null;
    updatedUser.pendingPaymentProof = undefined;
    updatedUser.pendingPaymentAmount = undefined;
    updatedUser.pendingPaymentDate = undefined;
    
    await saveUserDocument(email, updatedUser);
    alert(`Declined activation for ${updatedUser.name}. Proof removed.`);
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

  const pendingUsers = users.filter(u => u.pendingActivation);

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
    <div className="px-4 py-6 space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
            <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-500 font-medium p-2">Logout</button>
        </div>

        {/* Pending Activations / Uploaded Receipts */}
        <div className="bg-gray-900 rounded-xl shadow-sm border border-amber-500/30 overflow-hidden">
            <div className="p-4 bg-amber-950/20 border-b border-amber-500/20 flex items-center justify-between">
                <h3 className="font-bold text-amber-400 text-sm flex items-center space-x-2">
                    <Icons.Clock className="animate-pulse" size={16} />
                    <span>Awaiting Activation Verification ({pendingUsers.length})</span>
                </h3>
            </div>
            
            <div className="divide-y divide-gray-800">
                {pendingUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 font-bold uppercase tracking-wider">
                        No pending payment activations.
                    </div>
                ) : (
                    pendingUsers.map((pUser, idx) => (
                        <div key={idx} className="p-4 flex flex-col space-y-3 bg-amber-955/5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-extrabold text-white text-sm">{pUser.name}</h4>
                                    <p className="text-xs text-gray-400">{pUser.email}</p>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                                            Requesting: {
                                                pUser.pendingActivation === 'subscription_weekly' ? 'Weekly Subscription' :
                                                pUser.pendingActivation === 'subscription_monthly' ? 'Monthly Subscription' :
                                                pUser.pendingActivation === 'subscription_yearly' ? 'Yearly Subscription' :
                                                pUser.pendingActivation === 'vip' ? 'VIP Access Status' :
                                                pUser.pendingActivation === 'link_account' ? 'Link Withdraw Account (₦47k)' :
                                                pUser.pendingActivation === 'imminent_payment' ? 'Restore Active (₦13k)' :
                                                pUser.pendingActivation === 'investment' ? 'Investment ID Activation (₦22k)' :
                                                pUser.pendingActivation
                                            }
                                        </p>
                                        <p className="text-[10px] font-mono text-gray-500 font-semibold">
                                            Amount: ₦{pUser.pendingPaymentAmount?.toLocaleString()} | Date: {pUser.pendingPaymentDate ? new Date(pUser.pendingPaymentDate).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                
                                {pUser.pendingPaymentProof && (
                                    <button 
                                        onClick={() => setActiveReceiptUser(pUser)}
                                        className="px-3 py-1.5 bg-amber-500 text-black text-xs font-black rounded-lg uppercase tracking-wider active:scale-95 transition-all text-center"
                                    >
                                        View Proof
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex space-x-2 pt-1">
                                <button 
                                    onClick={() => handleApproveActivation(pUser)}
                                    className="flex-1 py-2 bg-green-glow text-black font-extrabold text-xs uppercase tracking-widest rounded-lg hover:bg-green-dark transition-colors"
                                >
                                    Approve Activation
                                </button>
                                <button 
                                    onClick={() => handleDeclineActivation(pUser)}
                                    className="flex-1 py-2 bg-red-900/40 text-red-400 border border-red-800/50 font-extrabold text-xs uppercase tracking-widest rounded-lg hover:bg-red-900/60 transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
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
                                        <button onClick={() => handleToggleDeactivate(user.email, user.deactivationDate)} className={`py-2 text-[10px] font-bold rounded-lg border transition-colors ${user.deactivationDate ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-300 border-red-800'}`}>
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

        {/* Lightbox Modal */}
        {activeReceiptUser && (
            <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
                <button 
                    onClick={() => setActiveReceiptUser(null)}
                    className="absolute top-4 right-4 p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 font-bold active:scale-90"
                >
                    <Icons.X size={24} />
                </button>
                
                <div className="max-w-xl w-full text-center space-y-4">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">{activeReceiptUser.name}'s Receipt</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Email: {activeReceiptUser.email}</p>
                    
                    <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-900 max-h-[70vh] flex items-center justify-center p-2">
                        <img 
                            src={activeReceiptUser.pendingPaymentProof} 
                            alt="Uploaded Payment Receipt" 
                            className="object-contain max-h-[60vh] w-full"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    
                    <div className="flex space-x-4">
                        <button 
                            onClick={async () => { await handleApproveActivation(activeReceiptUser); setActiveReceiptUser(null); }}
                            className="flex-1 py-4 bg-green-glow text-black font-black uppercase tracking-widest rounded-xl hover:bg-green-dark transition-colors"
                        >
                            Approve
                        </button>
                        <button 
                            onClick={async () => { await handleDeclineActivation(activeReceiptUser); setActiveReceiptUser(null); }}
                            className="flex-1 py-4 bg-red-650 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-750 transition-colors"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminDashboard;
