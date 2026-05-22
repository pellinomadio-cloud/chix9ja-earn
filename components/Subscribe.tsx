
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Plan } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SubscribeProps {
  onPlanSelect: (plan: Plan) => void;
  userBalance: number;
}

interface PlanDisplay extends Plan {
  limitDescription: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

const Subscribe: React.FC<SubscribeProps> = ({ onPlanSelect, userBalance }) => {
  const [showAdvert, setShowAdvert] = useState(false);

  const plans: PlanDisplay[] = [
    { 
      id: 'weekly', 
      name: 'Weekly Saver', 
      price: '₦8,000', 
      amount: '8,000 Naira', 
      duration: '7 Days Access',
      limitDescription: 'Withdraw up to ₦200,000',
      features: ['Priority Withdrawals', 'Weekly Rewards', 'Basic Support'],
      icon: <Icons.Clock size={24} />,
      color: 'from-blue-600 to-blue-400'
    },
    { 
      id: 'monthly', 
      name: 'Monthly Pro', 
      price: '₦15,000', 
      amount: '15,000 Naira', 
      duration: '30 Days Access', 
      recommended: true,
      limitDescription: 'Withdraw up to ₦2,000,000',
      features: ['High Withdrawal Limits', 'Premium Tasks', '24/7 Priority Support'],
      icon: <Icons.Trophy size={24} />,
      color: 'from-green-glow to-emerald-400'
    },
    { 
      id: 'yearly', 
      name: 'Premium Elite', 
      price: '₦50,000', 
      amount: '50,000 Naira', 
      duration: '365 Days Access',
      limitDescription: 'Unlimited Withdrawals',
      features: ['No Withdrawal Limits', 'VIP Exclusive Hub', 'Dedicated Manager'],
      icon: <Icons.Zap size={24} />,
      color: 'from-fuchsia-600 to-pink-500'
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowAdvert(true), 1500);
    const interval = setInterval(() => {
      setShowAdvert(prev => !prev);
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleSupportClick = () => {
    window.open('https://t.me/chix9jaservice', '_blank');
  };

  return (
    <div className="px-4 py-8 space-y-10 relative pb-32 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-green-glow/5 blur-[120px] -z-10 pointer-events-none" />
      
      {/* Header section with better typography */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-green-glow uppercase tracking-widest mb-2">
          Subscription Center
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
          Elevate Your <span className="text-green-glow">Experience</span>
        </h2>
        <p className="text-sm text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed">
          Unlock unlimited potential and faster withdrawals with our premium tiers.
        </p>
      </motion.div>

      {/* Modern Plans Stack */}
      <div className="space-y-4">
        {plans.map((plan, index) => {
          const isWeeklyRestricted = plan.id === 'weekly' && userBalance > 200000;
          const isMonthlyRestricted = plan.id === 'monthly' && userBalance > 2000000;
          const isRestricted = isWeeklyRestricted || isMonthlyRestricted;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => !isRestricted && onPlanSelect(plan)}
              className={`group relative overflow-hidden rounded-[2rem] border transition-all duration-300 ${
                isRestricted 
                ? 'border-gray-800 bg-gray-900/50 opacity-60 grayscale' 
                : 'border-white/5 bg-gray-900 hover:border-white/20 active:scale-[0.98]'
              }`}
            >
              {/* Highlight Background for Recommended */}
              {plan.recommended && !isRestricted && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-glow/5 to-transparent pointer-events-none" />
              )}

              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${plan.color} text-black shadow-lg`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{plan.name}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{plan.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${isRestricted ? 'text-gray-500' : 'text-green-glow'} tracking-tighter`}>{plan.price}</p>
                    {plan.recommended && (
                      <span className="text-[8px] font-black bg-green-glow text-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">Popular</span>
                    )}
                  </div>
                </div>

                {isRestricted ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-2">
                    <div className="flex items-center space-x-2 text-red-500 mb-1">
                      <Icons.Lock size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Locked</p>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 leading-tight uppercase">
                      Current balance (₦{userBalance.toLocaleString()}) exceeds this plan's withdrawal capacity. Upgrade to higher tier.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
                          <Icons.Check size={12} className="text-green-glow" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center space-x-1.5">
                        <Icons.ShieldCheck size={14} className="text-green-glow/50" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{plan.limitDescription}</span>
                      </div>
                      <button className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all ${plan.recommended ? 'bg-green-glow text-black shadow-[0_0_20px_rgba(46,213,115,0.3)]' : 'bg-white text-black hover:bg-gray-200'}`}>
                        Choose Plan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trust Badges */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="pt-6 grid grid-cols-3 gap-2"
      >
        {[
          { icon: <Icons.ShieldCheck size={16} />, label: 'Secure' },
          { icon: <Icons.Sync size={16} />, label: 'Fast' },
          { icon: <Icons.Star size={16} />, label: 'Verified' }
        ].map((badge, i) => (
          <div key={i} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
             <div className="text-green-glow/50">{badge.icon}</div>
             <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">{badge.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Floating Support Button - Clean & Minimal */}
      <AnimatePresence>
        {showAdvert && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-[100]"
          >
            <button 
              onClick={handleSupportClick}
              className="w-full bg-white text-black rounded-3xl p-5 shadow-2xl flex items-center justify-between group active:scale-95 transition-all border border-white/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-green-glow/5 group-hover:bg-green-glow/10 transition-colors" />
              <div className="flex items-center space-x-4 relative z-10">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
                  <Icons.MessageCircle size={22} />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-tight">Technical Support</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em]">Instant Telegram Access</p>
                </div>
              </div>
              <div className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-green-glow group-hover:text-black transition-colors relative z-10">
                Connect
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Subscribe;
