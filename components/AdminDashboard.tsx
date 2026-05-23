
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, sanitizeForFirestore, useBankDetails, updateBankDetails } from '../firebase';


interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeReceiptUser, setActiveReceiptUser] = useState<User | null>(null);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | string>('all');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Expanded user editing states
  const [expandedUserEmail, setExpandedUserEmail] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editVipBalance, setEditVipBalance] = useState('');
  const [editLoanBalance, setEditLoanBalance] = useState('');

  // Transaction injector states
  const [injectTxType, setInjectTxType] = useState<'credit' | 'debit'>('credit');
  const [injectTxAmount, setInjectTxAmount] = useState('');
  const [injectTxDesc, setInjectTxDesc] = useState('');
  const [injectTxStatus, setInjectTxStatus] = useState<'success' | 'pending' | 'failed'>('success');

  // Filter accounts state
  const [filterType, setFilterType] = useState<'all' | 'pending_verification' | 'unsubscribed' | 'restricted'>('all');

  // Bank details configuration states
  const { bankDetails } = useBankDetails();
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNum, setEditAccountNum] = useState('');
  const [editAccountName, setEditAccountName] = useState('');
  const [isUpdatingBank, setIsUpdatingBank] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  useEffect(() => {
    if (bankDetails) {
      setEditBankName(bankDetails.bankName);
      setEditAccountNum(bankDetails.accountNumber);
      setEditAccountName(bankDetails.accountName);
    }
  }, [bankDetails]);

  const handleUpdateBankSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBankName.trim() || !editAccountNum.trim() || !editAccountName.trim()) {
      alert("All fields are required to update settings!");
      return;
    }
    setIsUpdatingBank(true);
    setBankSuccessMsg('');
    try {
      await updateBankDetails({
        bankName: editBankName.trim(),
        accountNumber: editAccountNum.trim(),
        accountName: editAccountName.trim()
      });
      setBankSuccessMsg('Bank account configuration updated successfully across all user portals!');
      setTimeout(() => setBankSuccessMsg(''), 5000);
    } catch (err) {
      console.error("Error updating bank details in Firestore settings:", err);
      alert("Failed to update bank configuration: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUpdatingBank(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        // Setup real-time listener for the users collection
        const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
            const globalUsers: User[] = [];
            querySnapshot.forEach((doc) => {
                globalUsers.push(doc.data() as User);
            });
            
            // Sync local storage cache so it stays consistent
            const existingUsers: Record<string, User> = {};
            globalUsers.forEach(u => {
                if (u.email) {
                    existingUsers[u.email.toLowerCase().trim()] = u;
                }
            });
            localStorage.setItem('chix9ja_users', JSON.stringify(existingUsers));
            
            setUsers(globalUsers);
        }, (err) => {
            console.error("Error with real-time Firestore listener:", err);
            // Fallback to manual one-time load
            loadUsers();
        });

        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => {
            unsubscribe();
            clearInterval(interval);
        };
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
        const sanitized = sanitizeForFirestore(updatedUser);
        await setDoc(doc(db, 'users', emailKey), sanitized);
    } catch (e) {
        console.error("Error updating user document in Firestore:", e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const lowerEmail = adminEmail.toLowerCase().trim();
    if (lowerEmail !== 'pellionamdio@gmail.com' && lowerEmail !== 'pellinomadio@gmail.com') {
        setError('Access Denied: Only pellionamdio@gmail.com is authorized to access the panel');
        return;
    }
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

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) {
        alert("Please enter a notification message.");
        return;
    }
    
    setIsSendingNotif(true);
    const newNotifItem = {
        id: Math.random().toString(36).substring(2, 9),
        message: notifMessage.trim(),
        date: new Date().toISOString(),
        read: false
    };

    try {
        if (notifTarget === 'all') {
            if (!confirm(`Are you sure you want to broadcast this message to ALL ${users.length} users?`)) {
                setIsSendingNotif(false);
                return;
            }
            
            let successCount = 0;
            for (const targetUser of users) {
                const userEmail = targetUser.email.toLowerCase().trim();
                const updatedList = [newNotifItem, ...(targetUser.adminNotifications || [])];
                const updatedUser = {
                    ...targetUser,
                    adminNotifications: updatedList
                };
                
                await saveUserDocument(userEmail, updatedUser);
                successCount++;
            }
            alert(`Broadcast notification sent successfully to all ${successCount} users!`);
        } else {
            const targetUser = users.find(u => u.email.toLowerCase().trim() === notifTarget.toLowerCase().trim());
            if (targetUser) {
                const updatedList = [newNotifItem, ...(targetUser.adminNotifications || [])];
                const updatedUser = {
                    ...targetUser,
                    adminNotifications: updatedList
                };
                await saveUserDocument(targetUser.email, updatedUser);
                alert(`Notification sent successfully to ${targetUser.name}!`);
            } else {
                alert("Target user not found.");
            }
        }
        
        setNotifMessage('');
    } catch (err) {
        console.error("Error sending notification:", err);
        alert("Failed to send notification.");
    } finally {
        setIsSendingNotif(false);
    }
  };

  const handleQuickNotify = (email: string) => {
    setNotifTarget(email.toLowerCase().trim());
    const formElement = document.getElementById('admin-notify-form');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleExpandUser = (email: string, targetUser: User) => {
    if (expandedUserEmail === email) {
        setExpandedUserEmail(null);
    } else {
        setExpandedUserEmail(email);
        setEditBalance(targetUser.balance.toString());
        setEditVipBalance((targetUser.vipBalance || 0).toString());
        setEditLoanBalance((targetUser.loanBalance || 0).toString());
        setInjectTxAmount('');
        setInjectTxDesc('');
        setInjectTxType('credit');
        setInjectTxStatus('success');
    }
  };

  const handleSaveBalances = async (userObj: User) => {
    const updatedUser = {
        ...userObj,
        balance: parseFloat(editBalance) || 0,
        vipBalance: parseFloat(editVipBalance) || 0,
        loanBalance: parseFloat(editLoanBalance) || 0,
    };
    await saveUserDocument(userObj.email, updatedUser);
    alert(`Balances successfully updated for ${userObj.name}!`);
  };

  const handleToggleRestriction = async (userObj: User) => {
    const isNowRestricted = !userObj.isRestricted;
    const updatedUser = {
        ...userObj,
        isRestricted: isNowRestricted,
        restrictionType: isNowRestricted ? 'verification' as const : undefined,
    };
    await saveUserDocument(userObj.email, updatedUser);
    alert(`User restrict status is now: ${isNowRestricted ? 'RESTRICTED / BLOCKED' : 'UNRESTRICTED / ACTIVE'}`);
  };

  const handleToggleAccountLinkedVerified = async (userObj: User) => {
    const isNowVerified = !userObj.isAccountLinkedVerified;
    const updatedUser = {
        ...userObj,
        isAccountLinkedVerified: isNowVerified
    };
    await saveUserDocument(userObj.email, updatedUser);
    alert(`Account Link Verification set to: ${isNowVerified ? 'VERIFIED' : 'UNVERIFIED'}`);
  };

  const handleInjectTransaction = async (userObj: User) => {
    if (!injectTxAmount || !injectTxDesc.trim()) {
        alert("Please specify description and amount of the transaction.");
        return;
    }
    
    const amount = parseFloat(injectTxAmount);
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const newTx: Transaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        type: injectTxType,
        amount: amount,
        description: injectTxDesc.trim(),
        date: new Date().toISOString(),
        status: injectTxStatus
    };

    const updatedUser = {
        ...userObj,
        transactions: [newTx, ...(userObj.transactions || [])]
    };

    await saveUserDocument(userObj.email, updatedUser);
    alert(`Successfully injected transaction: "${injectTxDesc.trim()}" (₦${amount.toLocaleString()})!`);
    
    setInjectTxAmount('');
    setInjectTxDesc('');
  };

  const handleClearTransactions = async (userObj: User) => {
    if (!confirm(`Are you sure you want to completely clear the transaction history for ${userObj.name}?`)) return;
    const updatedUser = {
        ...userObj,
        transactions: []
    };
    await saveUserDocument(userObj.email, updatedUser);
    alert(`Cleared transaction history for ${userObj.name}.`);
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

  const displayedUsers = users.filter(user => {
    if (filterType === 'pending_verification') return !!user.pendingActivation;
    if (filterType === 'unsubscribed') return !user.isSubscribed;
    if (filterType === 'restricted') return user.isRestricted || !!user.deactivationDate || !!user.imminentDeactivationExpiry;
    return true;
  });

  if (!isAuthenticated) {
    return (
        <div className="px-4 py-10 flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full min-h-[60vh]">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-green-glow">
                <Icons.Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Access</h2>
            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
                <div className="space-y-3">
                    <input
                        type="email"
                        placeholder="Enter Admin Email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-800 bg-gray-900 text-white focus:ring-2 focus:ring-green-glow outline-none"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-800 bg-gray-900 text-white focus:ring-2 focus:ring-green-glow outline-none"
                        required
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

        {/* Send System Notification Panel */}
        <div id="admin-notify-form" className="bg-gray-900 rounded-xl shadow-sm border border-green-glow/20 overflow-hidden">
            <div className="p-4 bg-green-glow/5 border-b border-green-glow/10 flex items-center space-x-2">
                <Icons.Notification className="text-green-glow animate-pulse" size={18} />
                <h3 className="font-bold text-white text-sm">Send System Notification</h3>
            </div>
            
            <form onSubmit={handleSendNotification} className="p-4 space-y-4">
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recipient State</label>
                    <select
                        className="w-full text-xs p-3 rounded-lg border border-gray-800 bg-black text-white outline-none focus:border-green-glow"
                        value={notifTarget}
                        onChange={(e) => setNotifTarget(e.target.value)}
                    >
                        <option value="all">📢 ALL REGISTERED USERS (Broadcast / Global Announcement)</option>
                        {users.map((u, i) => (
                            <option key={i} value={u.email.toLowerCase().trim()}>
                                👤 {u.name} ({u.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Notification Message</label>
                    <textarea
                        className="w-full text-xs p-3 rounded-lg border border-gray-800 bg-black text-white outline-none focus:border-green-glow min-h-[80px]"
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        placeholder="Enter the notification or alert message to send..."
                        rows={3}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSendingNotif}
                    className="w-full py-3 bg-green-glow text-black font-extrabold text-xs uppercase tracking-widest rounded-lg hover:bg-green-dark transition-colors disabled:opacity-50"
                >
                    {isSendingNotif ? 'Sending Notification...' : 'Send Notification Message'}
                </button>
            </form>
        </div>

        {/* Configure System Bank Details Panel */}
        <div className="bg-gray-900 rounded-xl shadow-sm border border-blue-500/20 overflow-hidden">
            <div className="p-4 bg-blue-950/20 border-b border-blue-500/10 flex items-center space-x-2">
                <Icons.Banknote className="text-blue-400 animate-pulse" size={18} />
                <h3 className="font-bold text-white text-sm">Configure System Bank Details</h3>
            </div>
            
            <form onSubmit={handleUpdateBankSettings} className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Bank Name</label>
                        <input
                            type="text"
                            className="w-full text-xs p-3 rounded-lg border border-gray-800 bg-black text-white outline-none focus:border-blue-500"
                            value={editBankName}
                            onChange={(e) => setEditBankName(e.target.value)}
                            placeholder="e.g. Moniepoint, Paga, etc."
                            required
                        />
                    </div>

                    <div className="space-y-1 col-span-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Account Number</label>
                        <input
                            type="text"
                            className="w-full text-xs p-3 rounded-lg border border-gray-800 bg-black text-white outline-none focus:border-blue-500 font-mono tracking-wider"
                            value={editAccountNum}
                            onChange={(e) => setEditAccountNum(e.target.value)}
                            placeholder="e.g. 0435119272"
                            required
                        />
                    </div>

                    <div className="space-y-1 col-span-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Account Name</label>
                        <input
                            type="text"
                            className="w-full text-xs p-3 rounded-lg border border-gray-800 bg-black text-white outline-none focus:border-blue-500 uppercase"
                            value={editAccountName}
                            onChange={(e) => setEditAccountName(e.target.value)}
                            placeholder="e.g. Marvelous Michael O"
                            required
                        />
                    </div>
                </div>

                {bankSuccessMsg && (
                    <p className="text-green-400 text-xs font-bold font-mono bg-green-950/20 p-2 rounded border border-green-800/30 text-center animate-bounce">
                        {bankSuccessMsg}
                    </p>
                )}

                <button 
                    type="submit" 
                    disabled={isUpdatingBank}
                    className="w-full py-3 bg-blue-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isUpdatingBank ? 'Saving Changes...' : 'Save Bank Details'}
                </button>
            </form>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 overflow-hidden">
            <div className="p-4 bg-black border-b border-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">Registered Accounts ({displayedUsers.length}/{users.length})</h3>
                </div>
                <div className="grid grid-cols-4 gap-1">
                    <button
                        type="button"
                        onClick={() => setFilterType('all')}
                        className={`py-1.5 px-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider text-center border transition-all ${filterType === 'all' ? 'bg-green-glow text-black border-green-glow' : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-700'}`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType('pending_verification')}
                        className={`py-1.5 px-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider text-center border transition-all ${filterType === 'pending_verification' ? 'bg-green-glow text-black border-green-glow' : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-700'}`}
                    >
                        Pending Acts
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType('unsubscribed')}
                        className={`py-1.5 px-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider text-center border transition-all ${filterType === 'unsubscribed' ? 'bg-green-glow text-black border-green-glow' : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-700'}`}
                    >
                        Unsubs
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType('restricted')}
                        className={`py-1.5 px-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider text-center border transition-all ${filterType === 'restricted' ? 'bg-green-glow text-black border-green-glow' : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-700'}`}
                    >
                        Locked
                    </button>
                </div>
            </div>
            
            <div className="divide-y divide-gray-800">
                {displayedUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs">No accounts matching filter.</div>
                ) : (
                    displayedUsers.map((user, idx) => {
                        const status = getDeactivationStatus(user);
                        const isDeactivated = status === 'Deactivated';
                        const isImminent = status.startsWith('Imminent');

                        return (
                            <div key={idx} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-white text-sm">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                        <div className="flex flex-col space-y-1 mt-1 font-mono text-[10px] text-gray-300">
                                            <span>Bal: ₦{user.balance.toLocaleString()}</span>
                                            {user.vipBalance !== undefined && user.vipBalance > 0 && (
                                                <span className="text-green-glow">VIP: ₦{user.vipBalance.toLocaleString()}</span>
                                            )}
                                            {user.loanBalance !== undefined && user.loanBalance > 0 && (
                                                <span className="text-red-400">Loan: ₦{user.loanBalance.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-1">
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold ${user.isSubscribed ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                            {user.isSubscribed ? 'SUBSCRIBED' : 'PENDING'}
                                        </div>
                                        <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                            {user.isVMode && (
                                                <div className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-900/50 text-blue-300 border border-blue-800/40">
                                                    V MODE
                                                </div>
                                            )}
                                            {user.isPMode && (
                                                <div className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-900/50 text-orange-300 border border-orange-850/40">
                                                    P MODE
                                                </div>
                                            )}
                                            <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${user.isVIP ? 'bg-green-glow/20 text-green-glow border border-green-glow/40' : 'bg-gray-800 text-gray-400'}`}>
                                                {user.isVIP ? 'VIP' : 'REGULAR'}
                                            </div>
                                            <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${user.isInvestmentIdUsed ? 'bg-amber-900/30 text-amber-400 border border-amber-800/20' : 'bg-gray-800 text-gray-400'}`}>
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
                                        <button onClick={() => handleQuickNotify(user.email)} className="py-2 text-[10px] font-bold rounded-lg border border-green-glow/20 bg-green-glow/10 text-green-glow col-span-2 hover:bg-green-glow/25 transition-all">
                                            ✉ Send Custom Notification to User
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleToggleExpandUser(user.email, user)} 
                                            className={`py-2 text-[10px] font-bold rounded-lg border col-span-2 transition-colors ${expandedUserEmail === user.email ? 'bg-amber-600 text-white border-amber-700' : 'bg-amber-950/20 text-amber-500 border-amber-900/40 hover:bg-amber-950/30'}`}
                                        >
                                            {expandedUserEmail === user.email ? '✕ Close Advanced Controls' : '💻 Open Advanced Controls & Balance Editor'}
                                        </button>
                                    </div>

                                    {expandedUserEmail === user.email && (
                                        <div className="mt-4 p-4 bg-black/60 rounded-xl border border-amber-500/20 space-y-4 text-left animate-in fade-in duration-300">
                                            <div className="border-b border-gray-800 pb-2 flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest">💻 Advanced User Controls</h4>
                                                <span className="text-[9px] font-mono text-gray-500">{user.email}</span>
                                            </div>
                                            
                                            {/* Sub-section: Live Balance Controls */}
                                            <div className="space-y-3">
                                                <h5 className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">1. Directly Override Account Balances</h5>
                                                
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Broker Balance (₦)</label>
                                                        <input 
                                                            type="number"
                                                            className="w-full text-xs p-2 rounded bg-gray-950 text-white border border-gray-850 focus:border-green-glow outline-none"
                                                            value={editBalance}
                                                            onChange={(e) => setEditBalance(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-gray-500 uppercase">VIP Funds (₦)</label>
                                                        <input 
                                                            type="number"
                                                            className="w-full text-xs p-2 rounded bg-gray-950 text-white border border-gray-855 focus:border-green-glow outline-none"
                                                            value={editVipBalance}
                                                            onChange={(e) => setEditVipBalance(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Loan Debt (₦)</label>
                                                        <input 
                                                            type="number"
                                                            className="w-full text-xs p-2 rounded bg-gray-950 text-white border border-gray-855 focus:border-green-glow outline-none"
                                                            value={editLoanBalance}
                                                            onChange={(e) => setEditLoanBalance(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <button 
                                                    type="button"
                                                    onClick={() => handleSaveBalances(user)}
                                                    className="w-full py-2 bg-green-glow/10 border border-green-glow/30 text-green-glow text-[10px] font-extrabold uppercase tracking-wide rounded-lg hover:bg-green-glow hover:text-black transition-colors"
                                                >
                                                    💾 Overwrite & Save Balances
                                                </button>
                                            </div>

                                            {/* Sub-section: Account Overrides */}
                                            <div className="space-y-2 pt-2 border-t border-gray-800/60">
                                                <h5 className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">2. Account Status & Switches</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleToggleAccountLinkedVerified(user)}
                                                        className={`py-2 px-1 text-[9px] font-bold rounded-lg border transition-all ${user.isAccountLinkedVerified ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40' : 'bg-gray-950 text-gray-400 border-gray-800'}`}
                                                    >
                                                        {user.isAccountLinkedVerified ? '✅ Linked Status: VERIFIED' : '❌ Linked Status: UNVERIFIED'}
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleToggleRestriction(user)}
                                                        className={`py-2 px-1 text-[9px] font-bold rounded-lg border transition-all ${user.isRestricted ? 'bg-red-950 text-red-400 border-red-800/50 hover:bg-red-900/60' : 'bg-gray-950 text-gray-400 border-gray-800 hover:bg-gray-900/45'}`}
                                                    >
                                                        {user.isRestricted ? '🔒 Account: RESTRICTED' : '🔓 Account: UNRESTRICTED'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sub-section: Transaction Injector */}
                                            <div className="space-y-3 pt-2 border-t border-gray-800/60 font-sans">
                                                <h5 className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest font-sans">3. Inject Custom Activity / Transaction</h5>
                                                
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Transaction Flow</label>
                                                        <select 
                                                            className="w-full text-xs p-2 rounded bg-gray-950 text-white border border-gray-800 focus:border-green-glow outline-none"
                                                            value={injectTxType}
                                                            onChange={(e) => setInjectTxType(e.target.value as 'credit' | 'debit')}
                                                        >
                                                            <option value="credit">➕ Credit (Addition)</option>
                                                            <option value="debit">➖ Debit (Deduction)</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase font-bold">Transaction Status</label>
                                                        <select 
                                                            className="w-full text-xs p-2 rounded bg-gray-950 text-white border border-gray-800 focus:border-green-glow outline-none"
                                                            value={injectTxStatus}
                                                            onChange={(e) => setInjectTxStatus(e.target.value as 'success' | 'pending' | 'failed')}
                                                        >
                                                            <option value="success">🟢 Success</option>
                                                            <option value="pending">🟡 Pending Verification</option>
                                                            <option value="failed">🔴 Failed</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="col-span-1 space-y-1">
                                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Amount (₦)</label>
                                                        <input 
                                                            type="number"
                                                            placeholder="Amount"
                                                            className="w-full text-xs p-2 rounded bg-gray-950 text-white border border-gray-800 focus:border-green-glow outline-none font-mono"
                                                            value={injectTxAmount}
                                                            onChange={(e) => setInjectTxAmount(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-1">
                                                        <label className="text-[9px] font-bold text-gray-500 uppercase">Activity / Description</label>
                                                        <input 
                                                            type="text"
                                                            placeholder="e.g. Daily Bonus, Account Verification Charge"
                                                            className="w-full text-xs p-2 rounded bg-gray-950 text-white border border-gray-800 focus:border-green-glow outline-none"
                                                            value={injectTxDesc}
                                                            onChange={(e) => setInjectTxDesc(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleInjectTransaction(user)}
                                                        className="py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
                                                    >
                                                        ⚡ Inject Transaction
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleClearTransactions(user)}
                                                        className="py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-800/50 text-red-400 hover:text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all"
                                                    >
                                                        🗑️ Clear Tx History
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
