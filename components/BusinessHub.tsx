
import React, { useState } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface BusinessHubProps {
  user: User;
  onVipWithdraw: (amount: number) => void;
  onLinkAccountClick: () => void;
  onBack: () => void;
}

const BusinessHub: React.FC<BusinessHubProps> = ({ user, onVipWithdraw, onLinkAccountClick, onBack }) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const vipBalance = user.vipBalance || 0;

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amt > vipBalance) {
      setError('Insufficient VIP funds');
      return;
    }

    onVipWithdraw(amt);
    setWithdrawAmount('');
    setError('');
  };

  return (
    <div className="px-4 py-8 space-y-10 relative pb-32 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-green-glow/5 blur-[120px] -z-10 pointer-events-none" />
      
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <motion.button 
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
             <Icons.ArrowLeft size={22} />
        </motion.button>
        <div className="text-right">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Business <span className="text-green-glow">Hub</span></h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Operations</p>
        </div>
      </div>

      {/* VIP Status Banner - Dynamic & High Contrast */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        {user.isVIP ? (
          <div className="bg-gradient-to-br from-green-glow to-emerald-400 rounded-[2.5rem] p-8 text-black shadow-2xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between relative z-10">
               <div className="space-y-4">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-green-glow">
                    <Icons.Zap size={24} fill="currentColor" strokeWidth={0} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">VIP Member</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Verified Node Active</p>
                  </div>
               </div>
               <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-black/20 flex items-center justify-center animate-[spin_8s_linear_infinite]">
                    <Icons.Star size={24} className="fill-black" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter mt-2">Elite</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 rounded-[2.5rem] p-8 text-center border-2 border-dashed border-white/5 group-hover:border-white/10 transition-colors">
             <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600 mx-auto mb-4">
                <Icons.Lock size={28} />
             </div>
             <p className="text-white font-black uppercase tracking-tight text-lg">VIP Restricted</p>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Upgrade Tier to Unlock Hub</p>
          </div>
        )}
      </motion.div>

      {/* Balance Bento Grid */}
      <div className="grid grid-cols-1 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl"
        >
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 blur-2xl group-hover:bg-white/5 transition-all" />
           <div className="flex justify-between items-start mb-6">
             <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Main Wallet</p>
                <h4 className="text-3xl font-black text-white tracking-tighter">₦{user.balance.toLocaleString()}</h4>
             </div>
             {user.isSubscribed && (
               <div className="flex items-center bg-amber-400 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                 <Icons.Star size={10} className="mr-1.5 fill-black" strokeWidth={0} /> Golden Tier
               </div>
             )}
           </div>
           <div className="flex items-center space-x-2 text-[10px] text-gray-600 font-bold uppercase">
              <Icons.ShieldCheck size={14} className="text-gray-700" />
              <span>Insured by ChixProtect</span>
           </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-gradient-to-br from-green-glow/10 to-transparent border border-green-glow/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
        >
           <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-green-glow/5 blur-2xl" />
           <div className="space-y-1 mb-6">
              <p className="text-[10px] font-black text-green-glow uppercase tracking-widest">Business Growth Funds</p>
              <h4 className="text-5xl font-black text-green-glow tracking-tighter">₦{vipBalance.toLocaleString()}</h4>
           </div>
           <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-green-glow border-2 border-black flex items-center justify-center text-[8px] font-black">
                       {i}
                    </div>
                 ))}
                 <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center text-[8px] font-black text-white">
                    +
                 </div>
              </div>
              <p className="text-[10px] text-green-glow/60 font-black uppercase tracking-tighter italic">Ready for Node Transfer</p>
           </div>
        </motion.div>
      </div>

      {/* Modern Withdrawal Section */}
      <AnimatePresence>
        {user.isVIP && vipBalance > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Icons.Banknote size={80} />
            </div>
            
            <div className="space-y-1">
               <h3 className="text-xl font-black text-white uppercase tracking-tight">Funds Settlement</h3>
               <p className="text-xs text-gray-500 font-medium">Transfer funds to your main wallet instantly.</p>
            </div>
            
            <div className="space-y-6">
              <div className={`transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Transfer Amount</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white font-black text-2xl">₦</div>
                  <input 
                    type="number"
                    value={withdrawAmount}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-20 pl-14 pr-6 bg-black border-2 border-white/5 group-hover:border-green-glow/30 rounded-3xl text-3xl font-black text-white outline-none transition-all focus:border-green-glow focus:ring-4 focus:ring-green-glow/10"
                  />
                  {withdrawAmount && (
                    <button 
                      onClick={() => setWithdrawAmount(vipBalance.toString())}
                      className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest transition-colors"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-3 rounded-2xl"
                >
                  <Icons.AlertTriangle size={14} />
                  <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                </motion.div>
              )}

              <button 
                onClick={handleWithdraw}
                className="w-full py-5 bg-white text-black font-black rounded-3xl shadow-xl hover:bg-green-glow hover:shadow-green-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-[0.2em] text-xs"
              >
                <Icons.Sync size={18} />
                <span>Sync Funds</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Account Bento Card */}
      {user.isSubscribed && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-900 rounded-[2.5rem] border border-blue-500/20 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -z-10 group-hover:bg-blue-600/10 transition-all" />
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Icons.Link size={28} />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg uppercase tracking-tight leading-none">External Link</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Database Node Link</p>
                </div>
              </div>
              <Icons.ShieldCheck size={24} className="text-blue-600/30" />
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed font-semibold"> 
              Securely integrate your verified bank account to enable high-frequency withdrawal protocols and instant network settlement.
            </p>

            <button 
              onClick={onLinkAccountClick}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-xs"
            >
              <Icons.PlusCircle size={18} />
              <span>Connect Withdraw Node</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Info Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 space-y-3"
      >
         <div className="flex items-center space-x-2 text-green-glow">
            <Icons.Info size={16} />
            <p className="text-[10px] font-black uppercase tracking-widest">Knowledge Base</p>
         </div>
         <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
           <span className="text-white font-bold">About Enterprise Hub:</span> Dedicated operational center for VIP node holders. Manage development grants and execute cross-wallet settlements with zero network latency. All transfers are protected by AES-256 encryption.
         </p>
      </motion.div>
    </div>
  );
};

export default BusinessHub;

