import React from 'react';
import { Icons } from './Icons';
import { Activity, TrendingUp, DollarSign } from 'lucide-react';

interface QuizAdProps {
  onStart: () => void;
  onClose: () => void;
}

const QuizAd: React.FC<QuizAdProps> = ({ onStart, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden text-center space-y-5 animate-in zoom-in-95 duration-300 border-2 border-green-glow/50">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-3 right-3 p-1 bg-gray-800 rounded-full text-gray-450 hover:text-red-500 transition-colors">
            <Icons.X size={20} />
        </button>

        <div className="flex justify-center pt-2">
             <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/25 rounded-2xl flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <TrendingUp size={40} className="text-green-glow" />
             </div>
        </div>

        <div>
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Live <span className="text-green-glow text-shadow-green">UX-Trade</span> Desk</h2>
             <p className="text-gray-400 mt-2 text-sm leading-relaxed px-2">
                Trade in USD using your dashboard balance! Earn profits on crypto futures and perform <span className="font-bold text-green-glow underline underline-offset-4 decoration-emerald-500/50">instant cashouts</span> straight back to your chix9ja account.
              </p>
         </div>

        <div className="space-y-3">
            <button 
                onClick={onStart}
                className="w-full py-4 bg-green-glow hover:bg-green-dark text-black font-black rounded-2xl shadow-[0_10px_20px_rgba(34,197,94,0.3)] transition-all transform active:scale-95 flex items-center justify-center space-x-2 uppercase tracking-widest text-sm"
            >
                <Activity size={18} />
                <span>Start Trading Now</span>
            </button>
            <button 
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium"
            >
                Dismiss alert
            </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAd;