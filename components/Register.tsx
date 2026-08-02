import React, { useState } from 'react';
import { Icons } from './Icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import FloatingMoneyBackground from './FloatingMoneyBackground';

interface RegisterProps {
  onRegister: (name: string, email: string, referredBy?: string) => void;
  onSwitchToLogin: () => void;
  defaultReferralCode?: string;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin, defaultReferralCode }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referredByInput, setReferredByInput] = useState(defaultReferralCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and max 4 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPassword(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length !== 4) {
      setError('Password must be exactly 4 digits');
      return;
    }

    const emailKey = email.toLowerCase().trim();
    if (emailKey === referredByInput.toLowerCase().trim()) {
      setError('You cannot refer yourself.');
      return;
    }

    setIsLoading(true);
    const securePassword = `${password}_chix9ja_secure_salt`;

    // Check device registration limit (Max 2 accounts per device)
    let deviceAccounts: string[] = [];
    try {
      const stored = localStorage.getItem('chix9ja_device_registered_accounts');
      if (stored) {
        deviceAccounts = JSON.parse(stored);
      }
    } catch (e) {
      deviceAccounts = [];
    }

    if (!deviceAccounts.includes(emailKey) && deviceAccounts.length >= 2) {
      setError('Registration limit exceeded. You cannot create more than two chix9ja accounts on this device.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Manually check if Firestore already contains this email to prevent duplicate accounts
      const docSnap = await getDoc(doc(db, 'users', emailKey));
      if (docSnap.exists()) {
        setError('An account with this email already exists.');
        setIsLoading(false);
        return;
      }

      // 2. Resolve referrer email (if provided)
      let resolvedReferrerEmail: string | undefined = undefined;
      if (referredByInput.trim()) {
        const cleanedRef = referredByInput.trim();
        // Prevent referring yourself via referral code check
        const selfCodeHandle = emailKey.split('@')[0].toUpperCase();
        if (cleanedRef.toUpperCase() === selfCodeHandle || cleanedRef.toLowerCase() === emailKey) {
          setError('You cannot refer yourself.');
          setIsLoading(false);
          return;
        }

        if (cleanedRef.includes('@')) {
          const refEmailKey = cleanedRef.toLowerCase();
          const refSnap = await getDoc(doc(db, 'users', refEmailKey));
          if (refSnap.exists()) {
            resolvedReferrerEmail = refEmailKey;
          } else {
            setError('Referrer account email not found.');
            setIsLoading(false);
            return;
          }
        } else {
          const refCode = cleanedRef.toUpperCase();
          const q = query(collection(db, 'users'), where('referralCode', '==', refCode));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            resolvedReferrerEmail = querySnap.docs[0].id;
          } else {
            setError('Referral code not found.');
            setIsLoading(false);
            return;
          }
        }
      }

      // 3. Create User in Firebase Auth
      await createUserWithEmailAndPassword(auth, emailKey, securePassword);
      
      // Update registered accounts list on this device
      if (!deviceAccounts.includes(emailKey)) {
        deviceAccounts.push(emailKey);
        localStorage.setItem('chix9ja_device_registered_accounts', JSON.stringify(deviceAccounts));
      }

      // 4. Fire callbacks with the resolved referrer email
      onRegister(name, emailKey, resolvedReferrerEmail);
      setIsLoading(false);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password/PIN is not secure enough.');
      } else {
        setError(err.message || 'Error creating account.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-zinc-950 to-emerald-900 relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      
      {/* Floating Money Background Overlay */}
      <FloatingMoneyBackground />

      {/* Main Registration Box */}
      <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-emerald-950/90 via-zinc-950/95 to-emerald-950/90 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] backdrop-blur-xl space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-amber-400 via-yellow-400 to-emerald-400 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300">
            <span className="text-black font-black text-2xl italic tracking-tighter">Cx</span>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight uppercase drop-shadow-sm">
            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-emerald-400">Account</span>
          </h2>

          <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
            Join chix9ja and get <span className="text-amber-300 font-extrabold underline decoration-amber-400 decoration-2">₦10,000</span> bonus instantly!
          </p>
        </div>

        {/* Registration Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-950/80 text-red-300 text-xs sm:text-sm p-3 rounded-xl text-center border border-red-500/60 font-medium shadow-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="sr-only">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icons.User className="h-5 w-5 text-amber-400/80" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full pl-11 px-3.5 py-3 border-2 border-emerald-800/80 placeholder-emerald-400/60 text-amber-100 bg-emerald-950/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-sm transition-all shadow-inner"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icons.Mail className="h-5 w-5 text-amber-400/80" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full pl-11 px-3.5 py-3 border-2 border-emerald-800/80 placeholder-emerald-400/60 text-amber-100 bg-emerald-950/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-sm transition-all shadow-inner"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">4-digit PIN</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icons.Lock className="h-5 w-5 text-amber-400/80" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                className="appearance-none rounded-xl relative block w-full pl-11 px-3.5 py-3 border-2 border-emerald-800/80 placeholder-emerald-400/60 text-amber-100 bg-emerald-950/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-sm transition-all tracking-widest shadow-inner"
                placeholder="Create 4-digit PIN"
                value={password}
                onChange={handlePasswordChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="referredByInput" className="sr-only">Referral Code or Email (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icons.Users className="h-5 w-5 text-amber-400/80" />
              </div>
              <input
                id="referredByInput"
                name="referredByInput"
                type="text"
                className="appearance-none rounded-xl relative block w-full pl-11 px-3.5 py-3 border-2 border-emerald-800/80 placeholder-emerald-400/60 text-amber-100 bg-emerald-950/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-sm transition-all shadow-inner"
                placeholder="Referral Code or Email (Optional)"
                value={referredByInput}
                onChange={(e) => setReferredByInput(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center pt-1">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-amber-400 focus:ring-amber-400 border-emerald-700 rounded bg-emerald-950"
            />
            <label htmlFor="terms" className="ml-2.5 block text-xs text-emerald-200/90 font-medium">
              I agree to the{' '}
              <a href="#" className="text-amber-300 hover:text-amber-200 font-bold underline">
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className="text-amber-300 hover:text-amber-200 font-bold underline">
                Privacy Policy
              </a>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-black rounded-full text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xl shadow-amber-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 uppercase tracking-wider"
            >
              {isLoading ? 'Creating Account...' : 'Get Started & Claim Bonus'}
            </button>
          </div>
        </form>

        <div className="text-center border-t border-emerald-900/60 pt-4">
          <p className="text-xs text-emerald-300/80 font-medium">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-extrabold text-amber-300 hover:text-amber-200 underline transition-colors"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
