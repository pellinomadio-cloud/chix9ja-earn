import React from 'react';
import { Icons } from './Icons';

interface QuizAdProps {
  onStart: () => void;
  onClose: () => void;
}

const QuizAd: React.FC<QuizAdProps> = ({ onStart, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden text-center space-y-5 animate-in zoom-in-95 duration-300 border-2 border-fuchsia-500/50">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-3 right-3 p-1 bg-gray-800 rounded-full text-gray-500 hover:text-red-500 transition-colors">
            <Icons.X size={20} />
        </button>

        <div className="flex justify-center pt-2">
             <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(217,70,239,0.2)]">
                <Icons.Gamepad2 size={40} className="text-fuchsia-500" />
             </div>
        </div>

        <div>
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Daily <span className="text-blue-400">Quiz</span> <span className="text-fuchsia-500">Challenge!</span></h2>
             <p className="text-gray-400 mt-2 text-sm leading-relaxed px-4">
                Test your knowledge and earn <span className="font-bold text-fuchsia-400 underline underline-offset-4 decoration-blue-500/50">₦7,000</span> for every correct answer!
             </p>
        </div>

        <div className="space-y-3">
            <button 
                onClick={onStart}
                className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-blue-600 hover:from-fuchsia-500 hover:to-blue-500 text-white font-black rounded-2xl shadow-[0_10px_20px_rgba(217,70,239,0.3)] transition-all transform active:scale-95 flex items-center justify-center space-x-2 uppercase tracking-widest text-sm"
            >
                <Icons.Gamepad2 size={18} fill="currentColor" />
                <span>Play & Earn Now</span>
            </button>
            <button 
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-300"
            >
                Remind me later
            </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAd;