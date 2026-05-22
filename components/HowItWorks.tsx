
import React from 'react';
import { Icons } from './Icons';

interface HowItWorksProps {
  onBack: () => void;
  onPlayQuiz: () => void;
  onSubscribe: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onBack, onPlayQuiz, onSubscribe }) => {
  return (
    <div className="px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <Icons.ArrowLeft size={24} className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">How It Works</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-900/50 border border-white/5 rounded-[2.5rem] p-8 text-center space-y-4">
           <div className="mx-auto w-20 h-20 bg-green-glow/10 rounded-[2rem] flex items-center justify-center text-green-glow mb-2">
              <Icons.Celebration size={40} />
           </div>
           <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Welcome to <span className="text-green-glow">chix9ja</span></h3>
           <p className="text-gray-400 text-sm leading-relaxed">
             Nigeria's leading digital rewards and finance platform. We've made earning and managing funds simple, fun, and highly rewarding.
           </p>
        </div>

        <div className="grid gap-4">
          {/* Step 1: Play & Earn */}
          <div className="bg-gray-900 border border-white/5 rounded-3xl p-6 flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-500">
                <Icons.Trophy size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold uppercase text-sm tracking-tight">1. Play to Earn</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Instant Cash Prizes</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Test your knowledge with our daily quizzes. Every correct answer builds your balance. Win up to <span className="text-white font-bold">₦7,000</span> per win!
            </p>
            <button 
                onClick={onPlayQuiz}
                className="w-full py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
                Play Quiz Now
            </button>
          </div>

          {/* Step 2: Subscribe */}
          <div className="bg-gray-900 border border-white/5 rounded-3xl p-6 flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <Icons.CheckCircle size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold uppercase text-sm tracking-tight">2. Get Subscribed</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Unlock Withdrawals</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              To maintain a secure network, withdrawals are enabled for <span className="text-green-glow font-bold">subscribed members only</span>. Choose a plan that fits your goals.
            </p>
            <button 
                onClick={onSubscribe}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
                View Plans
            </button>
          </div>

          {/* Step 3: Withdraw */}
          <div className="bg-gray-900 border border-white/5 rounded-3xl p-6 flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-glow/10 rounded-2xl flex items-center justify-center text-green-glow">
                <Icons.Bank size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold uppercase text-sm tracking-tight">3. Fast Withdrawals</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Any Nigerian Bank</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Once you earn enough and are on a valid plan, you can move your funds to <span className="text-white font-bold">any commercial bank</span> in Nigeria within seconds.
            </p>
          </div>
        </div>

        <div className="bg-green-glow/5 border border-green-glow/10 p-5 rounded-3xl text-center space-y-2">
            <Icons.ShieldCheck size={20} className="text-green-glow mx-auto" />
            <p className="text-xs text-gray-300 font-medium">Verified by chix9ja Secure Protocol</p>
            <p className="text-[10px] text-gray-500 px-4">Our platform uses advanced encryption to ensure every transaction is fast, secure and reliable.</p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
