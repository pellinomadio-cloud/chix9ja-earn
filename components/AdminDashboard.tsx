import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
import { collection, getDocs, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, sanitizeForFirestore, useBankDetails, updateBankDetails, useGiveawayStatus, updateGiveawayStatus } from '../firebase';
import { Search, ShieldAlert, Sparkles, Zap, Lock, Eye, AlertCircle, RefreshCw, CheckCircle2, XCircle, Bell, Settings, UserCheck, HelpCircle } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

interface GiveawayReq {
  id: string;
  email: string;
  name: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  date: string;
  status: 'pending' | 'approved' | 'declined';
  bonusCredited?: number;
}

const GiveawayClaimRow: React.FC<{
  req: GiveawayReq;
  onResolve: (email: string, status: 'approved' | 'declined', amount: number) => void;
  onDelete: (email: string) => void;
}> = ({ req, onResolve, onDelete }) => {
  const [bonus, setBonus] = useState('5000');
  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/20 hover:bg-zinc-950/40 transition-all border-b border-zinc-900/60">
        <div className="space-y-1.5 flex-grow text-left">
            <div className="flex items-center space-x-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">{req.name}</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700">
                    {req.email}
                </span>
            </div>
            <div className="p-3 bg-black/60 rounded-xl space-y-1 font-mono text-[11px] border border-zinc-900/60 max-w-xl">
                <p className="text-zinc-400"><span className="text-zinc-600 font-bold uppercase tracking-wider">Bank Name:</span> {req.bankName}</p>
                <p className="text-zinc-400"><span className="text-zinc-600 font-bold uppercase tracking-wider">Account No:</span> <span className="text-amber-500 font-extrabold">{req.accountNumber}</span></p>
                <p className="text-zinc-300 font-semibold"><span className="text-zinc-650 font-bold uppercase tracking-wider">Account Holder:</span> {req.accountName}</p>
                <p className="text-[10px] text-zinc-700 tracking-tight mt-1">Submitted: {new Date(req.date || 0).toLocaleDateString()} {new Date(req.date || 0).toLocaleTimeString()}</p>
                <p className="text-[10px] uppercase font-bold mt-1">Status: {
                    req.status === 'pending' ? <span className="text-amber-500 font-black">PENDING APPROVAL</span> :
                    req.status === 'approved' ? <span className="text-emerald-500 font-black">APPROVED (₦{req.bonusCredited?.toLocaleString() || '0'})</span> :
                    <span className="text-red-500 font-black">DECLINED</span>
                }</p>
            </div>
        </div>
        
        {req.status === 'pending' && (
            <div className="flex flex-row items-center space-x-2 shrink-0">
                <div className="flex items-center bg-black rounded-lg border border-zinc-800 pr-2">
                    <span className="text-[10px] text-zinc-500 font-mono font-bold px-2">₦</span>
                    <input
                        type="text"
                        value={bonus}
                        onChange={(e) => setBonus(e.target.value.replace(/\D/g, ''))}
                        className="w-16 bg-transparent text-[11px] py-1 text-amber-500 outline-none font-mono font-bold text-center"
                        placeholder="5000"
                    />
                </div>
                <button
                    onClick={() => onResolve(req.email, 'approved', Number(bonus || 0))}
                    className="px-3 py-1.5 bg-green-glow text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-sm active:scale-95 transition-transform"
                >
                    Approve
                </button>
                <button
                    onClick={() => onResolve(req.email, 'declined', 0)}
                    className="px-3 py-1.5 bg-zinc-800 text-red-500 font-extrabold text-[10px] uppercase tracking-wider rounded-lg active:scale-95 transition-transform"
                >
                    Decline
                </button>
            </div>
        )}

        {req.status !== 'pending' && (
            <button
                onClick={() => onDelete(req.email)}
                className="px-3 py-1 bg-zinc-805 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:bg-zinc-850 hover:text-white rounded-lg text-[9px] uppercase font-bold tracking-widest font-mono shrink-0"
            >
                Delete
            </button>
        )}
    </div>
  );
};

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

  // Giveaway state variables
  const { unlocked: giveawayUnlocked } = useGiveawayStatus();
  const [giveawayRequests, setGiveawayRequests] = useState<any[]>([]);
  const [isUpdatingGiveaway, setIsUpdatingGiveaway] = useState(false);

  // Expanded user editing states
  const [expandedUserEmail, setExpandedUserEmail] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editVipBalance, setEditVipBalance] = useState('');
  const [editLoanBalance, setEditLoanBalance] = useState('');
  const [editCustomWeeklyLimit, setEditCustomWeeklyLimit] = useState('');
  const [editCustomMonthlyLimit, setEditCustomMonthlyLimit] = useState('');

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
      setBankSuccessMsg('Bank account configuration updated successfully! Saved to cloud.');
      setTimeout(() => setBankSuccessMsg(''), 5000);
    } catch (err) {
      console.error("Error updating bank details in Firestore settings:", err);
      alert("Failed to update bank configuration: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUpdatingBank(false);
    }
  };

  const handleToggleGiveaway = async () => {
    setIsUpdatingGiveaway(true);
    try {
      await updateGiveawayStatus(!giveawayUnlocked);
    } catch (err) {
      console.error(err);
      alert("Failed to toggle giveaway status.");
    } finally {
      setIsUpdatingGiveaway(false);
    }
  };

  const handleResolveGiveaway = async (email: string, status: 'approved' | 'declined', bonusAmount = 0) => {
    try {
      const emailKey = email.toLowerCase().trim();
      const docRef = doc(db, 'giveaways', emailKey);
      
      if (status === 'approved' && bonusAmount > 0) {
        // Load target user from Firestore users
        const targetUserRef = doc(db, 'users', emailKey);
        
        // Find existing users list inside local state or pull dynamically
        const foundUser = users.find(u => u.email?.toLowerCase().trim() === emailKey);

        if (foundUser) {
          const newTx: Transaction = {
            id: 'tx_giveaway_' + Math.random().toString(36).substring(2, 9),
            type: 'credit',
            amount: bonusAmount,
            description: 'Approved Promo Giveaway Grant',
            date: new Date().toISOString(),
            status: 'success'
          };
          
          const updatedUser: User = {
            ...foundUser,
            balance: (foundUser.balance || 0) + bonusAmount,
            transactions: [newTx, ...(foundUser.transactions || [])]
          };
          
          await setDoc(targetUserRef, sanitizeForFirestore(updatedUser));
        }
      }

      // Update giveaway document status
      await setDoc(docRef, {
        status: status,
        resolvedAt: new Date().toISOString(),
        bonusCredited: bonusAmount
      }, { merge: true });

      alert(`Giveaway request ${status} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to resolve giveaway request: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteGiveawayRequest = async (email: string) => {
    if (!window.confirm("Are you sure you want to delete this giveaway request?")) return;
    try {
      await deleteDoc(doc(db, 'giveaways', email.toLowerCase().trim()));
      alert("Giveaway request wiped!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete request.");
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

        // Real-time giveaway claims fetch
        const unsubGiveaway = onSnapshot(collection(db, 'giveaways'), (querySnapshot) => {
            const list: any[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            // Sort by date descending
            list.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            setGiveawayRequests(list);
        });

        return () => {
            unsubscribe();
            unsubGiveaway();
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
        let bonusAmount = 0;
        let bonusDescription = "";
        
        const isWeekly = plan.toLowerCase().includes('weekly') || plan.toLowerCase().includes('saver');
        const isMonthly = plan.toLowerCase().includes('monthly') || plan.toLowerCase().includes('pro');
        
        if (isWeekly) {
            bonusAmount = 120000;
            bonusDescription = "Weekly Subscription Balance Bonus";
        } else if (isMonthly) {
            bonusAmount = 200000;
            bonusDescription = "Monthly Subscription Balance Bonus";
        }
        
        let newBalance = targetUser.balance || 0;
        let updatedTransactions = targetUser.transactions ? [...targetUser.transactions] : [];
        
        if (bonusAmount > 0) {
            newBalance += bonusAmount;
            const newTx: Transaction = {
                id: 'tx_sub_bonus_' + Math.random().toString(36).substring(2, 9),
                type: 'credit',
                amount: bonusAmount,
                description: bonusDescription,
                date: new Date().toISOString(),
                status: 'success'
            };
            updatedTransactions = [newTx, ...updatedTransactions];
        }

        const updatedUser = {
            ...targetUser,
            isSubscribed: true,
            subscriptionPlan: plan,
            subscriptionExpiryDate: expiryTimestamp,
            balance: newBalance,
            transactions: updatedTransactions,
            pendingActivation: null,
            pendingPaymentProof: undefined,
            pendingPaymentAmount: undefined,
            pendingPaymentDate: undefined
        };
        saveUserDocument(email, updatedUser);
        let alertMsg = `Subscription approved for ${targetUser.name} with ${plan}.`;
        if (bonusAmount > 0) {
            alertMsg += ` Bonus of ₦${bonusAmount.toLocaleString()} added to their dashboard!`;
        }
        alert(alertMsg);
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
                // updatedUser.showVipWithdrawalNotice = true;
                // updatedUser.persistentVipNotice = true;
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
    
    if (type === 'subscription_weekly' || type === 'subscription_monthly' || type === 'subscription_yearly' || type === 'subscription_promo') {
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
        if (type === 'subscription_promo') {
            durationDays = 1;
            planName = 'Promo Subscription';
        }
        
        const expiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        updatedUser.isSubscribed = true;
        updatedUser.subscriptionPlan = planName;
        updatedUser.subscriptionExpiryDate = expiryTimestamp;

        let bonusAmount = 0;
        let bonusDescription = "";
        
        if (type === 'subscription_weekly' || planName.toLowerCase().includes('weekly')) {
            bonusAmount = 120000;
            bonusDescription = "Weekly Subscription Welcome Bonus";
        } else if (type === 'subscription_monthly' || planName.toLowerCase().includes('monthly')) {
            bonusAmount = 200000;
            bonusDescription = "Monthly Subscription Welcome Bonus";
        }
        
        if (bonusAmount > 0) {
            updatedUser.balance = (updatedUser.balance || 0) + bonusAmount;
            const newTx: Transaction = {
                id: 'tx_sub_bonus_' + Math.random().toString(36).substring(2, 9),
                type: 'credit',
                amount: bonusAmount,
                description: bonusDescription,
                date: new Date().toISOString(),
                status: 'success'
            };
            updatedUser.transactions = [newTx, ...(updatedUser.transactions || [])];
        }
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
            // updatedUser.showVipWithdrawalNotice = true;
            // updatedUser.persistentVipNotice = true;
        }
    } else if (type === 'link_account') {
        updatedUser.isAccountLinkedVerified = true;
        updatedUser.showVipWithdrawalNotice = true;
        updatedUser.persistentVipNotice = true;
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
        setEditCustomWeeklyLimit((targetUser.customWeeklyLimit ?? 500000).toString());
        setEditCustomMonthlyLimit((targetUser.customMonthlyLimit ?? 2000000).toString());
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
        customWeeklyLimit: parseFloat(editCustomWeeklyLimit) || 500000,
        customMonthlyLimit: parseFloat(editCustomMonthlyLimit) || 2000000,
    };
    await saveUserDocument(userObj.email, updatedUser);
    alert(`Account override details (including withdrawal limits) successfully updated for ${userObj.name}!`);
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

  // Performance optimizations using useMemo to avoid laggy filtering and search re-renders
  const pendingUsers = useMemo(() => {
    return users.filter(u => u.pendingActivation);
  }, [users]);

  const displayedUsers = useMemo(() => {
    return users.filter(user => {
      if (searchEmail.trim()) {
        const query = searchEmail.trim().toLowerCase();
        const emailMatch = user.email && user.email.toLowerCase().includes(query);
        const nameMatch = user.name && user.name.toLowerCase().includes(query);
        if (!emailMatch && !nameMatch) return false;
      } else {
        // If search query is empty, do not show any users under 'all' view
        if (filterType === 'all') return false;
      }
      if (filterType === 'pending_verification') return !!user.pendingActivation;
      if (filterType === 'unsubscribed') return !user.isSubscribed;
      if (filterType === 'restricted') return user.isRestricted || !!user.deactivationDate || !!user.imminentDeactivationExpiry;
      return true;
    });
  }, [users, searchEmail, filterType]);

  const stats = useMemo(() => {
    return {
      subscribersCount: users.filter(u => u.isSubscribed).length,
      restrictedCount: users.filter(u => u.isRestricted || u.deactivationDate || u.imminentDeactivationExpiry).length
    };
  }, [users]);

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 select-none font-sans relative overflow-hidden text-white">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-10" />

            <div className="w-full max-w-sm z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="w-16 h-16 bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/30">
                        <Lock size={26} className="stroke-[2]" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">Admin <span className="text-emerald-450 text-emerald-400 font-extrabold font-mono">Gate</span></h2>
                        <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase mt-1">chix9ja administrative terminal</p>
                    </div>
                </div>

                <div className="bg-zinc-900/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-zinc-800 space-y-5">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">Admin Email Address</label>
                                <input
                                    type="email"
                                    placeholder="pellinomadio@gmail.com"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    className="w-full text-xs p-3.5 rounded-xl border border-zinc-800 bg-black text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-zinc-650"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">Authorization Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full text-xs p-3.5 rounded-xl border border-zinc-800 bg-black text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-950/40 text-red-400 text-xs rounded-xl border border-red-500/20 flex items-center space-x-2 animate-pulse">
                                <AlertCircle size={14} />
                                <span className="font-medium font-mono text-[10px]">{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all text-xs uppercase tracking-widest active:scale-[0.97]"
                        >
                            Authorize Access →
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <button onClick={onBack} className="text-zinc-500 hover:text-emerald-450 text-[10px] font-mono uppercase tracking-widest transition-colors font-bold underline underline-offset-4">
                        ← Main Portal
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 pb-24 font-sans select-none relative overflow-wrap-normal overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 relative z-10 animate-in fade-in duration-200">
            {/* Top Command Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-mono font-black uppercase text-emerald-400 tracking-widest block bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            Clearance: Level Alpha
                        </span>
                        {isSyncing && (
                            <span className="flex items-center text-[9px] text-zinc-400 font-mono tracking-wider font-bold">
                                <RefreshCw size={10} className="mr-1 animate-spin text-emerald-400" /> SYNCING
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-wider uppercase font-mono">
                        Admin <span className="text-emerald-400">Command</span>
                    </h2>
                    <p className="text-xs text-zinc-400">Configure global database states, approve activations, and override client accounts fast.</p>
                </div>

                <div className="flex items-center space-x-2.5">
                    <button 
                        onClick={onBack}
                        className="py-2 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-[0.97] flex items-center space-x-1.5"
                    >
                        <span>← Back Home</span>
                    </button>
                    <button 
                        onClick={() => setIsAuthenticated(false)} 
                        className="py-2 px-3.5 bg-rose-950/60 hover:bg-rose-900 hover:text-white text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-[0.97]"
                    >
                        Lock Portal
                    </button>
                </div>
            </div>

            {/* Faster Diagnostics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-[0_0_15px_-3px_rgba(16,185,129,0.02)] relative overflow-hidden hover:border-zinc-700 transition-all">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">Pending Receipts</span>
                    <span className="text-2xl font-black text-white font-mono block mt-1">{pendingUsers.length}</span>
                    <div className="absolute right-3.5 bottom-3 text-emerald-500/5">
                        <ShieldAlert size={28} />
                    </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden hover:border-zinc-700 transition-all">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block font-mono font-bold">Total Directory</span>
                    <span className="text-2xl font-black text-white font-mono block mt-1">{users.length}</span>
                    <div className="absolute right-3.5 bottom-3 text-emerald-500/5">
                        <UserCheck size={28} />
                    </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden hover:border-zinc-700 transition-all">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">Premium Users</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">
                        {stats.subscribersCount}
                    </span>
                    <div className="absolute right-3.5 bottom-3 text-emerald-500/5">
                        <Sparkles size={28} />
                    </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 shadow-sm relative overflow-hidden hover:border-emerald-500/40 transition-all">
                    <span className="text-[9px] font-black text-emerald-450 text-emerald-400 uppercase tracking-widest block font-mono">Instant Speed</span>
                    <span className="text-2xl font-black text-emerald-450 text-emerald-400 font-mono flex items-center mt-1">
                        0.8ms <Zap size={14} className="ml-1 fill-emerald-400 text-emerald-450 stroke-[2.5]" />
                    </span>
                    <div className="absolute right-3.5 bottom-3 text-emerald-500/10">
                        <Zap size={28} />
                    </div>
                </div>
            </div>

            {/* Core Notification & Bank Details Form Hub */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Send Dispatch Message alerts fast */}
                <div id="admin-notify-form" className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-lg border border-zinc-800 overflow-hidden">
                    <div className="p-4 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center space-x-2">
                        <Bell className="text-emerald-400 stroke-[2.2]" size={15} />
                        <h3 className="font-black text-white text-xs uppercase tracking-wider font-mono">Dispatch Alert Alert-Feeds</h3>
                    </div>
                    
                    <form onSubmit={handleSendNotification} className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-mono font-bold text-zinc-455 text-zinc-400 uppercase tracking-widest block">Dispatch Target Node</label>
                            <select
                                className="w-full text-xs p-3 rounded-xl border border-zinc-800 bg-black text-white outline-none focus:border-emerald-500 font-semibold cursor-pointer transition-all"
                                value={notifTarget}
                                onChange={(e) => setNotifTarget(e.target.value)}
                            >
                                <option value="all">📢 GLOBAL BROADCAST (All Clients)</option>
                                {users.map((u, i) => (
                                    <option key={i} value={u.email.toLowerCase().trim()}>
                                        👤 {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Alert Message Body</label>
                            <textarea
                                className="w-full text-xs p-3 rounded-xl border border-zinc-800 bg-black text-white outline-none focus:border-emerald-500 min-h-[96px] placeholder:text-zinc-600 leading-relaxed transition-all focus:bg-pink-950/10 font-medium"
                                value={notifMessage}
                                onChange={(e) => setNotifMessage(e.target.value)}
                                placeholder="Enter system alert detail..."
                                rows={3}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSendingNotif}
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-40 active:scale-[0.98]"
                        >
                            {isSendingNotif ? 'Dispatching...' : 'Dispatch Alert Notice'}
                        </button>
                    </form>
                </div>

                {/* Secure Gateway Config Panel */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-lg border border-zinc-800 overflow-hidden">
                    <div className="p-4 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center space-x-2">
                        <Settings className="text-emerald-400 stroke-[2.2]" size={15} />
                        <h3 className="font-black text-white text-xs uppercase tracking-wider font-mono">System Bank Gateway Settings</h3>
                    </div>
                    
                    <form onSubmit={handleUpdateBankSettings} className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Target Gateway Bank Name</label>
                            <input
                                type="text"
                                className="w-full text-xs p-3 rounded-xl border border-zinc-800 bg-black text-white outline-none focus:border-emerald-500 transition-all font-medium"
                                value={editBankName}
                                onChange={(e) => setEditBankName(e.target.value)}
                                placeholder="Moniepoint"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Account Number</label>
                                <input
                                    type="text"
                                    className="w-full text-xs p-3 rounded-xl border border-zinc-800 bg-black text-white outline-none focus:border-emerald-500 font-mono tracking-wider transition-all font-bold"
                                    value={editAccountNum}
                                    onChange={(e) => setEditAccountNum(e.target.value)}
                                    placeholder="0435119272"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Account Name</label>
                                <input
                                    type="text"
                                    className="w-full text-xs p-3 rounded-xl border border-zinc-800 bg-black text-white outline-none focus:border-emerald-500 uppercase font-black tracking-tight transition-all"
                                    value={editAccountName}
                                    onChange={(e) => setEditAccountName(e.target.value)}
                                    placeholder="Marvelous Michael"
                                    required
                                />
                            </div>
                        </div>

                        {bankSuccessMsg && (
                            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-tight rounded-xl text-center font-mono">
                                ✓ {bankSuccessMsg}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isUpdatingBank}
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-40 active:scale-[0.98]"
                        >
                            {isUpdatingBank ? 'Saving...' : 'Save Bank Gateway Setup'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Giveaway Desk Controls Panel */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-lg border border-zinc-800 overflow-hidden">
                <div className="p-4 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center space-x-2">
                    <Lock className="text-amber-500 stroke-[2.2]" size={15} />
                    <h3 className="font-black text-white text-xs uppercase tracking-wider font-mono">Giveaway Desk Controls</h3>
                </div>
                
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/40">
                    <div className="text-left">
                        <p className="text-[11px] font-bold text-white uppercase tracking-tight">Access Control Status</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                            Current Terminal: {giveawayUnlocked ? (
                                <span className="text-emerald-500 font-extrabold tracking-widest bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">ACTIVE / UNLOCKED</span>
                            ) : (
                                <span className="text-red-500 font-extrabold tracking-widest bg-red-950/60 border border-red-500/20 px-2.5 py-0.5 rounded-full">INACTIVE / LOCKED</span>
                            )}
                        </p>
                    </div>
                    
                    <button
                        onClick={handleToggleGiveaway}
                        disabled={isUpdatingGiveaway}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            giveawayUnlocked
                                ? 'bg-red-650 bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/10'
                                : 'bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/10'
                        }`}
                    >
                        {isUpdatingGiveaway ? 'Updating State...' : giveawayUnlocked ? 'LOCK GIVEAWAY TERM' : 'UNLOCK GIVEAWAY TERM'}
                    </button>
                </div>
            </div>

            {/* Giveaway Requests Queue */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-sm border border-zinc-800 overflow-hidden">
                <div className="p-5 bg-amber-950/20 border-b border-amber-500/15 flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-sm flex items-center space-x-2 font-mono">
                        <Icons.Gift className="text-amber-450 text-amber-550 text-amber-400 animate-pulse" size={16} />
                        <span className="tracking-wide">GIVEAWAY CLAIMS DECK ({giveawayRequests.length})</span>
                    </h3>
                </div>
                
                <div className="divide-y divide-zinc-800/80">
                    {giveawayRequests.length === 0 ? (
                        <div className="p-10 text-center text-zinc-500 text-xs font-mono font-bold py-12 uppercase tracking-wider bg-zinc-900/20">
                            ✓ No active giveaway claim items loaded on system
                        </div>
                    ) : (
                        giveawayRequests.map((req, idx) => (
                          <GiveawayClaimRow 
                            key={req.id || idx}
                            req={req}
                            onResolve={handleResolveGiveaway}
                            onDelete={handleDeleteGiveawayRequest}
                          />
                        ))
                    )}
                </div>
            </div>

            {/* Pending Receipt Approvals Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-sm border border-zinc-800 overflow-hidden">
                <div className="p-5 bg-emerald-950/20 border-b border-emerald-500/15 flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-sm flex items-center space-x-2 font-mono">
                        <AlertCircle className="text-emerald-400 animate-pulse stroke-[2.2]" size={16} />
                        <span className="tracking-wide">PENDING VERIFICATION CUES ({pendingUsers.length})</span>
                    </h3>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Validation Board
                    </span>
                </div>
                
                <div className="divide-y divide-zinc-800/80">
                    {pendingUsers.length === 0 ? (
                        <div className="p-10 text-center text-zinc-550 text-zinc-550 text-zinc-550 text-zinc-500 text-xs font-mono font-bold py-12 uppercase tracking-wider bg-zinc-900/20">
                            ✓ No outstanding receipt validations queue on file
                        </div>
                    ) : (
                        pendingUsers.map((pUser, idx) => (
                            <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-bold text-white text-sm">{pUser.name}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700">
                                            {pUser.email}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 pl-2.5 border-l-2 border-emerald-500 bg-emerald-950/20 py-1.5 pr-3 rounded-r-xl">
                                        <p className="text-xs font-bold text-emerald-350 text-emerald-400 uppercase tracking-tight flex items-center font-mono">
                                            <Sparkles size={11} className="mr-1 text-emerald-450" />
                                            Request Type: {
                                                pUser.pendingActivation === 'subscription_weekly' ? 'Weekly Saver Subscription' :
                                                pUser.pendingActivation === 'subscription_monthly' ? 'Monthly Pro Subscription' :
                                                pUser.pendingActivation === 'subscription_yearly' ? 'Yearly Premium Subscription' :
                                                pUser.pendingActivation === 'subscription_promo' ? 'Promo Subscription (₦7,000)' :
                                                pUser.pendingActivation === 'vip' ? 'VIP Access Privilege' :
                                                pUser.pendingActivation === 'link_account' ? 'Link Account Fee Validation' :
                                                pUser.pendingActivation === 'imminent_payment' ? 'Restore Lockout Fee' :
                                                pUser.pendingActivation === 'investment' ? 'Active Investment Activation ID' :
                                                pUser.pendingActivation
                                            }
                                        </p>
                                        <p className="text-[10px] font-mono text-zinc-400 font-bold">
                                            Naira: <span className="text-white">₦{pUser.pendingPaymentAmount?.toLocaleString()}</span> | Transmitted: <span className="text-zinc-350">{pUser.pendingPaymentDate ? new Date(pUser.pendingPaymentDate).toLocaleString() : 'N/A'}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex sm:flex-row gap-2 self-start md:self-center">
                                    {pUser.pendingPaymentProof && (
                                        <button 
                                            onClick={() => setActiveReceiptUser(pUser)}
                                            className="px-3.5 py-2 hover:bg-zinc-800 text-white border border-zinc-800 text-[10px] font-mono font-bold rounded-xl uppercase tracking-wider transition-all flex items-center justify-center space-x-1"
                                        >
                                            <Eye size={12} />
                                            <span>Scan Receipt</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleApproveActivation(pUser)}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleDeclineActivation(pUser)}
                                        className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 hover:text-rose-450 text-rose-500 border border-rose-500/20 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Complete Users Database & Controls */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-sm border border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-zinc-800/85 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-0.5">
                            <h3 className="font-extrabold text-white text-base uppercase tracking-tight font-mono">Operations Index</h3>
                            <p className="text-[10px] text-zinc-400 font-medium font-mono">Overwrites, restrictions statuses, and accounts state controllers</p>
                        </div>
                        
                        {/* Search Email Input */}
                        <div className="relative w-full sm:max-w-xs">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                                <Search size={13} />
                            </span>
                            <input
                                type="text"
                                placeholder="Filter clients, names, or mails..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-zinc-800 bg-black text-white outline-none focus:border-emerald-500 transition-all placeholder:text-zinc-600 font-medium"
                            />
                            {searchEmail && (
                                <button
                                    onClick={() => setSearchEmail('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-white"
                                >
                                    <Icons.X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter category bar */}
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-black rounded-2xl border border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setFilterType('all')}
                            className={`py-2 px-1 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider text-center transition-all ${filterType === 'all' ? 'bg-emerald-600 text-black font-extrabold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
                        >
                            All ({users.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('pending_verification')}
                            className={`py-2 px-1 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider text-center transition-all ${filterType === 'pending_verification' ? 'bg-emerald-600 text-black font-extrabold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
                        >
                            Pending
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('unsubscribed')}
                            className={`py-2 px-1 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider text-center transition-all ${filterType === 'unsubscribed' ? 'bg-emerald-600 text-black font-extrabold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
                        >
                            Inactive
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('restricted')}
                            className={`py-2 px-1 rounded-xl text-[9px] font-black font-mono uppercase tracking-wider text-center transition-all ${filterType === 'restricted' ? 'bg-emerald-600 text-black font-extrabold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
                        >
                            Locked
                        </button>
                    </div>
                </div>
                
                {/* User Cards Block List */}
                <div className="divide-y divide-zinc-800 bg-black">
                    {displayedUsers.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500 font-mono font-bold text-xs uppercase tracking-widest py-16">
                            {!searchEmail.trim() && filterType === 'all' 
                                ? "Search for a user by name or email to view and control their account" 
                                : "No matching operational nodes on record"
                            }
                        </div>
                    ) : (
                        displayedUsers.map((user, idx) => {
                            const status = getDeactivationStatus(user);
                            const isDeactivated = status === 'Deactivated';
                            const isImminent = status.startsWith('Imminent');

                            return (
                                <div key={idx} className="p-5 space-y-4 hover:bg-zinc-900/30 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-extrabold text-white text-sm">{user.name}</p>
                                                <span className="text-[9px] font-mono text-zinc-500">({user.email})</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
                                                <span className="text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5">Base: ₦{user.balance.toLocaleString()}</span>
                                                {user.vipBalance !== undefined && user.vipBalance > 0 && (
                                                    <span className="text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-2 py-0.5">VIP Funds: ₦{user.vipBalance.toLocaleString()}</span>
                                                )}
                                                {user.loanBalance !== undefined && user.loanBalance > 0 && (
                                                    <span className="text-rose-400 bg-rose-950/30 border border-rose-500/20 rounded-lg px-2 py-0.5">Debt: ₦{user.loanBalance.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-center">
                                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black tracking-wider ${user.isSubscribed ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                                {user.isSubscribed ? 'SUBSCRIBED' : 'EXPIRED'}
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black tracking-wider ${isDeactivated ? 'bg-rose-950 text-rose-455 text-rose-400 border border-rose-500/35' : isImminent ? 'bg-orange-600 text-white animate-pulse border border-orange-700' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'}`}>
                                                {status.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Tags */}
                                    <div className="flex flex-wrap gap-1.5 pl-1">
                                        {user.isVMode && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-white text-black font-mono">
                                                AUTO VERIFICATION vMODE
                                            </span>
                                        )}
                                        {user.isPMode && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-500 text-black font-mono">
                                                FORCE PENDING pMODE
                                            </span>
                                        )}
                                        {user.isVIP && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/20 font-mono">
                                                VIP MEMBER NODE
                                            </span>
                                        )}
                                        {user.isInvestmentIdUsed && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-zinc-800 text-zinc-400 font-mono">
                                                INVEST ID REGISTERED
                                            </span>
                                        )}
                                        {user.isRestricted && (
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-950 text-rose-400 border border-rose-500/20 font-mono">
                                                BLOCKED / RESTRICTED
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-3.5 pt-1.5">
                                        {user.isSubscribed ? (
                                            <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/10 p-3 rounded-xl font-mono">
                                                <span className="text-xs font-black text-emerald-400 uppercase">License: {user.subscriptionPlan}</span>
                                                <button onClick={() => handleRevoke(user.email)} className="text-xs text-rose-400 font-bold hover:underline">Revoke License</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <select
                                                    className="flex-1 text-xs p-2.5 rounded-xl border border-zinc-850 border-zinc-800 bg-black text-white outline-none focus:border-emerald-500 font-bold cursor-pointer"
                                                    value={selectedPlans[user.email] || 'Monthly Plan'}
                                                    onChange={(e) => setSelectedPlans({...selectedPlans, [user.email]: e.target.value})}
                                                >
                                                    <option value="Weekly Plan">Weekly Plan</option>
                                                    <option value="Monthly Plan">Monthly Plan</option>
                                                    <option value="Premium User">Premium User</option>
                                                </select>
                                                <button onClick={() => handleApprove(user.email)} className="bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black py-2.5 px-4 rounded-xl transition-all active:scale-[0.98]">
                                                    Grant License
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Dynamic Switches Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            <button 
                                                onClick={() => handleToggleVIP(user.email)} 
                                                className={`py-2 text-[9px] font-black font-mono uppercase tracking-wider rounded-xl border transition-all active:scale-[0.98] ${user.isVIP ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:bg-zinc-800/80 hover:text-white'}`}
                                            >
                                                {user.isVIP ? 'Revoke VIP Privilege' : 'Grant VIP Status'}
                                            </button>
                                            <button 
                                                onClick={() => handleToggleVMode(user.email)} 
                                                className={`py-2 text-[9px] font-black font-mono uppercase tracking-wider rounded-xl border transition-all active:scale-[0.98] ${user.isVMode ? 'bg-white text-black border-white' : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:bg-zinc-800/80'}`}
                                            >
                                                {user.isVMode ? 'vMode ON (Auto Approve)' : 'vMode OFF'}
                                            </button>
                                            <button 
                                                onClick={() => handleTogglePMode(user.email)} 
                                                className={`py-2 text-[9px] font-black font-mono uppercase tracking-wider rounded-xl border transition-all active:scale-[0.98] ${user.isPMode ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:bg-zinc-800/80'}`}
                                            >
                                                {user.isPMode ? 'pMode ON (Force Pending)' : 'pMode OVERRIDE'}
                                            </button>
                                            <button 
                                                onClick={() => handleToggleDeactivate(user.email, user.deactivationDate)} 
                                                className={`py-2 text-[9px] font-black font-mono uppercase tracking-wider rounded-xl border transition-all active:scale-[0.98] ${user.deactivationDate ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30 animate-pulse' : 'bg-zinc-900/45 text-rose-450 text-rose-500 border border-rose-500/20 hover:bg-rose-950/20'}`}
                                            >
                                                {user.deactivationDate ? 'Unlock Service Node' : 'Impose 24h Lockout'}
                                            </button>
                                            <button 
                                                onClick={() => handleTriggerImminent(user.email)} 
                                                className={`py-2 text-[9px] font-black font-mono uppercase tracking-wider rounded-xl border transition-all active:scale-[0.98] ${isImminent ? 'bg-orange-600 text-white border-orange-700 animate-pulse' : 'bg-zinc-900/40 text-zinc-400 border-zinc-800'}`}
                                            >
                                                {isImminent ? 'Kill Alert Notification' : 'Trigger 20m Alert'}
                                            </button>
                                            <button 
                                                onClick={() => handleQuickNotify(user.email)} 
                                                className="py-2 text-[9px] font-black font-mono uppercase tracking-wider rounded-xl border border-emerald-500/25 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/80 transition-all text-center flex items-center justify-center space-x-1"
                                            >
                                                <span>Invite Alert Msg</span>
                                            </button>
                                            
                                            <button 
                                                type="button"
                                                onClick={() => handleToggleExpandUser(user.email, user)} 
                                                className={`py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl border col-span-2 sm:col-span-3 transition-all ${expandedUserEmail === user.email ? 'bg-emerald-600 text-black border-emerald-700 font-extrabold font-mono shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-900/90 text-white border-zinc-800 hover:bg-zinc-800/80 shadow-sm'}`}
                                            >
                                                {expandedUserEmail === user.email ? '✕ Close Terminal Control Override' : '⚙ Open Balance Overwrite & Ledger Injector'}
                                            </button>
                                        </div>

                                        {expandedUserEmail === user.email && (
                                            <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-5 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    <h4 className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center">
                                                        <Settings size={14} className="mr-1.5 text-emerald-400" /> ADVANCED override OVERLAY
                                                    </h4>
                                                    <span className="text-[9px] font-mono text-zinc-500 select-all font-bold">{user.email}</span>
                                                </div>
                                                
                                                {/* Subsection: Balances overrides */}
                                                <div className="space-y-3.5 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                                                    <h5 className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">1. Account Balance Nodes Override</h5>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Base Bal (₦)</label>
                                                            <input 
                                                                type="number"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-555 focus:border-emerald-500 outline-none"
                                                                value={editBalance}
                                                                onChange={(e) => setEditBalance(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">VIP Reserves (₦)</label>
                                                            <input 
                                                                type="number"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-500 outline-none"
                                                                value={editVipBalance}
                                                                onChange={(e) => setEditVipBalance(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Loan Liability (₦)</label>
                                                            <input 
                                                                type="number"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-500 outline-none"
                                                                value={editLoanBalance}
                                                                onChange={(e) => setEditLoanBalance(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-zinc-800/80 pt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" /> Weekly Withdraw Limit (₦)
                                                            </label>
                                                            <input 
                                                                type="number"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-500 outline-none font-mono"
                                                                value={editCustomWeeklyLimit}
                                                                onChange={(e) => setEditCustomWeeklyLimit(e.target.value)}
                                                                placeholder="500000"
                                                            />
                                                            <span className="text-[8px] text-zinc-500 font-mono">Current sub limit override (Default: ₦500,000)</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" /> Monthly Withdraw Limit (₦)
                                                            </label>
                                                            <input 
                                                                type="number"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-500 outline-none font-mono"
                                                                value={editCustomMonthlyLimit}
                                                                onChange={(e) => setEditCustomMonthlyLimit(e.target.value)}
                                                                placeholder="2000000"
                                                            />
                                                            <span className="text-[8px] text-zinc-500 font-mono">Current sub limit override (Default: ₦2,000,000)</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleSaveBalances(user)}
                                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98]"
                                                    >
                                                        Save Balance Overwrite
                                                    </button>
                                                </div>

                                                {/* Subsection: Account status restrictions */}
                                                <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                                                    <h5 className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">2. State Restrictions Status</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleToggleAccountLinkedVerified(user)}
                                                            className={`py-3 px-2 text-[9px] font-mono font-black uppercase tracking-wider rounded-xl border transition-all ${user.isAccountLinkedVerified ? 'bg-emerald-950 text-emerald-450 border-emerald-500/30' : 'bg-black text-zinc-500 border-zinc-800 hover:bg-zinc-905'}`}
                                                        >
                                                            {user.isAccountLinkedVerified ? '✓ LINKED ACCT: VERIFIED' : '✖ LINKED ACCT: UNVERIFIED'}
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleToggleRestriction(user)}
                                                            className={`py-3 px-2 text-[9px] font-mono font-black uppercase tracking-wider rounded-xl border transition-all ${user.isRestricted ? 'bg-rose-950 text-rose-400 border-rose-550/30' : 'bg-black text-zinc-500 border-zinc-800 hover:bg-zinc-905'}`}
                                                        >
                                                            {user.isRestricted ? '🔒 STATE: RESTRICTED/BLOCKED' : '🔓 STATE: OPEN/SECURE'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Subsection: Activity ledger transaction injector */}
                                                <div className="space-y-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                                                    <h5 className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">3. Action Activity Ledger Ledger</h5>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Flow Direction</label>
                                                            <select 
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-500 outline-none font-bold"
                                                                value={injectTxType}
                                                                onChange={(e) => setInjectTxType(e.target.value as 'credit' | 'debit')}
                                                            >
                                                                <option value="credit">➕ Credit (+ Credit Funds)</option>
                                                                <option value="debit">➖ Debit (- Liab Deduct)</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Operational Node status</label>
                                                            <select 
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-500 outline-none font-bold"
                                                                value={injectTxStatus}
                                                                onChange={(e) => setInjectTxStatus(e.target.value as 'success' | 'pending' | 'failed')}
                                                            >
                                                                <option value="success">🟢 Complete SUCCESS Node</option>
                                                                <option value="pending">🟡 PENDING Verification Node</option>
                                                                <option value="failed">🔴 FAILED Limits Rejected</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="col-span-1 space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Inject Amount (₦)</label>
                                                            <input 
                                                                type="number"
                                                                placeholder="Amount"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-500 outline-none font-mono"
                                                                value={injectTxAmount}
                                                                onChange={(e) => setInjectTxAmount(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-span-1 sm:col-span-2 space-y-1.5">
                                                            <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Receipt Manifest / Activity Label</label>
                                                            <input 
                                                                type="text"
                                                                placeholder="e.g. Daily Bonus Dividend, System Reset Award"
                                                                className="w-full text-xs p-2.5 rounded-lg bg-black text-white border border-zinc-800 focus:border-emerald-500 outline-none font-semibold"
                                                                value={injectTxDesc}
                                                                onChange={(e) => setInjectTxDesc(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleInjectTransaction(user)}
                                                            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-black text-[11px] font-mono font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98]"
                                                        >
                                                            ⚡ Inject Ledger Node
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleClearTransactions(user)}
                                                            className="py-3 px-4 bg-zinc-900 border border-rose-500/20 text-rose-400 hover:bg-rose-950/20 text-[11px] font-mono font-black uppercase tracking-wider rounded-xl transition-all"
                                                        >
                                                            🗑 Wipe Action Ledger
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

        {/* Modal Lightbox Screen for payment proof scanning */}
        {activeReceiptUser && (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150">
                <button 
                    onClick={() => setActiveReceiptUser(null)}
                    className="absolute top-4 right-4 p-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full hover:text-emerald-400 font-extrabold shadow-md active:scale-90 border border-zinc-800 transition-all cursor-pointer"
                >
                    <Icons.X size={20} />
                </button>
                
                <div className="max-w-md w-full bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 text-center space-y-4 animate-in zoom-in-95 duration-150">
                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">Receipt Authentication</h3>
                        <p className="text-xs text-zinc-450 text-zinc-400 font-mono whitespace-nowrap overflow-hidden text-ellipsis">Reference node: {activeReceiptUser.email}</p>
                    </div>
                    
                    <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-black max-h-[50vh] flex items-center justify-center p-1.5 relative">
                        <img 
                            src={activeReceiptUser.pendingPaymentProof} 
                            alt="Verification receipt proof file" 
                            className="object-contain max-h-[48vh] w-full rounded-xl"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    
                    <div className="flex space-x-2 pt-1">
                        <button 
                            onClick={async () => { await handleApproveActivation(activeReceiptUser); setActiveReceiptUser(null); }}
                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                        >
                            Authorize Act
                        </button>
                        <button 
                            onClick={async () => { await handleDeclineActivation(activeReceiptUser); setActiveReceiptUser(null); }}
                            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all"
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
