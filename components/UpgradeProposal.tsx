
import React from 'react';
import { Icons } from './Icons';
import { motion } from 'motion/react';

interface UpgradeProposalProps {
  onProceed: () => void;
  onBack: () => void;
}

const UpgradeProposal: React.FC<UpgradeProposalProps> = ({ onProceed, onBack }) => {
  return (
    <div className="px-4 py-8 space-y-10 relative pb-24 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-green-glow/5 blur-[120px] -z-10 pointer-events-none" />
      
      {/* Header with Icon Animation */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className="relative inline-block">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-green-glow rounded-full blur-2xl"
          />
          <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-glow to-emerald-400 rounded-[2rem] text-black shadow-2xl">
              <Icons.Zap size={40} fill="currentColor" strokeWidth={0} />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-green-glow uppercase tracking-[0.2em]">
            Legacy Upgrade
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">VIP <span className="text-green-glow">Status</span></h2>
          <p className="text-sm text-gray-500 font-medium max-w-[240px] mx-auto leading-relaxed">
            Architected for professionals. Experience a new standard of financial operations.
          </p>
        </div>
      </motion.div>

      {/* Premium Benefits List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-glow/5 blur-3xl -z-10" />
        <h3 className="font-black text-white text-lg uppercase tracking-tight mb-6 flex items-center space-x-2">
          <Icons.ShieldCheck size={20} className="text-green-glow" />
          <span>Exclusive Advantages</span>
        </h3>
        
        <ul className="space-y-5">
            {[
                { title: "Priority Settlement", desc: "Instant withdrawal network nodes" },
                { title: "Maximum Liquidity", desc: "Highest daily transaction thresholds" },
                { title: "Zero Maintenance", desc: "Lifetime fee waiver protocol active" },
                { title: "Platinum Access", desc: "Direct link to management engineers" },
                { title: "Exclusive Hub", desc: "Unlock the VIP Enterprise Dashboard" }
            ].map((benefit, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex items-start space-x-4"
                >
                    <div className="w-6 h-6 rounded-lg bg-green-glow/10 flex items-center justify-center text-green-glow shrink-0 mt-0.5">
                      <Icons.Check size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white leading-none uppercase tracking-tight">{benefit.title}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-1">{benefit.desc}</p>
                    </div>
                </motion.li>
            ))}
        </ul>
      </motion.div>

      {/* High-Contrast Pricing */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-green-glow to-blue-400 p-[1px] rounded-[2.5rem] shadow-2xl"
      >
        <div className="bg-black rounded-[2.5rem] p-8 text-center space-y-1">
          <p className="text-[10px] font-black text-green-glow uppercase tracking-widest">Lifetime Activation Fee</p>
          <h4 className="text-5xl font-black text-white tracking-tighter leading-none py-1">₦20,000</h4>
          <div className="pt-2">
            <span className="text-[8px] font-black bg-white/10 text-white px-2 py-1 rounded-full uppercase tracking-tighter">Limited Time Legacy Offer</span>
          </div>
        </div>
      </motion.div>

      {/* Refined Actions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4 pt-4"
      >
          <button 
            onClick={onProceed}
            className="group w-full py-5 bg-white text-black font-black rounded-3xl shadow-xl shadow-white/5 hover:bg-green-glow hover:shadow-green-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-[0.2em] text-xs"
          >
              <span>Activate VIP Node</span>
              <Icons.ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={onBack} 
            className="w-full py-4 text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] hover:text-white transition-colors"
          >
            Return to Dashboard
          </button>
      </motion.div>
    </div>
  );
};

export default UpgradeProposal;

