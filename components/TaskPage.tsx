import React, { useState } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { quizQuestions, QuizQuestion } from './quizQuestions';
import { useAppChannels } from '../firebase';

interface TaskPageProps {
  user: User;
  onTelegramClaim: () => void;
  onTelegramClaim2: () => void;
  onWhatsAppClaim: () => void;
  onBiggyWinClaim: () => void;
  onGameRewardsClaim: () => void;
  onGameResult: (win: boolean, customAmount?: number, customDesc?: string) => void;
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
  const { channels } = useAppChannels();

  // Active Game State: 'none' (Gaming Hub selection list) or chosen game ID
  const [activeGame, setActiveGame] = useState<'none' | 'quiz' | 'coinflip' | 'colorspin'>('none');

  // Brain Quiz States
  const [gameStep, setGameStep] = useState<'intro' | 'playing' | 'result'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isWin, setIsWin] = useState(false);

  // Coin Flip States
  const [coinChoice, setCoinChoice] = useState<'head' | 'tail' | null>(null);
  const [coinBet, setCoinBet] = useState<string>('500');
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<'head' | 'tail' | null>(null);
  const [coinGameOutcome, setCoinGameOutcome] = useState<'win' | 'lose' | null>(null);

  // Color Spin States
  const [colorChoice, setColorChoice] = useState<'red' | 'blue' | 'gold' | null>(null);
  const [colorBet, setColorBet] = useState<string>('500');
  const [colorSpinning, setColorSpinning] = useState(false);
  const [colorResult, setColorResult] = useState<'red' | 'blue' | 'gold' | null>(null);
  const [colorGameOutcome, setColorGameOutcome] = useState<'win' | 'lose' | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);

  // Daily limits and checks
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

  const canClaimWhatsApp = () => {
    const nowTs = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const lastClaim = user.lastWhatsAppClaimTimestamp || 0;
    return nowTs - lastClaim >= twentyFourHours;
  };

  // Brain Quiz flow
  const startQuiz = () => {
    const randomIndex = Math.floor(Math.random() * quizQuestions.length);
    setCurrentQuestion(quizQuestions[randomIndex]);
    setGameStep('playing');
    setSelectedOption(null);
  };

  const handleQuizAnswer = (option: string) => {
    if (!currentQuestion) return;
    
    setSelectedOption(option);
    const win = option === currentQuestion.answer;
    setIsWin(win);
    
    setTimeout(() => {
      setGameStep('result');
      onGameResult(win);
    }, 600);
  };

  // Coin Flip Flow
  const startCoinFlip = () => {
    if (!coinChoice) {
      alert("Please choose Head or Tail first!");
      return;
    }
    const betAmount = parseInt(coinBet, 10);
    if (isNaN(betAmount) || betAmount < 200) {
      alert("Minimum bet is ₦200!");
      return;
    }
    if (betAmount > user.balance) {
      alert("You do not have enough balance for this bet!");
      return;
    }

    setCoinFlipping(true);
    setCoinResult(null);
    setCoinGameOutcome(null);

    // Roll result after 2s of spinning coin animation
    setTimeout(() => {
      const rolledCoin = Math.random() < 0.5 ? 'head' : 'tail';
      const win = rolledCoin === coinChoice;
      
      setCoinResult(rolledCoin);
      setCoinFlipping(false);
      setCoinGameOutcome(win ? 'win' : 'lose');
      
      onGameResult(win, betAmount, win ? "Coin Flip Double or Nothing Win" : "Coin Flip Loss Penalty");
    }, 2000);
  };

  // Lucky Color Spin Flow
  const startColorSpin = () => {
    if (!colorChoice) {
      alert("Please select a color first!");
      return;
    }
    const betAmount = parseInt(colorBet, 10);
    if (isNaN(betAmount) || betAmount < 200) {
      alert("Minimum bet is ₦200!");
      return;
    }
    if (betAmount > user.balance) {
      alert("You do not have enough balance for this bet!");
      return;
    }

    setColorSpinning(true);
    setColorResult(null);
    setColorGameOutcome(null);

    // Red: 45% (0-0.45), Blue: 45% (0.45-0.90), Gold: 10% (0.90-1.0)
    const r = Math.random();
    let rolledColor: 'red' | 'blue' | 'gold';
    let targetPhi = 0;

    if (r < 0.45) {
      rolledColor = 'red';
      // Red is from 0 to 162 degrees on the wheel. Target an angle with safety margins.
      targetPhi = 15 + Math.floor(Math.random() * 132);
    } else if (r < 0.90) {
      rolledColor = 'blue';
      // Blue is from 162 to 324 degrees. Target an angle with safety margins.
      targetPhi = 177 + Math.floor(Math.random() * 132);
    } else {
      rolledColor = 'gold';
      // Gold is from 324 to 360 degrees. Target an angle with safety margins.
      targetPhi = 329 + Math.floor(Math.random() * 26);
    }

    // Since rotating the wheel clockwise by theta brings the point at (360 - theta) to the top,
    // we set segmentDeg = (360 - targetPhi) to align the rolled segment under the pointer.
    const segmentDeg = (360 - targetPhi) % 360;

    // Calculate the base rotation as the nearest multiple of 360 that is less than or equal to the current wheelRotation
    const currentRotBase = wheelRotation - (wheelRotation % 360);
    // Align to the next 4 full spins (1440 deg) plus the required segmentDeg
    const newRot = currentRotBase + 1440 + segmentDeg;
    setWheelRotation(newRot);

    // Wait for the transition to finish (2.5s)
    setTimeout(() => {
      const win = rolledColor === colorChoice;
      let wonAmount = betAmount; // Payout is 2x for Red/Blue (net profit is betAmount)
      if (rolledColor === 'gold') {
        wonAmount = betAmount * 4; // Payout is 5x for Gold (net profit is 4x betAmount)
      }

      setColorResult(rolledColor);
      setColorSpinning(false);
      setColorGameOutcome(win ? 'win' : 'lose');

      onGameResult(win, win ? wonAmount : betAmount, win ? `Lucky Color Spin Win - ${rolledColor.toUpperCase()}` : `Lucky Color Spin Loss - ${rolledColor.toUpperCase()}`);
    }, 2500);
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* 1. DAILY TASKS VIEW (Telegram & WhatsApp joining only) */}
      {(mode === 'telegram' || mode === 'all') && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-green-glow/10 rounded-full text-green-glow mb-2">
              <Icons.Star size={32} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Daily Tasks</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Complete simple tasks below to earn daily real cash rewards.
            </p>
          </div>

          <div className="space-y-4">
            {/* Telegram task */}
            <div className="bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-800 space-y-4">
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
                    window.open(channels.telegramChannel, '_blank');
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

            {/* WhatsApp task */}
            <div className="bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-800 space-y-4">
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
                    window.open(channels.whatsappChannel, '_blank');
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
          </div>
        </div>
      )}

      {/* 2. PREMIUM GAMING HUB VIEW */}
      {mode === 'quiz' && (
        <div className="space-y-6">
          
          {activeGame === 'none' && (
            <>
              <div className="text-center space-y-2 animate-in fade-in">
                <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full text-amber-500 mb-2">
                  <Icons.Gamepad2 size={32} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Gaming Hub</h2>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Play super fun games to grow your wallet and win premium rewards!
                </p>
              </div>

              {/* Grid list of games */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* Game 1: Brain Quiz */}
                <button 
                  onClick={() => {
                    setActiveGame('quiz');
                    setGameStep('intro');
                  }}
                  className="bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-800 flex items-start text-left space-x-4 hover:border-fuchsia-500/40 hover:bg-zinc-900/80 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600/20 to-blue-600/20 rounded-xl flex items-center justify-center text-fuchsia-400 group-hover:scale-110 transition-transform">
                    <Icons.Gamepad2 size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white uppercase tracking-tight text-sm">Brain Quiz</h3>
                      <span className="text-[9px] font-bold bg-fuchsia-500/10 text-fuchsia-400 px-2 py-0.5 rounded tracking-wide uppercase">Trivia</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Win ₦2,000 for correct, lose ₦1,000 for incorrect. Play limit 20 daily.</p>
                    <div className="text-[10px] text-zinc-500 font-mono mt-2 uppercase">Played Today: {getEffectiveQuizCount()}/20</div>
                  </div>
                </button>

                {/* Game 2: Double or Nothing Coin Flip */}
                <button 
                  onClick={() => {
                    setActiveGame('coinflip');
                    setCoinChoice(null);
                    setCoinResult(null);
                    setCoinGameOutcome(null);
                  }}
                  className="bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-800 flex items-start text-left space-x-4 hover:border-amber-500/40 hover:bg-zinc-900/80 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-600/20 to-yellow-600/20 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Icons.Star size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white uppercase tracking-tight text-sm">Double or Nothing</h3>
                      <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded tracking-wide uppercase">Betting</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Predict Head or Tail to double your wager instantly! Infinite play.</p>
                    <div className="text-[10px] text-zinc-500 font-mono mt-2 uppercase">Multiplier: 2X • UNLIMITED</div>
                  </div>
                </button>

                {/* Game 3: Lucky Color Spin */}
                <button 
                  onClick={() => {
                    setActiveGame('colorspin');
                    setColorChoice(null);
                    setColorResult(null);
                    setColorGameOutcome(null);
                  }}
                  className="bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-800 flex items-start text-left space-x-4 hover:border-emerald-500/40 hover:bg-zinc-900/80 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Icons.Sync size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white uppercase tracking-tight text-sm">Lucky Color Spin</h3>
                      <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded tracking-wide uppercase">Spin Wheel</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Wager on Red (2x), Blue (2x), or Gold (5x) for mega color spin multipliers!</p>
                    <div className="text-[10px] text-zinc-500 font-mono mt-2 uppercase">Multiplier: Up to 5X • UNLIMITED</div>
                  </div>
                </button>

              </div>
            </>
          )}

          {/* ACTIVE GAME 1: BRAIN QUIZ CHALLENGE */}
          {activeGame === 'quiz' && (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-fuchsia-500/20 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 font-mono uppercase">Brain Quiz</span>
                <button 
                  onClick={() => setActiveGame('none')}
                  className="text-xs font-bold text-fuchsia-400 hover:text-white transition-colors"
                >
                  Exit Game
                </button>
              </div>

              {gameStep === 'intro' && (
                <div className="text-center py-4 space-y-5">
                  <div className="inline-flex items-center justify-center p-3 bg-fuchsia-500/10 rounded-full text-fuchsia-500">
                    <Icons.Gamepad2 size={36} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-white uppercase">Brain Quiz Challenge</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Test your knowledge! Correct answers credit you <span className="text-green-400 font-bold">₦2,000</span>, while incorrect ones deduct <span className="text-red-400 font-bold">₦1,000</span>.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-3">
                    <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
                      <span>Daily Quiz Progress</span>
                      <span>{getEffectiveQuizCount()}/20</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-fuchsia-600 to-blue-600 h-full transition-all duration-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]" 
                        style={{ width: `${Math.min((getEffectiveQuizCount() / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={startQuiz}
                    disabled={!canPlayQuiz()}
                    className={`w-full py-4 font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-sm ${
                      canPlayQuiz() 
                        ? 'bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white shadow-[0_10px_20px_rgba(217,70,239,0.2)]' 
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {canPlayQuiz() ? 'Start Quiz Challenge' : 'Daily Limit Reached'}
                  </button>
                </div>
              )}

              {gameStep === 'playing' && currentQuestion && (
                <div className="space-y-6 py-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                    <p className="text-white font-bold text-md text-center leading-relaxed">{currentQuestion.question}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(option)}
                        disabled={selectedOption !== null}
                        className={`w-full py-4 px-6 text-left rounded-2xl font-medium transition-all transform active:scale-[0.98] border-2 flex items-center ${
                          selectedOption === option 
                            ? (option === currentQuestion.answer ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400')
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-fuchsia-500 hover:bg-zinc-800/85'
                        }`}
                      >
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-[11px] font-bold mr-3 border border-zinc-700">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {gameStep === 'result' && (
                <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-300">
                  <div className={`text-3xl font-black uppercase tracking-wider ${isWin ? 'text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-bounce' : 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                    {isWin ? 'CORRECT! 🎉' : 'WRONG! 😢'}
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    {isWin 
                      ? 'Congratulations! Your cash prize has been credited to your balance.' 
                      : `Nice attempt! The correct answer was "${currentQuestion?.answer}".`}
                  </p>
                  
                  <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-3">
                    <div className="flex justify-between items-center text-xs text-zinc-500 font-medium">
                      <span>Daily Quiz Progress</span>
                      <span>{getEffectiveQuizCount()}/20</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-fuchsia-600 to-blue-600 h-full transition-all duration-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]" 
                        style={{ width: `${Math.min((getEffectiveQuizCount() / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={startQuiz}
                    disabled={!canPlayQuiz()}
                    className={`w-full py-4 font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-sm ${
                      canPlayQuiz() 
                        ? 'bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white shadow-[0_10px_20px_rgba(217,70,239,0.2)]' 
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {canPlayQuiz() ? 'Next Question' : 'Daily Limit Reached'}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ACTIVE GAME 2: COIN FLIP (DOUBLE OR NOTHING) */}
          {activeGame === 'coinflip' && (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-amber-500/20 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 font-mono uppercase">Double or Nothing</span>
                <button 
                  onClick={() => setActiveGame('none')}
                  disabled={coinFlipping}
                  className="text-xs font-bold text-amber-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Exit Game
                </button>
              </div>

              <div className="flex flex-col items-center space-y-6 py-2">
                <style>{`
                  @keyframes flipY {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                  }
                  .animate-flip-y {
                    animation: flipY 0.4s linear infinite;
                    transform-style: preserve-3d;
                    perspective: 1000px;
                  }
                `}</style>
                
                {/* Simulated spinning coin */}
                <div className="relative h-32 flex items-center justify-center">
                  <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-300 ${
                    coinFlipping 
                      ? 'animate-flip-y bg-gradient-to-br from-amber-400 via-fuchsia-500 to-blue-500 border-zinc-700 shadow-[0_0_35px_rgba(168,85,247,0.5)] text-zinc-300' 
                      : (coinResult === 'tail'
                          ? 'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 border-blue-400 shadow-[0_0_35px_rgba(37,99,235,0.6)] text-white'
                          : 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.6)] text-black')
                  }`}>
                    <div className={`w-24 h-24 rounded-full border flex items-center justify-center bg-transparent ${
                      coinFlipping ? 'border-zinc-500/20' : (coinResult === 'tail' ? 'border-blue-300/40' : 'border-amber-300/40')
                    }`}>
                      <span className="font-black text-2xl uppercase tracking-tighter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        {coinFlipping ? 'Cx' : (coinResult ? (coinResult === 'head' ? 'HEAD' : 'TAIL') : 'Cx')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coin Option Selection */}
                <div className="w-full space-y-3 text-center">
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Pick Your Choice</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={coinFlipping}
                      onClick={() => setCoinChoice('head')}
                      className={`py-3.5 rounded-2xl font-black text-sm uppercase transition-all tracking-wider border-2 ${coinChoice === 'head' ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-amber-500/30'}`}
                    >
                      Head
                    </button>
                    <button
                      type="button"
                      disabled={coinFlipping}
                      onClick={() => setCoinChoice('tail')}
                      className={`py-3.5 rounded-2xl font-black text-sm uppercase transition-all tracking-wider border-2 ${coinChoice === 'tail' ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-amber-500/30'}`}
                    >
                      Tail
                    </button>
                  </div>
                </div>

                {/* Bet Inputs */}
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-zinc-400 uppercase">
                    <span>Bet Amount (₦)</span>
                    <span className="text-emerald-400 font-mono">My Wallet: ₦{user.balance.toLocaleString()}</span>
                  </div>
                  <input
                    type="number"
                    disabled={coinFlipping}
                    value={coinBet}
                    onChange={(e) => setCoinBet(e.target.value)}
                    placeholder="Wager amount"
                    className="w-full py-3 px-4 bg-zinc-950 border border-zinc-850 rounded-2xl text-center font-black font-mono text-white text-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <div className="flex justify-between gap-2 pt-1">
                    {['500', '1000', '2500', '5000'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        disabled={coinFlipping}
                        onClick={() => setCoinBet(val)}
                        className="flex-1 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-zinc-400 text-[10px] font-bold rounded-lg font-mono transition-all"
                      >
                        ₦{parseInt(val, 10).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flip Coin Trigger */}
                <div className="w-full pt-2">
                  {coinGameOutcome ? (
                    <div className="text-center py-2 space-y-3 animate-in zoom-in-95">
                      <div className={`text-xl font-black uppercase tracking-tight ${coinGameOutcome === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                        {coinGameOutcome === 'win' ? 'Double Win! 🎉' : 'Deducted From Balance 😢'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCoinResult(null);
                          setCoinGameOutcome(null);
                        }}
                        className="w-full py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all"
                      >
                        Play Again
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={coinFlipping || !coinChoice}
                      onClick={startCoinFlip}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-md transition-all active:scale-95 ${coinFlipping ? 'bg-amber-500/20 text-amber-500 cursor-not-allowed animate-pulse' : (coinChoice ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600 shadow-[0_10px_20px_rgba(245,158,11,0.2)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed')}`}
                    >
                      {coinFlipping ? 'Flipping Coin...' : 'Flip Gold Coin'}
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ACTIVE GAME 3: LUCKY COLOR SPIN */}
          {activeGame === 'colorspin' && (
            <div className="bg-zinc-900 rounded-3xl p-6 border border-emerald-500/20 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 font-mono uppercase">Lucky Color Spin</span>
                <button 
                  onClick={() => setActiveGame('none')}
                  disabled={colorSpinning}
                  className="text-xs font-bold text-emerald-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Exit Game
                </button>
              </div>

              <div className="flex flex-col items-center space-y-6 py-2">
                
                {/* CSS Wheel of Fortune Spinner */}
                <div className="relative flex flex-col items-center justify-center p-2">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-white z-20 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)] animate-bounce"></div>
                  
                  <div 
                    className="w-36 h-36 rounded-full border-4 border-zinc-800 shadow-[0_0_35px_rgba(0,0,0,0.5)] relative flex items-center justify-center overflow-hidden transition-all duration-[2.5s] ease-out"
                    style={{ 
                      transform: `rotate(${wheelRotation}deg)`,
                      background: `conic-gradient(#ef4444 0% 45%, #3b82f6 45% 90%, #f59e0b 90% 100%)` 
                    }}
                  >
                    {/* Visual markers */}
                    <div className="absolute font-black text-[9px] text-white select-none whitespace-nowrap" style={{ transform: 'rotate(81deg) translateY(-48px) rotate(-81deg)' }}>RED (2x)</div>
                    <div className="absolute font-black text-[9px] text-white select-none whitespace-nowrap" style={{ transform: 'rotate(243deg) translateY(-48px) rotate(-243deg)' }}>BLUE (2x)</div>
                    <div className="absolute font-black text-[9px] text-black select-none whitespace-nowrap" style={{ transform: 'rotate(342deg) translateY(-48px) rotate(-342deg)' }}>GOLD (5x)</div>
                    
                    <div className="absolute w-8 h-8 rounded-full bg-zinc-950 border-2 border-zinc-800 z-10 flex items-center justify-center shadow-md">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Color Selector */}
                <div className="w-full space-y-2 text-center">
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Predict the Landing Segment</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={colorSpinning}
                      onClick={() => setColorChoice('red')}
                      className={`py-3 rounded-2xl font-black text-xs uppercase border-2 transition-all ${colorChoice === 'red' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-red-500/30'}`}
                    >
                      Red (2X)
                    </button>
                    <button
                      type="button"
                      disabled={colorSpinning}
                      onClick={() => setColorChoice('blue')}
                      className={`py-3 rounded-2xl font-black text-xs uppercase border-2 transition-all ${colorChoice === 'blue' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-blue-500/30'}`}
                    >
                      Blue (2X)
                    </button>
                    <button
                      type="button"
                      disabled={colorSpinning}
                      onClick={() => setColorChoice('gold')}
                      className={`py-3 rounded-2xl font-black text-xs uppercase border-2 transition-all ${colorChoice === 'gold' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-amber-500/30'}`}
                    >
                      Gold (5X)
                    </button>
                  </div>
                </div>

                {/* Bet Input */}
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-zinc-400 uppercase">
                    <span>Wager amount (₦)</span>
                    <span className="text-emerald-400 font-mono">My Wallet: ₦{user.balance.toLocaleString()}</span>
                  </div>
                  <input
                    type="number"
                    disabled={colorSpinning}
                    value={colorBet}
                    onChange={(e) => setColorBet(e.target.value)}
                    placeholder="Wager amount"
                    className="w-full py-3 px-4 bg-zinc-950 border border-zinc-850 rounded-2xl text-center font-black font-mono text-white text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <div className="flex justify-between gap-2 pt-1">
                    {['500', '1000', '2500', '5000'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        disabled={colorSpinning}
                        onClick={() => setColorBet(val)}
                        className="flex-1 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-zinc-400 text-[10px] font-bold rounded-lg font-mono transition-all"
                      >
                        ₦{parseInt(val, 10).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spin Wheel Button */}
                <div className="w-full pt-2">
                  {colorGameOutcome ? (
                    <div className="text-center py-2 space-y-3 animate-in zoom-in-95">
                      <div className={`text-lg font-black uppercase tracking-tight ${colorGameOutcome === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                        {colorGameOutcome === 'win' 
                          ? `MULTIPLIER CLEARED! segment: ${colorResult?.toUpperCase()}! 🎉` 
                          : `segment: ${colorResult?.toUpperCase()}! No match. 😢`}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setColorResult(null);
                          setColorGameOutcome(null);
                        }}
                        className="w-full py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all"
                      >
                        Spin Again
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={colorSpinning || !colorChoice}
                      onClick={startColorSpin}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-md transition-all active:scale-95 ${colorSpinning ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed animate-pulse' : (colorChoice ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:from-emerald-600 hover:to-teal-600 shadow-[0_10px_20px_rgba(16,185,129,0.2)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed')}`}
                    >
                      {colorSpinning ? 'Spinning Color Wheel...' : 'Spin Color Wheel'}
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* Main Back Button */}
      <button 
        onClick={onBack} 
        disabled={coinFlipping || colorSpinning}
        className="w-full py-3 text-zinc-500 font-medium hover:text-green-glow text-sm transition-all active:scale-98 disabled:opacity-50"
      >
        Back to Dashboard
      </button>

    </div>
  );
};

export default TaskPage;
