import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, sanitizeForFirestore, useBankDetails, updateBankDetails } from '../firebase';
import { Search, ShieldAlert, Sparkles, Zap, Lock, Eye, AlertCircle, RefreshCw, Layers, CheckCircle2, XCircle, Bell, Settings, UserCheck, HelpCircle } from 'lucide-react';

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
  const [isSyncing, setIsSyncing] = useState(false);

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
  const [searchEmail, setSearchEmail] = useState('');

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
        setIsSyncing(true);
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
            setIsSyncing(false);
        }, (err) => {
            console.error("Error with real-time Firestore listener:", err);
            // Fallback to manual one-time load
            loadUsers();
            setIsSyncing(false);
        });

        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    setIsSyncing(true);
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
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
    } catch (err) {
        console.error("Error loading global users from Firestore:", err);
        const existingUsersStr = localStorage.getItem('chix9ja_users');
        const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
        setUsers(Object.values(existingUsers));
    } finally {
        setIsSyncing(false);
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
        setError('Access Denied: Only authorized administrators are permitted.');
        return;
    }
    if (password === 'MAVELL999') {
        setIsAuthenticated(true);
        setError('');
    } else {
        setError('Invalid administrative authorization password.');
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
    if (!confirm('Are you sure you want to revoke subscription privileges for this user?')) return;
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
        alert(`vMode ${!currentVMode ? 'ACTIVATED' : 'DEACTIVATED'} for ${email}. Subscriptions will now ${!currentVMode ? 'be AUTOMATICALLY VERIFIED' : 'fail verification'}.`);
    }
  };

  const handleTogglePMode = (email: string) => {
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (targetUser) {
        const currentPMode = !!targetUser.isPMode;
        const updatedUser = { ...targetUser, isPMode: !currentPMode };
        
        saveUserDocument(email, updatedUser);
        alert(`pMode ${!currentPMode ? 'ACTIVATED' : 'DEACTIVATED'} for ${email}. Transactions will now ${!currentPMode ? 'show as PENDING' : 'be SUCCESSFUL'}.`);
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
    if (searchEmail.trim()) {
      const query = searchEmail.trim().toLowerCase();
      const emailMatch = user.email && user.email.toLowerCase().includes(query);
      const nameMatch = user.name && user.name.toLowerCase().includes(query);
      if (!emailMatch && !nameMatch) return false;
    }
    if (filterType === 'pending_verification') return !!user.pendingActivation;
    if (filterType === 'unsubscribed') return !user.isSubscribed;
    if (filterType === 'restricted') return user.isRestricted || !!user.deactivationDate || !!user.imminentDeactivationExpiry;
    return true;
  });

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 select-none font-sans relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

            <div className="w-full max-w-sm z-10 space-y-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                        <Lock size={30} className="stroke-[1.75]" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Gate</h2>
                    <p className="text-xs text-slate-500 font-medium">chix9ja security clearance terminal</p>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/60 space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admin Email Address</label>
                                <input
                                    type="email"
                                    placeholder="pellinomadio@gmail.com"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    className="w-full text-xs p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-350"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Authorization Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full text-xs p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 flex items-center space-x-2">
                                <AlertCircle size={15} />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all text-xs uppercase tracking-widest active:scale-[0.98]"
                        >
                            De-restrict Portal Access →
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <button onClick={onBack} className="text-slate-450 hover:text-slate-700 text-xs font-semibold underline underline-offset-4 transition-colors">
                        Return home
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 font-sans select-none relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-x-0 top-0 h-48 bg-emerald-600/5 select-none pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 relative z-10">
            {/* Main Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                        <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-md font-mono">
                            SECURE SYSTEM ONLINE
                        </span>
                        {isSyncing && (
                            <span className="flex items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                <RefreshCw size={11} className="mr-1 animate-spin text-emerald-600" /> Syncing
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                        Admin <span className="text-emerald-600 font-extrabold lg:font-black">Command</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Configure network states, approve activations, and override client nodes instantly</p>
                </div>

                <div className="flex items-center space-x-2">
                    <button 
                        onClick={onBack}
                        className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 flex items-center space-x-1.5"
                    >
                        <span>Back to App</span>
                    </button>
                    <button 
                        onClick={() => setIsAuthenticated(false)} 
                        className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 shadow-rose-600/10"
                    >
                        Lock Gate
                    </button>
                </div>
            </div>

            {/* Quick Metrics Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Awaiting Acts</span>
                    <span className="text-2xl font-black text-slate-900 font-mono block mt-1">{pendingUsers.length}</span>
                    <div className="absolute right-3.5 bottom-3 text-emerald-500/15">
                        <ShieldAlert size={28} />
                    </div>
                </div>

                <div className="bg-white border border-slate-250 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Total Registers</span>
                    <span className="text-2xl font-black text-slate-900 font-mono block mt-1">{users.length}</span>
                    <div className="absolute right-3.5 bottom-3 text-emerald-500/15">
                        <UserCheck size={28} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Subscribed Clients</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono block mt-1">
                        {users.filter(u => u.isSubscribed).length}
                    </span>
                    <div className="absolute right-3.5 bottom-3 text-emerald-500/15">
                        <Sparkles size={28} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                    <span className="text-[9px] font-bold text-slate-505 uppercase block tracking-wider font-mono">Response Speed</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono flex items-center mt-1">
                        1.2ms <Zap size={14} className="ml-1 fill-emerald-500 text-emerald-500" />
                    </span>
                    <div className="absolute right-3.5 bottom-3 text-emerald-500/15">
                        <Zap size={28} />
                    </div>
                </div>
            </div>

            {/* Pending Activations / Uploaded Receipts SECTION */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
                    <h3 className="font-extrabold text-amber-800 text-sm flex items-center space-x-2">
                        <AlertCircle className="text-amber-500 animate-pulse stroke-[2.2]" size={18} />
                        <span>AWAITING MANIFEST APPROVED ({pendingUsers.length})</span>
                    </h3>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full uppercase">Receipt Verification Hub</span>
                </div>
                
                <div className="divide-y divide-slate-100">
                    {pendingUsers.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-semibold py-12 uppercase tracking-widest bg-slate-50/20">
                            ✓ No outstanding receipt validations on file
                        </div>
                    ) : (
                        pendingUsers.map((pUser, idx) => (
                            <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-50/10 hover:bg-amber-50/25 transition-all">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-extrabold text-slate-900 text-sm">{pUser.name}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white text-slate-600 border border-slate-200 font-mono select-all">
                                            {pUser.email}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 pl-2.5 border-l-2 border-emerald-500 bg-emerald-50/30 py-1.5 pr-3 rounded-r-xl">
                                        <p className="text-xs font-black text-emerald-800 uppercase tracking-tight flex items-center">
                                            <Sparkles size={11} className="mr-1 inline text-emerald-650" />
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
                                        <p className="text-[10px] font-mono text-slate-500 font-bold">
                                            Amount: <span className="text-slate-900">₦{pUser.pendingPaymentAmount?.toLocaleString()}</span> | Date: <span className="text-slate-650">{pUser.pendingPaymentDate ? new Date(pUser.pendingPaymentDate).toLocaleString() : 'N/A'}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex md:flex-col lg:flex-row gap-2 self-start md:self-center">
                                    {pUser.pendingPaymentProof && (
                                        <button 
                                            onClick={() => setActiveReceiptUser(pUser)}
                                            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold rounded-xl uppercase tracking-wider transition-all text-center flex items-center justify-center space-x-1 shadow-sm"
                                        >
                                            <Eye size={12} />
                                            <span>View Receipt</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleApproveActivation(pUser)}
                                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-colors shadow-sm shadow-emerald-600/10"
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleDeclineActivation(pUser)}
                                        className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-rose-600 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Configured system variables, messaging & banking layout bento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Send System Notification Panel */}
                <div id="admin-notify-form" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                        <Bell className="text-emerald-600 stroke-[2.2]" size={16} />
                        <h3 className="font-extrabold text-slate-900 text-sm">Send Dispatch Alerts</h3>
                    </div>
                    
                    <form onSubmit={handleSendNotification} className="p-5 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Dispatch Node Target</label>
                            <select
                                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-emerald-500 font-medium cursor-pointer transition-all focus:bg-white"
                                value={notifTarget}
                                onChange={(e) => setNotifTarget(e.target.value)}
                            >
                                <option value="all">📢 GLOBAL BROADCAST (Dispatch Alerts To All Clients)</option>
                                {users.map((u, i) => (
                                    <option key={i} value={u.email.toLowerCase().trim()}>
                                        👤 {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Alert Message Content</label>
                            <textarea
                                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-emerald-500 min-h-[96px] placeholder:text-slate-400 leading-relaxed transition-all focus:bg-white"
                                value={notifMessage}
                                onChange={(e) => setNotifMessage(e.target.value)}
                                placeholder="Write the critical notification body here..."
                                rows={3}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSendingNotif}
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-40"
                        >
                            {isSendingNotif ? 'Broadcasting Alert...' : 'Broadcast Dispatch Message'}
                        </button>
                    </form>
                </div>

                {/* Configure Bank Details Panel */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                        <Settings className="text-emerald-600 stroke-[2.2]" size={16} />
                        <h3 className="font-extrabold text-slate-900 text-sm">System Bank Gateway Config</h3>
                    </div>
                    
                    <form onSubmit={handleUpdateBankSettings} className="p-5 space-y-3.5">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Target Gateway Bank Name</label>
                            <input
                                type="text"
                                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-emerald-500 transition-all focus:bg-white"
                                value={editBankName}
                                onChange={(e) => setEditBankName(e.target.value)}
                                placeholder="Moniepoint"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Account Number</label>
                                <input
                                    type="text"
                                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-emerald-500 font-mono tracking-wider transition-all focus:bg-white"
                                    value={editAccountNum}
                                    onChange={(e) => setEditAccountNum(e.target.value)}
                                    placeholder="0435119272"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Account Name</label>
                                <input
                                    type="text"
                                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-emerald-500 uppercase font-semibold tracking-tight transition-all focus:bg-white"
                                    value={editAccountName}
                                    onChange={(e) => setEditAccountName(e.target.value)}
                                    placeholder="Marvelous Michael O"
                                    required
                                />
                            </div>
                        </div>

                        {bankSuccessMsg && (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[10px] uppercase font-bold tracking-tight rounded-xl text-center">
                                ✓ {bankSuccessMsg}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isUpdatingBank}
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-40"
                        >
                            {isUpdatingBank ? 'Saving Gateway Setup...' : 'Save Bank Configuration'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Accounts Directory database overview */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-0.5">
                            <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-tight">Accounts Database</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Overwriting balances, managing access modes, and locking accounts</p>
                        </div>
                        
                        {/* Search Email input */}
                        <div className="relative w-full sm:max-w-xs">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                                <Search size={14} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search client emails or names..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400 focus:bg-white font-medium"
                            />
                            {searchEmail && (
                                <button
                                    onClick={() => setSearchEmail('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-450 hover:text-slate-700"
                                >
                                    <Icons.X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter categories chips */}
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200/50">
                        <button
                            type="button"
                            onClick={() => setFilterType('all')}
                            className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all ${filterType === 'all' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/15' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                        >
                            All Nodes ({users.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('pending_verification')}
                            className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all ${filterType === 'pending_verification' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                        >
                            Pending
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('unsubscribed')}
                            className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all ${filterType === 'unsubscribed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                        >
                            Unsubs
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('restricted')}
                            className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all ${filterType === 'restricted' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                        >
                            Locked
                        </button>
                    </div>
                </div>
                
                <div className="divide-y divide-slate-100 bg-white">
                    {displayedUsers.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-semibold text-xs uppercase tracking-widest py-16">
                            No directory matches on record
                        </div>
                    ) : (
                        displayedUsers.map((user, idx) => {
                            const status = getDeactivationStatus(user);
                            const isDeactivated = status === 'Deactivated';
                            const isImminent = status.startsWith('Imminent');

                            return (
                                <div key={idx} className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <p className="font-extrabold text-slate-900 text-sm leading-none">{user.name}</p>
                                                <span className="text-[10px] font-mono text-slate-500 leading-none">({user.email})</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs font-mono font-bold">
                                                <span className="text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-5xs">Bal: ₦{user.balance.toLocaleString()}</span>
                                                {user.vipBalance !== undefined && user.vipBalance > 0 && (
                                                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">VIP Balance: ₦{user.vipBalance.toLocaleString()}</span>
                                                )}
                                                {user.loanBalance !== undefined && user.loanBalance > 0 && (
                                                    <span className="text-red-700 bg-rose-50 border border-rose-200/80 rounded-lg px-2 py-0.5">Loan: ₦{user.loanBalance.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-center">
                                            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${user.isSubscribed ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200' : 'bg-amber-500/10 text-amber-700 border border-amber-200'}`}>
                                                {user.isSubscribed ? 'SUBSCRIBED' : 'PENDING'}
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest ${isDeactivated ? 'bg-rose-500/10 text-rose-700 border border-rose-200' : isImminent ? 'bg-orange-500 text-white animate-pulse border border-orange-600' : 'bg-emerald-500/10 text-emerald-700 border border-emerald-200'}`}>
                                                {status.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-badges for account statuses */}
                                    <div className="flex flex-wrap gap-1.5 pl-1">
                                        {user.isVMode && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-900 text-white font-mono">
                                                AUTO APPROVAL vMODE
                                            </span>
                                        )}
                                        {user.isPMode && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-550 text-white font-mono">
                                                FORCE PENDING pMODE
                                            </span>
                                        )}
                                        {user.isVIP && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-900 text-white font-mono">
                                                VIP MEMBER NODE
                                            </span>
                                        )}
                                        {user.isInvestmentIdUsed && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-150 text-slate-700 font-mono">
                                                INVEST ID USED
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-3 pt-1">
                                        {user.isSubscribed ? (
                                            <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-150 p-3 rounded-xl">
                                                <span className="text-xs font-black text-emerald-800 uppercase">Active Option: {user.subscriptionPlan}</span>
                                                <button onClick={() => handleRevoke(user.email)} className="text-xs text-rose-600 font-extrabold hover:underline">Revoke License</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <select
                                                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                                                    value={selectedPlans[user.email] || 'Monthly Plan'}
                                                    onChange={(e) => setSelectedPlans({...selectedPlans, [user.email]: e.target.value})}
                                                >
                                                    <option value="Weekly Plan">Weekly Plan</option>
                                                    <option value="Monthly Plan">Monthly Plan</option>
                                                    <option value="Premium User">Premium User</option>
                                                </select>
                                                <button onClick={() => handleApprove(user.email)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-colors">Approve Node</button>
                                            </div>
                                        )}
                                        
                                        {/* Matrix Grid of switches & locks */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            <button 
                                                onClick={() => handleToggleVIP(user.email)} 
                                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${user.isVIP ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-white text-slate-450 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {user.isVIP ? 'Revoke VIP Privilege' : 'Grant VIP Badge'}
                                            </button>
                                            <button 
                                                onClick={() => handleToggleVMode(user.email)} 
                                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${user.isVMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-450 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {user.isVMode ? 'Deactivate vMode' : 'Activate vMode'}
                                            </button>
                                            <button 
                                                onClick={() => handleTogglePMode(user.email)} 
                                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${user.isPMode ? 'bg-teal-900 text-white border-teal-905' : 'bg-white text-slate-450 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {user.isPMode ? 'Deactivate pMode' : 'Activate pMode'}
                                            </button>
                                            <button 
                                                onClick={() => handleToggleDeactivate(user.email, user.deactivationDate)} 
                                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${user.deactivationDate ? 'bg-emerald-50 text-emerald-700 border-emerald-250 animate-pulse' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50/50'}`}
                                            >
                                                {user.deactivationDate ? 'Restore Service Node' : 'Enforce 24h Lockout'}
                                            </button>
                                            <button 
                                                onClick={() => handleTriggerImminent(user.email)} 
                                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${isImminent ? 'bg-rose-600 text-white border-rose-700 font-bold animate-ping' : 'bg-white text-slate-450 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {isImminent ? 'Cancel Warning' : 'Trigger 20m Warning'}
                                            </button>
                                            <button 
                                                onClick={() => handleQuickNotify(user.email)} 
                                                className="py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-center flex items-center justify-center space-x-1"
                                            >
                                                <span>Invite Alert Message</span>
                                            </button>
                                            
                                            <button 
                                                type="button"
                                                onClick={() => handleToggleExpandUser(user.email, user)} 
                                                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border col-span-2 sm:col-span-3 transition-colors ${expandedUserEmail === user.email ? 'bg-emerald-900 text-white border-emerald-950' : 'bg-emerald-600 text-white border-emerald-650 hover:bg-emerald-700 shadow-sm'}`}
                                            >
                                                {expandedUserEmail === user.email ? '✕ Close Advanced Terminal controls' : '⚙ Open Balances Override & Tx Injector'}
                                            </button>
                                        </div>

                                        {expandedUserEmail === user.email && (
                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5 text-left animate-in fade-in slide-in-from-top-1.5 duration-200">
                                                <div className="border-b border-slate-200 pb-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center">
                                                        <Settings size={14} className="mr-1.5 text-emerald-650" /> Advanced Control Console
                                                    </h4>
                                                    <span className="text-[10px] font-mono text-slate-500 font-bold select-all">{user.email}</span>
                                                </div>
                                                
                                                {/* Sub-section: Live Balance Controls */}
                                                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80">
                                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">1. Real-time Balance Overwrites</h5>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Node Bal (₦)</label>
                                                            <input 
                                                                type="number"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 text-slate-900 border border-slate-200 focus:border-emerald-500 outline-none"
                                                                value={editBalance}
                                                                onChange={(e) => setEditBalance(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VIP Reserves Balance (₦)</label>
                                                            <input 
                                                                type="number"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 text-slate-900 border border-slate-200 focus:border-emerald-500 outline-none"
                                                                value={editVipBalance}
                                                                onChange={(e) => setEditVipBalance(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loan Liabilities (₦)</label>
                                                            <input 
                                                                type="number"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 text-slate-900 border border-slate-200 focus:border-emerald-500 outline-none"
                                                                value={editLoanBalance}
                                                                onChange={(e) => setEditLoanBalance(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleSaveBalances(user)}
                                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-98"
                                                    >
                                                        Save Balances Overwrite
                                                    </button>
                                                </div>

                                                {/* Sub-section: Account Overrides */}
                                                <div className="space-y-2.5 bg-white p-4 rounded-xl border border-slate-200/80">
                                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">2. Account Status Configurations</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleToggleAccountLinkedVerified(user)}
                                                            className={`py-3 px-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${user.isAccountLinkedVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-slate-50 text-slate-400 border-slate-200/80 hover:bg-slate-100'}`}
                                                        >
                                                            {user.isAccountLinkedVerified ? '✓ Account Link Status: VERIFIED' : '✖ Account Link Status: UNVERIFIED'}
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleToggleRestriction(user)}
                                                            className={`py-3 px-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${user.isRestricted ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200/80 hover:bg-slate-100'}`}
                                                        >
                                                            {user.isRestricted ? '🔒 Restrictions Status: RESTRICTED/BLOCKED' : '🔓 Restrictions Status: OPEN/SECURE'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Sub-section: Transaction Injector */}
                                                <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200/80">
                                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">3. Activity / Balance Ledger Injector</h5>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Flow Mode</label>
                                                            <select 
                                                                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-205 focus:border-emerald-500 outline-none font-semibold"
                                                                value={injectTxType}
                                                                onChange={(e) => setInjectTxType(e.target.value as 'credit' | 'debit')}
                                                            >
                                                                <option value="credit">➕ Credit (+ Add Funds)</option>
                                                                <option value="debit">➖ Debit (- Deduct Liabilities)</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Verification Status</label>
                                                            <select 
                                                                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-205 focus:border-emerald-500 outline-none font-semibold"
                                                                value={injectTxStatus}
                                                                onChange={(e) => setInjectTxStatus(e.target.value as 'success' | 'pending' | 'failed')}
                                                            >
                                                                <option value="success">🟢 Approved Success Node</option>
                                                                <option value="pending">🟡 Pending Verification</option>
                                                                <option value="failed">🔴 Rejected Node Limit</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="col-span-1 space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ledger Amount (₦)</label>
                                                            <input 
                                                                type="number"
                                                                placeholder="Naira Amount"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 text-slate-900 border border-slate-200 focus:border-emerald-500 outline-none font-mono"
                                                                value={injectTxAmount}
                                                                onChange={(e) => setInjectTxAmount(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-span-1 sm:col-span-2 space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Activity Manifest / Label</label>
                                                            <input 
                                                                type="text"
                                                                placeholder="e.g. Daily Bonus Allowance, Airtime Purchase"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 text-slate-900 border border-slate-200 focus:border-emerald-500 outline-none font-semibold"
                                                                value={injectTxDesc}
                                                                onChange={(e) => setInjectTxDesc(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleInjectTransaction(user)}
                                                            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-98"
                                                        >
                                                            ⚡ Inject Activity Node
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleClearTransactions(user)}
                                                            className="py-3 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all"
                                                        >
                                                            🗑 Clear Activity Ledger
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
        </div>

        {/* Lightbox Modal overlay - white theme backdrop blurring */}
        {activeReceiptUser && (
            <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150">
                <button 
                    onClick={() => setActiveReceiptUser(null)}
                    className="absolute top-4 right-4 p-3 bg-white text-slate-800 rounded-full hover:bg-slate-100 font-extrabold shadow-md active:scale-90 border border-slate-200/50 transition-all cursor-pointer"
                >
                    <Icons.X size={20} />
                </button>
                
                <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Payment Verification Receipt</h3>
                        <p className="text-xs text-slate-500 font-bold whitespace-nowrap overflow-hidden text-ellipsis">Email: {activeReceiptUser.email}</p>
                    </div>
                    
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50 max-h-[50vh] flex items-center justify-center p-1.5 relative shadow-inner">
                        <img 
                            src={activeReceiptUser.pendingPaymentProof} 
                            alt="Uploaded client receipt" 
                            className="object-contain max-h-[48vh] w-full rounded-xl"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    
                    <div className="flex space-x-2 pt-1">
                        <button 
                            onClick={async () => { await handleApproveActivation(activeReceiptUser); setActiveReceiptUser(null); }}
                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-colors"
                        >
                            Approve Act
                        </button>
                        <button 
                            onClick={async () => { await handleDeclineActivation(activeReceiptUser); setActiveReceiptUser(null); }}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-rose-600 font-black uppercase tracking-widest text-xs rounded-xl transition-all"
                        >
                            Decline Proof
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminDashboard;
