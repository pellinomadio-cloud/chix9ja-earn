
import React, { useState } from 'react';
import { Icons } from './Icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
           <div className="mx-auto h-16 w-16 bg-green-glow rounded-full flex items-center justify-center mb-4 shadow-lg">
            <span className="text-black font-bold text-2xl italic">Cx</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Join chix9ja and get <span className="text-green-glow font-bold">₦10,000</span> bonus instantly!
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-red-900/20 text-red-400 text-sm p-3 rounded-lg text-center border border-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-800 placeholder-gray-500 text-white bg-gray-900 focus:outline-none focus:ring-green-glow focus:border-green-glow sm:text-sm transition-all"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-800 placeholder-gray-500 text-white bg-gray-900 focus:outline-none focus:ring-green-glow focus:border-green-glow sm:text-sm transition-all"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">4-digit PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  required
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-800 placeholder-gray-500 text-white bg-gray-900 focus:outline-none focus:ring-green-glow focus:border-green-glow sm:text-sm transition-all tracking-widest"
                  placeholder="Create 4-digit PIN"
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="referredByInput" className="sr-only">Referral Code or Email (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Users className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="referredByInput"
                  name="referredByInput"
                  type="text"
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-800 placeholder-gray-500 text-white bg-gray-900 focus:outline-none focus:ring-green-glow focus:border-green-glow sm:text-sm transition-all"
                  placeholder="Referral Code or Email (Optional)"
                  value={referredByInput}
                  onChange={(e) => setReferredByInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center">
                <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-green-glow focus:ring-green-glow border-gray-800 rounded bg-gray-900"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                    I agree to the <a href="#" className="text-green-glow hover:text-green-light font-bold">Terms</a> and <a href="#" className="text-green-glow hover:text-green-light font-bold">Privacy Policy</a>
                </label>
            </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-black bg-green-glow hover:bg-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-glow shadow-lg transition-all disabled:opacity-70"
            >
              {isLoading ? 'Creating Account...' : 'Get Started'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-bold text-green-glow hover:text-green-light">
                    Login here
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
