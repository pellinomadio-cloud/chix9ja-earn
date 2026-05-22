
import React, { useState } from 'react';
import { Icons } from './Icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (email: string, name: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and max 4 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPassword(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password.length !== 4) {
      setError('Please enter your 4-digit PIN');
      setIsLoading(false);
      return;
    }
    
    const emailKey = email.toLowerCase().trim();
    const securePassword = `${password}_chix9ja_secure_salt`;

    signInWithEmailAndPassword(auth, emailKey, securePassword)
      .then(async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', emailKey));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            onLogin(emailKey, userData.name);
          } else {
            setError('Account found in Auth, but user details are missing in database.');
          }
        } catch (err: any) {
          setError(err.message || 'Error loading profile from database.');
        }
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          setError('Account not registered or invalid 4-digit PIN.');
        } else {
          setError(err.message || 'Error validating credentials across devices.');
        }
        setIsLoading(false);
      });
  };


  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-glow rounded-full flex items-center justify-center mb-4">
            <span className="text-black font-bold text-2xl italic">Cx</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to access your chix9ja dashboard</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            
            {error && (
              <div className="bg-red-900/20 text-red-400 text-sm p-3 rounded-lg text-center border border-red-800">
                {error}
              </div>
            )}

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
                  placeholder="Enter 4-digit PIN"
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <a href="#" className="font-medium text-green-glow hover:text-green-light">
                Forgot your PIN?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-black bg-green-glow hover:bg-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-glow shadow-lg transition-all disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && (
                 <span className="absolute right-4 inset-y-0 flex items-center pl-3">
                    <Icons.ArrowRight className="h-5 w-5 text-black/50 group-hover:text-black" />
                 </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <button onClick={onSwitchToRegister} className="font-bold text-green-glow hover:text-green-light">
                    Register now
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
