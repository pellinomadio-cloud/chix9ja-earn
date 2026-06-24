import React, { useEffect, useState, useRef } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db, syncUserFromLocalToFirestore } from '../firebase';
import { motion } from 'motion/react';

interface PaymentCallbackProps {
  onVerificationComplete: () => void;
}

const PaymentCallback: React.FC<PaymentCallbackProps> = ({ onVerificationComplete }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [txDetails, setTxDetails] = useState<any>(null);
  const runsRef = useRef(false);

  useEffect(() => {
    // Avoid double-execution in React strict mode
    if (runsRef.current) return;
    runsRef.current = true;

    const verifyTransaction = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const transactionId = params.get('transaction_id') || params.get('id');
        const txRef = params.get('tx_ref');
        const callbackStatus = params.get('status');

        if (!transactionId || !txRef) {
          setStatus('failed');
          setErrorMessage('Cryptographic checkout parameters are missing. Ref: null, TxID: null.');
          return;
        }

        if (callbackStatus === 'cancelled') {
          setStatus('failed');
          setErrorMessage('Payment process was cancelled by the user.');
          return;
        }

        // Get active user session to update correct profile
        const activeEmail = localStorage.getItem('chix9ja_active_session');
        if (!activeEmail) {
          setStatus('failed');
          setErrorMessage('Active security session has expired. Please sign in again.');
          return;
        }

        const emailKey = activeEmail.toLowerCase().trim();
        const storedUsersStr = localStorage.getItem('chix9ja_users');
        const storedUsers = storedUsersStr ? JSON.parse(storedUsersStr) : {};
        const currentUser: User = storedUsers[emailKey];

        if (!currentUser) {
          setStatus('failed');
          setErrorMessage('Unable to find a valid account profile matching the active session.');
          return;
        }

        // Parse key details from txRef
        // tx_ref is structured as: chix9ja-paymentType-timestamp-random
        const refParts = txRef.split('-');
        const paymentType = refParts[1] || 'subscription';

        // Map expected payment amount based on type
        let expectedAmount = 0;
        if (paymentType === 'subscription_weekly') expectedAmount = 10000;
        else if (paymentType === 'subscription_monthly') expectedAmount = 17000;
        else if (paymentType === 'subscription_yearly') expectedAmount = 70000;
        else if (paymentType === 'subscription_promo') expectedAmount = 7000;
        else if (paymentType === 'vip') expectedAmount = 20000;
        else if (paymentType === 'link_account') expectedAmount = 30700;
        else if (paymentType === 'investment') expectedAmount = 22000;
        else if (paymentType === 'imminent_payment') {
          // Reactivation fee depends on active deactivation date
          const isDeactivated = currentUser.deactivationDate && Date.now() > currentUser.deactivationDate;
          expectedAmount = isDeactivated ? 30000 : 20000;
        }

        // Call our Express server to securely verify with Flutterwave API
        const response = await fetch('/api/flutterwave/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_id: transactionId,
            tx_ref: txRef,
            email: emailKey,
            expectedAmount: expectedAmount,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Flutterwave gateway verification mismatch.');
        }

        const exactAmountPaid = Number(data.amount);

        // Save transaction to Firestore flutterwave_payments collection
        const secureTxId = transactionId.toString();
        const firebaseTxData = {
          transactionId: secureTxId,
          txRef: txRef,
          amount: exactAmountPaid,
          status: 'verified',
          userId: emailKey,
          paymentType: paymentType,
          timestamp: new Date().toISOString(),
          paymentGateway: 'flutterwave',
          liveMode: !txRef.includes('mock_flw_txn_') && !data.tx_ref?.startsWith('mock_'),
        };

        await setDoc(doc(db, 'flutterwave_payments', secureTxId), firebaseTxData);

        // Apply activation benefits directly to the active profile in LocalStorage
        const finalUsers = storedUsers;
        const finalUser: User = finalUsers[emailKey];

        // Ensure transactions array exists
        if (!finalUser.transactions) {
          finalUser.transactions = [];
        }

        // Construct human-readable activation label
        let displayTypeLabel = paymentType.replace(/_/g, ' ').toUpperCase();
        let displayBenefitLabel = 'Node upgrade activated successfully.';

        const paymentTxHistory: Transaction = {
          id: 'tx_flwave_' + secureTxId,
          type: 'credit' as const,
          amount: exactAmountPaid,
          description: `Flutterwave node pay: ${displayTypeLabel}`,
          date: new Date().toISOString(),
          status: 'success' as const,
        };

        // Prepend transaction history item
        finalUser.transactions = [paymentTxHistory, ...finalUser.transactions];

        // Specific Activation Rules
        if (paymentType.startsWith('subscription_')) {
          let durationDays = 30;
          let planName = 'Monthly Pro';
          
          if (paymentType === 'subscription_weekly') {
            durationDays = 7;
            planName = 'Weekly Saver';
          } else if (paymentType === 'subscription_yearly') {
            durationDays = 365;
            planName = 'Premium Elite';
          } else if (paymentType === 'subscription_promo') {
            durationDays = 1;
            planName = 'Promo Subscription';
          }

          const expiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
          finalUser.isSubscribed = true;
          finalUser.subscriptionPlan = planName;
          finalUser.subscriptionExpiryDate = expiryTimestamp;
          finalUser.isPMode = true;

          // Add subscription welcome balance bonus if weekly or monthly
          let welcomeBonus = 0;
          let welcomeDesc = '';
          if (paymentType === 'subscription_weekly') {
            welcomeBonus = 120000;
            welcomeDesc = 'Weekly Subscription Welcome Bonus';
          } else if (paymentType === 'subscription_monthly') {
            welcomeBonus = 200000;
            welcomeDesc = 'Monthly Subscription Welcome Bonus';
          }

          if (welcomeBonus > 0) {
            finalUser.balance = (finalUser.balance || 0) + welcomeBonus;
            const welcomeBonusTx: Transaction = {
              id: 'tx_flwave_bonus_' + Math.random().toString(36).substring(2, 8),
              type: 'credit' as const,
              amount: welcomeBonus,
              description: welcomeDesc,
              date: new Date().toISOString(),
              status: 'success' as const,
            };
            finalUser.transactions = [welcomeBonusTx, ...finalUser.transactions];
          }

          displayBenefitLabel = `Your ${planName} subscription is fully ACTIVE. Instant withdrawal nodes are online!`;

        } else if (paymentType === 'vip') {
          finalUser.isVIP = true;
          finalUser.vipBalance = (finalUser.vipBalance || 0) + 1000000; // Add 1 Million VIP Business Fund
          finalUser.vModeVipUsed = true;
          
          // Clear any pending statuses
          finalUser.pendingActivation = null;
          
          // Successful checkout clears any pending VIP activation debits
          if (finalUser.transactions) {
            finalUser.transactions = finalUser.transactions.map(t => {
              if (t.type === 'debit' && t.status === 'pending') {
                return { ...t, status: 'success' };
              }
              return t;
            });
          }

          displayBenefitLabel = 'You are now a Lifetime VIP Member. ₦1,000,000 Business Fund has been allocated!';

        } else if (paymentType === 'link_account') {
          finalUser.isAccountLinkedVerified = true;
          finalUser.pendingActivation = null;
          displayBenefitLabel = 'Withdraw bank account verification is complete. Automated payouts enabled.';

        } else if (paymentType === 'investment') {
          finalUser.isRestricted = false;
          finalUser.pendingActivation = null;
          finalUser.restrictionType = undefined;
          finalUser.restrictionRestoreTime = undefined;
          displayBenefitLabel = 'Investment validation checks are resolved. All portfolio restrictions deleted.';

        } else if (paymentType === 'imminent_payment') {
          // Clear imminent payment restriction metrics
          (finalUser as any).isDeactivated = false;
          finalUser.pendingActivation = null;
          finalUser.deactivationDate = undefined;
          finalUser.imminentDeactivationExpiry = undefined;
          displayBenefitLabel = 'Account reactivated successfully. Secure security node has returned to fully operational.';
        }

        // Wipe any general pending activation since the payment successfully went through
        finalUser.pendingActivation = null;
        finalUser.pendingPaymentProof = undefined;
        finalUser.pendingPaymentAmount = undefined;
        finalUser.pendingPaymentDate = undefined;

        // Save back to LocalStorage
        finalUsers[emailKey] = finalUser;
        localStorage.setItem('chix9ja_users', JSON.stringify(finalUsers));

        // Perform Firestore Cloud Sync
        await syncUserFromLocalToFirestore(emailKey);

        setTxDetails({
          amount: exactAmountPaid,
          txRef: txRef,
          transactionId: transactionId,
          typeLabel: displayTypeLabel,
          benefitLabel: displayBenefitLabel,
          liveMode: !txRef.includes('mock_flw_txn_'),
        });

        setStatus('success');
      } catch (err: any) {
        console.error('Error verifying payment callback:', err);
        setStatus('failed');
        setErrorMessage(err.message || 'The checkout verification failed. Payment was received but validation timed out.');
      }
    };

    verifyTransaction();
  }, []);

  const handleReturnToDashboard = () => {
    // Clear url query params so payment-callback isn't triggered again on reload
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {}
    onVerificationComplete();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6 select-none relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-0 inset-x-0 h-64 bg-emerald-500/5 blur-3xl rounded-full -z-10" />
      
      <div className="w-full max-w-md bg-gradient-to-b from-zinc-950 via-zinc-950 to-black border border-white/5 rounded-[32px] p-6 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-white/5 rounded-full"></div>
              <div className="absolute top-0 w-24 h-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                <Icons.Sync size={32} className="animate-spin text-glow-green" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight">Verifying Flow...</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest animate-pulse">Running secure Flutterwave compliance validation handshake</p>
            </div>
            
            <p className="text-[11px] text-zinc-400 max-w-[280px]">
              Allocating validation hash nodes... Do not close, refresh, or swipe back.
            </p>
          </div>
        )}

        {status === 'success' && txDetails && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500" />
            
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
              <Icons.Celebration size={40} className="text-glow-green" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">TRANSACTION ACTIVE</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase">Payment Secured</h3>
            </div>

            <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl text-left space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Amount Paid</span>
                <span className="text-emerald-400 font-black">₦{txDetails.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-500 font-bold">Node Gateway</span>
                <span className="text-white font-black">{txDetails.liveMode ? 'Flutterwave Live' : 'Flutterwave Sandbox'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-500 font-bold">Transaction Reference</span>
                <span className="text-white font-black max-w-[170px] truncate">{txDetails.txRef}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-500 font-bold">Checkout ID</span>
                <span className="text-white font-black">{txDetails.transactionId}</span>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl text-left">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Benefit Allocation</p>
              <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                {txDetails.benefitLabel}
              </p>
            </div>

            <button
              onClick={handleReturnToDashboard}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all text-xs"
            >
              Access Automated Dashboard
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />
            
            <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
              <Icons.AlertTriangle size={40} className="text-glow-red" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-[9px] font-black uppercase text-red-500 tracking-widest">TRANSACTION TERMINATED</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase">ACTIVATION FAILED</h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-semibold px-4">
              {errorMessage}
            </p>

            <button
              onClick={handleReturnToDashboard}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest rounded-2xl border border-white/5 active:scale-95 transition-all text-xs"
            >
              Return and Retry Payment
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentCallback;
