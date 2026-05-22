
import React, { useState } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { quizQuestions, QuizQuestion } from './quizQuestions';

interface TaskPageProps {
  user: User;
  onTelegramClaim: () => void;
  onTelegramClaim2: () => void;
  onWhatsAppClaim: () => void;
  onBiggyWinClaim: () => void;
  onGameRewardsClaim: () => void;
  onGameResult: (win: boolean) => void;
  onBack: () => void;
  mode?: 'quiz' | 'telegram' | 'all';
}

const TaskPage: React.FC<TaskPageProps> = ({ 
  user, 
  onTelegramClaim, 
  onTelegramClaim2, 
  onWhatsAppClaim,
  onBiggyWinClaim,
  onGameRewardsClaim,
  onGameResult, 
  onBack, 
  mode = 'all' 
}) => {
  const [gameStep, setGameStep] = useState<'intro' | 'playing' | 'result'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isWin, setIsWin] = useState(false);

  const startGame = () => {
    const randomIndex = Math.floor(Math.random() * quizQuestions.length);
    setCurrentQuestion(quizQuestions[randomIndex]);
    setGameStep('playing');
    setSelectedOption(null);
  };

  const handleAnswer = (option: string) => {
    if (!currentQuestion) return;
    
    setSelectedOption(option);
    const win = option === currentQuestion.answer;
    setIsWin(win);
    
    // Delay slightly to show selection before result
    setTimeout(() => {
      setGameStep('result');
      onGameResult(win);
    }, 600);
  };

  const getEffectiveQuizCount = () => {
    const now = new Date();
    const lastQuiz = user.lastQuizTimestamp ? new Date(user.lastQuizTimestamp) : null;
    if (!lastQuiz || now.toDateString() !== lastQuiz.toDateString()) {
      return 0;
    }
    return user.dailyQuizCount || 0;
  };

  const canPlayQuiz = () => {
    return getEffectiveQuizCount() < 20;
  };

  const canClaimTelegram = () => {
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastTelegramClaimTimestamp || 0;
    return nowTs - lastClaim >= twentyFourHours;
  };

  const canClaimTelegram2 = () => {
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastTelegramClaim2Timestamp || 0;
    return nowTs - lastClaim >= twentyFourHours;
  };

  const canClaimWhatsApp = () => {
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastWhatsAppClaimTimestamp || 0;
    return nowTs - lastClaim >= twentyFourHours;
  };

  const canClaimBiggyWin = () => {
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastBiggyWinClaimTimestamp || 0;
    return nowTs - lastClaim >= twentyFourHours;
  };

  const canClaimGameRewards = () => {
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastGameRewardsClaimTimestamp || 0;
    return nowTs - lastClaim >= twentyFourHours;
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-fuchsia-500/10 rounded-full text-fuchsia-500 mb-2">
            {mode === 'quiz' ? <Icons.Gamepad2 size={32} /> : <Icons.Star size={32} />}
        </div>
        <h2 className="text-2xl font-bold text-white">
            {mode === 'quiz' ? 'Daily Quiz Game' : mode === 'telegram' ? 'Daily Task' : 'Daily Tasks'}
        </h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
            {mode === 'quiz' 
                ? 'Test your knowledge and earn Real Cash for every correct answer.' 
                : mode === 'telegram' 
                    ? 'Join our community and earn daily rewards.' 
                    : 'Complete simple tasks and play games to earn Real Cash.'}
        </p>
      </div>

      {/* Telegram Task Section */}
      {(mode === 'telegram' || mode === 'all') && (
      <div className="space-y-4">
        <div className="bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-800 space-y-4">
          <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                  <Icons.Send size={24} />
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-white">Join Telegram Channel</h3>
                  <p className="text-xs text-gray-400">Earn ₦2,000 daily just for being a member.</p>
              </div>
              {canClaimTelegram() ? (
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase">Available</span>
              ) : (
                  <span className="text-[10px] font-bold bg-gray-500/20 text-gray-400 px-2 py-1 rounded uppercase">Claimed</span>
              )}
          </div>

          <div className="space-y-3 pt-2">
              <button 
                  onClick={() => {
                      window.open('https://t.me/chix9ja', '_blank');
                      onTelegramClaim();
                  }}
                  disabled={!canClaimTelegram()}
                  className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 ${canClaimTelegram() ? 'bg-green-glow text-black hover:bg-green-dark' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                  <Icons.Send size={18} />
                  <span>{canClaimTelegram() ? 'Join & Claim ₦2,000' : 'Already Claimed Today'}</span>
              </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-800 space-y-4">
          <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                  <Icons.MessageCircle size={24} />
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-white">Join WhatsApp Channel</h3>
                  <p className="text-xs text-gray-400">Earn ₦9,600 daily just for being a member.</p>
              </div>
              {canClaimWhatsApp() ? (
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase">Available</span>
              ) : (
                  <span className="text-[10px] font-bold bg-gray-500/20 text-gray-400 px-2 py-1 rounded uppercase">Claimed</span>
              )}
          </div>

          <div className="space-y-3 pt-2">
              <button 
                  onClick={() => {
                      window.open('https://whatsapp.com/channel/0029Vb8arfH59PwbSshxov1M', '_blank');
                      onWhatsAppClaim();
                  }}
                  disabled={!canClaimWhatsApp()}
                  className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 ${canClaimWhatsApp() ? 'bg-green-glow text-black hover:bg-green-dark' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                  <Icons.MessageCircle size={18} />
                  <span>{canClaimWhatsApp() ? 'Join & Claim ₦9,600' : 'Already Claimed Today'}</span>
              </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-800 space-y-4">
          <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                  <Icons.Send size={24} />
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-white">Join Telegram Channel 2</h3>
                  <p className="text-xs text-gray-400">Earn ₦18,085 daily just for being a member.</p>
              </div>
              {canClaimTelegram2() ? (
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase">Available</span>
              ) : (
                  <span className="text-[10px] font-bold bg-gray-500/20 text-gray-400 px-2 py-1 rounded uppercase">Claimed</span>
              )}
          </div>

          <div className="space-y-3 pt-2">
              <button 
                  onClick={() => {
                      window.open('https://t.me/flex9jaup', '_blank');
                      onTelegramClaim2();
                  }}
                  disabled={!canClaimTelegram2()}
                  className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 ${canClaimTelegram2() ? 'bg-green-glow text-black hover:bg-green-dark' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                  <Icons.Send size={18} />
                  <span>{canClaimTelegram2() ? 'Join & Claim ₦18,085' : 'Already Claimed Today'}</span>
              </button>
          </div>
        </div>

        {/* Biggy Win Task */}
        <div className="bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-800 space-y-4">
          <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-fuchsia-500/20 rounded-full flex items-center justify-center text-fuchsia-400">
                  <Icons.Zap size={24} />
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-white uppercase tracking-tight">Claim <span className="text-fuchsia-500">BIGGY WIN</span></h3>
                  <p className="text-xs text-gray-400">Claim your special daily <span className="text-fuchsia-400 font-bold">₦10,980</span> reward!</p>
              </div>
              {canClaimBiggyWin() ? (
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase animate-pulse">Hot</span>
              ) : (
                  <span className="text-[10px] font-bold bg-gray-500/20 text-gray-400 px-2 py-1 rounded uppercase">Used</span>
              )}
          </div>

          <div className="space-y-3 pt-2">
              <button 
                  onClick={onBiggyWinClaim}
                  disabled={!canClaimBiggyWin()}
                  className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 uppercase tracking-widest text-sm ${canClaimBiggyWin() ? 'bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-[0_10px_20px_rgba(217,70,239,0.3)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                <Icons.Zap size={18} fill="currentColor" />
                <span>{canClaimBiggyWin() ? 'Claim BIGGY WIN ₦10,980' : 'Claimed Successfully'}</span>
            </button>
          </div>
        </div>

        {/* Game Rewards Task */}
        <div className="bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-800 space-y-4">
          <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                  <Icons.Star size={24} />
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-white uppercase tracking-tight">GAME <span className="text-blue-400">REWARDS</span></h3>
                  <p className="text-xs text-gray-400">Claim your performance prize of <span className="text-blue-400 font-bold">₦5,500</span>!</p>
              </div>
              {canClaimGameRewards() ? (
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase">New</span>
              ) : (
                  <span className="text-[10px] font-bold bg-gray-500/20 text-gray-400 px-2 py-1 rounded uppercase">Done</span>
              )}
          </div>

          <div className="space-y-3 pt-2">
              <button 
                  onClick={onGameRewardsClaim}
                  disabled={!canClaimGameRewards()}
                  className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 uppercase tracking-widest text-sm ${canClaimGameRewards() ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                <Icons.Star size={18} fill="currentColor" />
                <span>{canClaimGameRewards() ? 'Claim REWARDS ₦5,500' : 'Already Claimed'}</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {(mode === 'quiz' || mode === 'all') && (
      <div className="bg-gray-900 rounded-2xl p-5 shadow-sm border border-fuchsia-500/20 space-y-4">
        <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600/20 to-blue-600/20 rounded-xl flex items-center justify-center text-fuchsia-500">
                <Icons.Gamepad2 size={24} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-white uppercase tracking-tight">Daily <span className="text-blue-400">Quiz</span> Game</h3>
                <p className="text-xs text-gray-400">Win <span className="text-fuchsia-400 font-bold">₦7,000</span> if correct, lose ₦1,000 if wrong.</p>
            </div>
        </div>

        {gameStep === 'intro' && (
            <div className="text-center py-4 space-y-4">
                <p className="text-sm text-gray-300">
                    {canPlayQuiz() 
                        ? 'Test your knowledge! Answer correctly to win big.' 
                        : 'You have reached your daily limit of 20 questions. Come back tomorrow!'}
                </p>
                <div className="flex justify-between items-center px-2 text-xs text-gray-500 font-medium">
                    <span>Daily Progress</span>
                    <span>{getEffectiveQuizCount()}/20</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-fuchsia-600 to-blue-600 h-full transition-all duration-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]" 
                        style={{ width: `${Math.min((getEffectiveQuizCount() / 20) * 100, 100)}%` }}
                    />
                </div>
                <button 
                    onClick={startGame}
                    disabled={!canPlayQuiz()}
                    className={`w-full py-4 font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-sm ${
                        canPlayQuiz() 
                            ? 'bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white shadow-[0_10px_20px_rgba(217,70,239,0.2)]' 
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {canPlayQuiz() ? 'Start Quiz Challenge' : 'Daily Limit Reached'}
                </button>
            </div>
        )}

        {gameStep === 'playing' && currentQuestion && (
            <div className="space-y-6 py-2">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <p className="text-white font-bold text-lg text-center">{currentQuestion.question}</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(option)}
                            disabled={selectedOption !== null}
                            className={`w-full py-4 px-6 text-left rounded-xl font-medium transition-all transform active:scale-[0.98] border-2 ${
                                selectedOption === option 
                                    ? (option === currentQuestion.answer ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400')
                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-fuchsia-500 hover:bg-gray-700'
                            }`}
                        >
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-xs font-bold mr-3 border border-white/5">
                                {String.fromCharCode(65 + idx)}
                            </span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {gameStep === 'result' && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-300">
                <div className={`text-3xl font-black ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {isWin ? 'CORRECT! 🎉' : 'WRONG! 😢'}
                </div>
                <p className="text-sm text-gray-400">
                    {isWin ? `₦7,000 has been added to your balance.` : `₦1,000 has been deducted from your balance.`}
                </p>
                <div className="flex justify-between items-center px-2 text-xs text-gray-500 font-medium">
                    <span>Daily Progress</span>
                    <span>{getEffectiveQuizCount()}/20</span>
                </div>
                <button 
                    onClick={startGame}
                    disabled={!canPlayQuiz()}
                    className={`w-full py-4 font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-sm ${
                        canPlayQuiz() 
                            ? 'bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white shadow-[0_10px_20px_rgba(217,70,239,0.2)]' 
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {canPlayQuiz() ? 'Next Question' : 'Daily Limit Reached'}
                </button>
            </div>
        )}
      </div>
      )}

      <button onClick={onBack} className="w-full py-3 text-gray-500 font-medium hover:text-green-glow text-sm">
        Back to Dashboard
      </button>

    </div>
  );
};

export default TaskPage;

