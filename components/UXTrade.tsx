import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  RefreshCw, 
  Layers, 
  Wallet, 
  Play, 
  X, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Activity,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Percent,
  Sparkles,
  BarChart4,
  BookOpen,
  ArrowRight,
  TrendingUp as BuyIcon,
  TrendingDown as SellIcon
} from 'lucide-react';

interface UXTradeProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
}

interface ActiveTrade {
  id: string;
  asset: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  amount: number;
  leverage: number;
  timestamp: number;
}

interface HistoricalTrade {
  id: string;
  asset: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  closePrice: number;
  amount: number;
  leverage: number;
  pnl: number;
  timestamp: number;
  status: 'WIN' | 'LOSS';
}

const ASSETS = [
  { id: 'BTC-USD', name: 'Bitcoin / USD', basePrice: 68500, icon: 'BTC', volatility: 0.0015 },
  { id: 'ETH-USD', name: 'Ethereum / USD', basePrice: 3550, icon: 'ETH', volatility: 0.0025 },
  { id: 'SOL-USD', name: 'Solana / USD', basePrice: 165.5, icon: 'SOL', volatility: 0.004 },
  { id: 'CHIX-USD', name: 'chix9ja Token / USD', basePrice: 1.25, icon: 'CHIX', volatility: 0.008 },
];

const EXCHANGE_RATE = 1500; // 1 USD = 1,500 NGN

export const UXTrade: React.FC<UXTradeProps> = ({ user, onUpdateUser, onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState<'trade' | 'wallet' | 'academy' | 'history'>('trade');
  const [selectedAssetId, setSelectedAssetId] = useState('BTC-USD');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeAmount, setTradeAmount] = useState<string>('50');
  const [leverage, setLeverage] = useState<number>(10);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [historicalTrades, setHistoricalTrades] = useState<HistoricalTrade[]>([]);
  
  // Wallet states
  const [depositAmountNaira, setDepositAmountNaira] = useState<string>('15000');
  const [withdrawAmountUsd, setWithdrawAmountUsd] = useState<string>('50');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Quick swap state inside Desk View
  const [quickSwapNaira, setQuickSwapNaira] = useState<string>('5000');
  const [showQuickSwap, setShowSwapInDesk] = useState<boolean>(false);

  // Timeframe and Indicators setting for the redesigned Chart
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('5m');
  const [indicators, setIndicators] = useState<{ ma: boolean; ema: boolean; bbands: boolean }>({ ma: true, ema: false, bbands: false });

  // Asset prices tracker
  const [prices, setPrices] = useState<Record<string, number>>(
    ASSETS.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.basePrice }), {})
  );

  // Chart state
  const [chartData, setChartData] = useState<number[]>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const selectedAsset = ASSETS.find(a => a.id === selectedAssetId) || ASSETS[0];
  const currentAssetPrice = prices[selectedAssetId];

  // Initialize trade items
  useEffect(() => {
    const saved = localStorage.getItem(`chix9ja_trades_${user.email.toLowerCase()}`);
    if (saved) {
      try {
        setActiveTrades(JSON.parse(saved));
      } catch (e) {
        console.warn('Could not restore trades:', e);
      }
    }

    const savedHistory = localStorage.getItem(`chix9ja_trades_history_${user.email.toLowerCase()}`);
    if (savedHistory) {
      try {
        setHistoricalTrades(JSON.parse(savedHistory));
      } catch (e) {
        console.warn('Could not restore historical trades:', e);
      }
    }
  }, [user.email]);

  // Save trades when they update
  const saveTrades = (newTrades: ActiveTrade[]) => {
    setActiveTrades(newTrades);
    localStorage.setItem(`chix9ja_trades_${user.email.toLowerCase()}`, JSON.stringify(newTrades));
  };

  const saveHistoricalTrades = (newHist: HistoricalTrade[]) => {
    setHistoricalTrades(newHist);
    localStorage.setItem(`chix9ja_trades_history_${user.email.toLowerCase()}`, JSON.stringify(newHist));
  };

  // Simulating live ticking prices
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const nextPrices = { ...prev };
        ASSETS.forEach(asset => {
          const current = prev[asset.id];
          const volatilityScale = timeframe === '12h' || timeframe === '1d' ? 0.004 : asset.volatility;
          const changePercent = (Math.random() - 0.485) * 2 * volatilityScale; // slight upward trend to represent opportunities
          nextPrices[asset.id] = parseFloat((current * (1 + changePercent)).toFixed(asset.id === 'CHIX-USD' ? 4 : 2));
        });
        return nextPrices;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Update open trades live and refresh indices
  useEffect(() => {
    if (activeTrades.length > 0) {
      const updated = activeTrades.map(trade => {
        const livePrice = prices[trade.asset];
        if (livePrice) {
          return {
            ...trade,
            currentPrice: livePrice
          };
        }
        return trade;
      });
      const changed = JSON.stringify(updated) !== JSON.stringify(activeTrades);
      if (changed) {
        setActiveTrades(updated);
      }
    }
  }, [prices]);

  // Generate chart data based on selected asset & timeframe change
  useEffect(() => {
    const pts: number[] = [];
    let price = selectedAsset.basePrice;
    const pointsCount = timeframe === '1m' ? 24 : timeframe === '5m' ? 20 : timeframe === '15m' ? 18 : 22;
    for (let i = 0; i < pointsCount; i++) {
      price = price * (1 + (Math.random() - 0.5) * 2 * selectedAsset.volatility * 1.5);
      pts.push(price);
    }
    setChartData(pts);
  }, [selectedAssetId, timeframe]);

  // Tick the dynamic chart with live prices
  useEffect(() => {
    const livePrice = prices[selectedAssetId];
    if (livePrice) {
      setChartData(prev => {
        const next = [...prev.slice(1)];
        next.push(livePrice);
        return next;
      });
    }
  }, [prices[selectedAssetId], selectedAssetId]);

  // Flash warning helper
  const showFlash = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4500);
  };

  // Convert/Fund Trading USD from Main dashboard Naira Balance
  const handleFundTradeAccount = (amountNairaStr: string, isQuickSwap: boolean = false) => {
    const amtNaira = parseFloat(amountNairaStr);
    if (!amtNaira || amtNaira < 500) {
      showFlash('error', 'Minimum conversion amount is ₦500.');
      return;
    }

    if (user.balance < amtNaira) {
      showFlash('error', 'Insufficient balance on your chix9ja Naira dashboard.');
      return;
    }

    const usdGained = parseFloat((amtNaira / EXCHANGE_RATE).toFixed(2));
    const newMainBalance = parseFloat((user.balance - amtNaira).toFixed(2));
    const currentUsdBalance = user.tradeBalanceUsd || 0;
    const newTradeBalance = parseFloat((currentUsdBalance + usdGained).toFixed(2));

    const newTrx: Transaction = {
      id: `trx-trade-fund-${Date.now()}`,
      type: 'debit',
      amount: amtNaira,
      description: `Funded UX-Trade wallet: exchanged ₦${amtNaira.toLocaleString()} for $${usdGained} USD.`,
      date: new Date().toISOString(),
      status: 'success'
    };

    const updatedUser: User = {
      ...user,
      balance: newMainBalance,
      tradeBalanceUsd: newTradeBalance,
      transactions: [newTrx, ...(user.transactions || [])]
    };

    onUpdateUser(updatedUser);
    showFlash('success', `Instantly exchanged ₦${amtNaira.toLocaleString()} for $${usdGained} USD!`);
    
    if (isQuickSwap) {
      setShowSwapInDesk(false);
    } else {
      setDepositAmountNaira('');
    }
  };

  // Withdraw USD trade balance and profit back into Main dashboard Naira Balance
  const handleWithdrawTradeProfit = () => {
    const amtUsd = parseFloat(withdrawAmountUsd);
    const availableUsdInProfit = user.tradeProfitUsd || 0;
    const availableUsdInTradeBalance = user.tradeBalanceUsd || 0;
    const totalAvailableUsd = parseFloat((availableUsdInProfit + availableUsdInTradeBalance).toFixed(2));

    if (!amtUsd || amtUsd <= 0) {
      showFlash('error', 'Please enter a valid USD amount to cash out.');
      return;
    }

    if (amtUsd > totalAvailableUsd) {
      showFlash('error', `You only have $${totalAvailableUsd.toFixed(2)} USD available in your trade accounts.`);
      return;
    }

    let remainingToDeduct = amtUsd;
    let newProfitBalance = availableUsdInProfit;
    let newTradeBalanceUsd = availableUsdInTradeBalance;

    if (availableUsdInProfit >= remainingToDeduct) {
      newProfitBalance = parseFloat((availableUsdInProfit - remainingToDeduct).toFixed(2));
      remainingToDeduct = 0;
    } else {
      remainingToDeduct = parseFloat((remainingToDeduct - availableUsdInProfit).toFixed(2));
      newProfitBalance = 0;
      newTradeBalanceUsd = parseFloat((availableUsdInTradeBalance - remainingToDeduct).toFixed(2));
    }

    const nairaPayout = parseFloat((amtUsd * EXCHANGE_RATE).toFixed(2));
    const newMainNairaBalance = parseFloat((user.balance + nairaPayout).toFixed(2));

    const newTrx: Transaction = {
      id: `trx-trade-withdraw-${Date.now()}`,
      type: 'credit',
      amount: nairaPayout,
      description: `UX-Trade Settlement: Swapped $${amtUsd} USD back to dashboard Naira.`,
      date: new Date().toISOString(),
      status: 'success'
    };

    const updatedUser: User = {
      ...user,
      balance: newMainNairaBalance,
      tradeBalanceUsd: newTradeBalanceUsd,
      tradeProfitUsd: newProfitBalance,
      transactions: [newTrx, ...(user.transactions || [])]
    };

    onUpdateUser(updatedUser);
    showFlash('success', `Exchanged $${amtUsd} USD. Credited ₦${nairaPayout.toLocaleString()} back to your Dashboard balance!`);
    setWithdrawAmountUsd('');
  };

  // Opening a trade
  const handleOpenTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const tradeAmt = parseFloat(tradeAmount);
    const availableUsd = user.tradeBalanceUsd || 0;

    if (!tradeAmt || tradeAmt <= 0) {
      showFlash('error', 'Enter a valid trading amount in USD.');
      return;
    }

    if (tradeAmt > availableUsd) {
      // Show Quick Swap right on desk to help them keep momentum!
      setShowSwapInDesk(true);
      showFlash('error', `Insufficient USD Trade wallet funds. Tap "Quick Swap NGN ➔ USD" to fund instantly!`);
      return;
    }

    const newTradeBalance = parseFloat((availableUsd - tradeAmt).toFixed(2));
    
    const newTrade: ActiveTrade = {
      id: `trade-${Date.now()}`,
      asset: selectedAssetId,
      type: tradeType,
      entryPrice: currentAssetPrice,
      currentPrice: currentAssetPrice,
      amount: tradeAmt,
      leverage: leverage,
      timestamp: Date.now()
    };

    const updatedTrades = [newTrade, ...activeTrades];
    saveTrades(updatedTrades);

    const updatedUser: User = {
      ...user,
      tradeBalanceUsd: newTradeBalance
    };
    onUpdateUser(updatedUser);

    showFlash('success', `Opened ${tradeType} contract on ${selectedAsset.name} at entry price $${currentAssetPrice}.`);
  };

  // Profit & Loss calculation
  const calculatePnL = (trade: ActiveTrade): number => {
    const priceDiff = trade.currentPrice - trade.entryPrice;
    const priceMovePercent = priceDiff / trade.entryPrice;
    const directionMult = trade.type === 'BUY' ? 1 : -1;
    const finalPnL = directionMult * priceMovePercent * trade.leverage * trade.amount;
    
    if (finalPnL <= -trade.amount) {
      return -trade.amount;
    }
    return parseFloat(finalPnL.toFixed(2));
  };

  // Close position / Settle
  const handleCloseTrade = (tradeId: string) => {
    const trade = activeTrades.find(t => t.id === tradeId);
    if (!trade) return;

    const pnl = calculatePnL(trade);
    const collateralReturned = trade.amount;
    const isLiquidated = pnl <= -trade.amount;

    const remainingTrades = activeTrades.filter(t => t.id !== tradeId);
    saveTrades(remainingTrades);

    const historyItem: HistoricalTrade = {
      id: trade.id,
      asset: trade.asset,
      type: trade.type,
      entryPrice: trade.entryPrice,
      closePrice: trade.currentPrice,
      amount: trade.amount,
      leverage: trade.leverage,
      pnl: pnl,
      timestamp: Date.now(),
      status: pnl >= 0 ? 'WIN' : 'LOSS'
    };
    saveHistoricalTrades([historyItem, ...historicalTrades]);

    const prevUsdBalance = user.tradeBalanceUsd || 0;
    const prevProfitUsd = user.tradeProfitUsd || 0;

    let nextUsdBalance = prevUsdBalance;
    let nextProfitUsd = prevProfitUsd;

    if (pnl > 0) {
      nextUsdBalance = parseFloat((prevUsdBalance + collateralReturned).toFixed(2));
      nextProfitUsd = parseFloat((prevProfitUsd + pnl).toFixed(2));
    } else {
      const remainingCollateral = Math.max(0, collateralReturned + pnl);
      nextUsdBalance = parseFloat((prevUsdBalance + remainingCollateral).toFixed(2));
    }

    const updatedUser: User = {
      ...user,
      tradeBalanceUsd: nextUsdBalance,
      tradeProfitUsd: nextProfitUsd
    };

    onUpdateUser(updatedUser);

    if (isLiquidated) {
      showFlash('error', `Position Liquidated! The market hit your threshold and you lost your $${trade.amount} USD margin.`);
    } else if (pnl >= 0) {
      showFlash('success', `Position Settle Complete! Profit of +$${pnl.toFixed(2)} USD added straight to your earnings!`);
    } else {
      showFlash('success', `Position Closed. Retained $${(collateralReturned + pnl).toFixed(2)} USD of your starting margin.`);
    }
  };

  // Quick preset margins
  const PRESET_AMOUNTS = ['5', '15', '30', '50', '100'];

  // Sparkline calculations
  const minChartVal = Math.min(...chartData);
  const maxChartVal = Math.max(...chartData);
  const chartHeight = 85;
  const chartRange = maxChartVal - minChartVal || 1;

  // Safe limits warnings
  const getLeverageColor = (val: number) => {
    if (val <= 12) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (val <= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const getLeverageLabel = (val: number) => {
    if (val <= 12) return 'Safe (Low Liquidation Risk)';
    if (val <= 50) return 'Moderate (Medium Liquidation Risk)';
    return 'Extreme (High Instant Liquidation Risk)';
  };

  return (
    <div className="px-4 py-4 space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-300 bg-black min-h-screen">
      
      {/* Top Professional Header Row */}
      <div className="flex items-center justify-between border-b border-gray-900 pb-3">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all group active:scale-95"
        >
          <div className="p-1 rounded-lg bg-gray-900 group-hover:bg-gray-800 border border-gray-800">
            <ArrowLeft size={14} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Exit Terminal</span>
        </button>

        <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Activity size={14} className="text-emerald-400 animate-ping" />
          <span className="text-[10px] font-black text-emerald-400 font-mono tracking-widest uppercase">Live Workspace</span>
        </div>
      </div>

      {/* Interactive Global Alerts rendered as immersive centered modal */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActionMessage(null)}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-[24px] p-6 border text-center space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.85)] relative overflow-hidden bg-gray-950 ${
                actionMessage.type === 'success' 
                  ? 'border-emerald-550/40 shadow-[0_0_35px_rgba(16,185,129,0.2)]' 
                  : 'border-rose-550/40 shadow-[0_0_35px_rgba(239,68,68,0.2)]'
              }`}
            >
              {/* Decorative radial glows */}
              <div className={`absolute -top-12 -left-12 w-28 h-28 rounded-full blur-2xl opacity-15 ${
                actionMessage.type === 'success' ? 'bg-emerald-550' : 'bg-rose-500'
              }`} />
              <div className={`absolute -bottom-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-15 ${
                actionMessage.type === 'success' ? 'bg-emerald-550' : 'bg-rose-500'
              }`} />

              {/* Modern bouncing check/alert icon */}
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center">
                {actionMessage.type === 'success' ? (
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={32} className="text-glow-green" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-rose-500/10 rounded-full border border-rose-500/35 flex items-center justify-center text-rose-400">
                    <AlertCircle size={32} />
                  </div>
                )}
              </div>

              {/* Typography message center */}
              <div className="space-y-1.5">
                <h3 className={`text-xs font-black uppercase tracking-wider font-mono ${
                  actionMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {actionMessage.type === 'success' ? 'System Notification' : 'Attention Needed'}
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed px-1">
                  {actionMessage.text}
                </p>
              </div>

              {/* Friendly dismiss button */}
              <button
                type="button"
                onClick={() => setActionMessage(null)}
                className={`w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] border ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-400 text-black border-emerald-400 hover:bg-emerald-500'
                    : 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                }`}
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Trading Desk HUD */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 p-4 rounded-2xl border border-gray-800 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gray-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">Dashboard Balance</span>
              <span className="text-[8px] bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded font-mono">Naira</span>
            </div>
            <div className="text-xl font-black text-white font-mono leading-none">
              ₦{(user.balance || 0).toLocaleString()}
            </div>
          </div>
          <p className="text-[9px] text-gray-500 mt-3 font-medium flex items-center">
            chix9ja savings account
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#0c1e14] to-[#040806] p-4 rounded-2xl border border-emerald-500/20 shadow-[0_4px_24px_rgba(16,185,129,0.04)] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">Trading Desk Wallet</span>
              <span className="text-[8px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono">USD</span>
            </div>
            <div className="text-xl font-black text-white font-mono leading-none flex items-baseline gap-0.5">
              <span className="text-emerald-400 text-sm">$</span>
              {(user.tradeBalanceUsd || 0).toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] text-gray-400 mt-2.5 border-t border-emerald-950 pt-2">
            <span className="text-gray-500">Total Profit:</span>
            <span className="text-emerald-400 font-bold font-mono">+${(user.tradeProfitUsd || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Simplified, High-Legibility Subtabs */}
      <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-900 gap-1 shadow-inner">
        <button
          onClick={() => setActiveSubTab('trade')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'trade' 
              ? 'bg-emerald-400 text-black shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart4 size={12} />
          <span>Trading Desk</span>
        </button>
        <button
          onClick={() => setActiveSubTab('wallet')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'wallet' 
              ? 'bg-emerald-400 text-black shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Wallet size={12} />
          <span>Funds Hub</span>
        </button>
        <button
          onClick={() => setActiveSubTab('academy')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'academy' 
              ? 'bg-emerald-400 text-black shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen size={12} />
          <span>How It Works</span>
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'history' 
              ? 'bg-emerald-400 text-black shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Activity size={12} />
          <span>Ledger Logs</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeSubTab === 'trade' && (
        <>
          {/* Quick-Swap Interactive Drawer (Very easy to fund wallet right here!) */}
          <div className="bg-gradient-to-r from-emerald-950/20 via-black to-emerald-950/20 p-3 rounded-2xl border border-emerald-500/20 flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <Sparkles size={13} className="text-emerald-400" />
                <span className="text-[10px] font-extrabold uppercase text-gray-200 tracking-wider">Frictionless Wallet Funding</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowSwapInDesk(!showQuickSwap)}
                className="text-[9px] font-bold uppercase text-emerald-400 hover:underline flex items-center space-x-0.5"
              >
                <span>{showQuickSwap ? 'Hide Swapper' : 'Quick Swap Naira'}</span>
                <ChevronRight size={10} className={`transform transition-transform ${showQuickSwap ? 'rotate-90' : ''}`} />
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 leading-snug">
              Fund your USD Desk wallet using your local chix9ja Naira balance instantly. 1 USD = ₦1,500 NGN.
            </p>

            {showQuickSwap ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#040806]/85 border border-emerald-500/10 p-3 rounded-xl mt-1 space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-400 font-bold uppercase block tracking-wider">Naira to Convert</label>
                    <div className="relative">
                      <span className="absolute left-2.5 inset-y-0 flex items-center text-gray-500 text-xs font-bold">₦</span>
                      <input
                        type="number"
                        min="500"
                        className="w-full bg-black border border-gray-900 focus:border-emerald-500/50 rounded-lg py-1 px-2.5 pl-6 text-xs text-right text-white font-mono"
                        placeholder="5,000"
                        value={quickSwapNaira}
                        onChange={(e) => setQuickSwapNaira(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-400 font-bold uppercase block tracking-wider">Trading USD Received</label>
                    <div className="w-full bg-gray-950 border border-gray-900 rounded-lg py-1 px-2.5 text-xs text-right text-emerald-400 font-mono flex items-center justify-end h-[26px]">
                      ${(Number(quickSwapNaira || 0) / EXCHANGE_RATE).toFixed(2)} USD
                    </div>
                  </div>
                </div>

                {/* Predefined Quick Swap Presets */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { label: '₦1,500 ($1)', val: '1500' },
                    { label: '₦5,000 ($3.33)', val: '5000' },
                    { label: '₦15,000 ($10)', val: '15000' },
                    { label: '₦50,000 ($33.33)', val: '50000' }
                  ].map(preset => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setQuickSwapNaira(preset.val)}
                      className={`px-2 py-1 text-[8px] font-bold rounded-md font-mono border transition-all ${
                        quickSwapNaira === preset.val
                          ? 'bg-emerald-400 text-black border-emerald-400'
                          : 'bg-black text-gray-400 border-gray-900 hover:border-gray-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleFundTradeAccount(quickSwapNaira, true)}
                  className="w-full py-2 bg-emerald-400 text-black hover:bg-emerald-500 font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center space-x-1"
                >
                  <RefreshCw size={11} className="animate-spin-slow" />
                  <span>Execute Swap & Fund Now</span>
                </button>
              </motion.div>
            ) : null}
          </div>

          {/* Crypto selection grid */}
          <div className="bg-gray-950 p-3 rounded-2xl border border-gray-900 space-y-2">
            <span className="text-[9px] font-bold uppercase text-gray-500 tracking-wider block">Cryptocurrency Instruments</span>
            <div className="grid grid-cols-4 gap-2">
              {ASSETS.map(asset => {
                const isSelected = selectedAssetId === asset.id;
                const livePrice = prices[asset.id];
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className={`p-2.5 rounded-xl text-left border flex flex-col justify-between h-[75px] transition-all relative ${
                      isSelected 
                        ? 'bg-[#050e0a] border-emerald-500 ring-1 ring-emerald-500/30' 
                        : 'bg-black border-gray-900 hover:border-gray-800'
                    }`}
                  >
                    <span className={`text-[9px] font-black font-mono px-1 py-0.5 rounded leading-none w-fit ${
                      isSelected ? 'bg-emerald-400 text-black' : 'bg-gray-900 text-gray-300'
                    }`}>
                      {asset.icon}
                    </span>
                    <div className="mt-1">
                      <span className="text-[8px] text-gray-500 uppercase font-black block leading-none mb-0.5">Price</span>
                      <span className="text-[10px] font-bold font-mono text-gray-100 truncate w-full block">
                        ${livePrice ? livePrice.toLocaleString() : asset.basePrice}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upgraded Cyberpunk Trading Chart Section */}
          <div className="bg-black p-4 rounded-2xl border border-gray-900 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-1.5 overflow-hidden">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-gray-300 tracking-wider">{selectedAsset.name} Index</span>
              </div>
              
              {/* Dynamic Timeframe selector */}
              <div className="flex bg-gray-950 p-0.5 rounded-lg border border-gray-900">
                {(['1m', '5m', '15m', '1h', '1d'] as const).map(tf => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 text-[8px] font-bold font-mono rounded-md uppercase transition-all ${
                      timeframe === tf 
                        ? 'bg-emerald-400 text-black font-black' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Graph chart */}
            <div className="bg-gray-950 rounded-xl border border-gray-900/60 p-3 pt-4 relative overflow-hidden h-36">
              
              {/* Indicators bar */}
              <div className="absolute top-1 right-2 z-10 flex space-x-2 text-[8px] font-bold font-mono select-none">
                <button 
                  type="button"
                  onClick={() => setIndicators(prev => ({ ...prev, ma: !prev.ma }))}
                  className={`px-1.5 py-0.5 rounded transition-all ${indicators.ma ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/20' : 'text-gray-600'}`}
                >
                  MA(7)
                </button>
                <button 
                  type="button"
                  onClick={() => setIndicators(prev => ({ ...prev, ema: !prev.ema }))}
                  className={`px-1.5 py-0.5 rounded transition-all ${indicators.ema ? 'bg-amber-950 text-amber-400 border border-amber-500/20' : 'text-gray-600'}`}
                >
                  EMA(25)
                </button>
                <button 
                  type="button"
                  onClick={() => setIndicators(prev => ({ ...prev, bbands: !prev.bbands }))}
                  className={`px-1.5 py-0.5 rounded transition-all ${indicators.bbands ? 'bg-teal-950 text-teal-400 border border-teal-500/20' : 'text-gray-600'}`}
                >
                  B-Bands
                </button>
              </div>

              {/* Index metrics HUD inside chart */}
              <div className="absolute top-1 left-2.5 z-10 font-mono flex items-baseline gap-2">
                <span className="text-xs font-black text-emerald-400 text-glow-green">
                  ${currentAssetPrice?.toLocaleString()}
                </span>
                <span className="text-[8px] text-gray-500 uppercase">Live Index Trace</span>
              </div>

              {/* Plot Sparkline SVG */}
              <div ref={chartContainerRef} className="h-full w-full relative pt-4 overflow-visible">
                {chartData.length > 1 && (
                  <svg className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartZoneGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Bollinger Bands indicator overlay if enabled */}
                    {indicators.bbands && (
                      <path
                        d={chartData.map((val, idx) => {
                          const x = (idx / (chartData.length - 1)) * (chartContainerRef.current?.clientWidth || 300);
                          const deviation = chartRange * 0.15;
                          const yIdx = chartHeight - (((val + deviation) - minChartVal) / chartRange) * (chartHeight - 16);
                          return `${idx === 0 ? 'M' : 'L'} ${x},${Math.max(5, yIdx)}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#14b8a6"
                        strokeDasharray="2,3"
                        strokeWidth="1"
                        strokeOpacity="0.6"
                      />
                    )}

                    {/* Bollinger Bands Lower Indicator */}
                    {indicators.bbands && (
                      <path
                        d={chartData.map((val, idx) => {
                          const x = (idx / (chartData.length - 1)) * (chartContainerRef.current?.clientWidth || 300);
                          const deviation = chartRange * 0.15;
                          const yIdx = chartHeight - (((val - deviation) - minChartVal) / chartRange) * (chartHeight - 16);
                          return `${idx === 0 ? 'M' : 'L'} ${x},${Math.min(chartHeight, yIdx)}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#14b8a6"
                        strokeDasharray="2,3"
                        strokeWidth="1"
                        strokeOpacity="0.6"
                      />
                    )}

                    {/* Moving Average 7 overlay if enabled */}
                    {indicators.ma && (
                      <path
                        d={chartData.map((val, idx) => {
                          const x = (idx / (chartData.length - 1)) * (chartContainerRef.current?.clientWidth || 300);
                          // Smooth simulated moving average
                          const smoothedVal = idx > 0 ? (val + chartData[idx - 1]) / 2 : val;
                          const yIdx = chartHeight - ((smoothedVal - minChartVal) / chartRange) * (chartHeight - 16);
                          return `${idx === 0 ? 'M' : 'L'} ${x},${yIdx}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.2"
                        strokeOpacity="0.8"
                      />
                    )}

                    {/* Exponential Moving Average 25 if enabled */}
                    {indicators.ema && (
                      <path
                        d={chartData.map((val, idx) => {
                          const x = (idx / (chartData.length - 1)) * (chartContainerRef.current?.clientWidth || 300);
                          const emaval = idx > 1 ? (val * 0.4 + chartData[idx - 1] * 0.4 + chartData[idx - 2] * 0.2) : val;
                          const yIdx = chartHeight - ((emaval - minChartVal) / chartRange) * (chartHeight - 16);
                          return `${idx === 0 ? 'M' : 'L'} ${x},${yIdx}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.2"
                        strokeOpacity="0.8"
                      />
                    )}

                    {/* Glowing Area Fill */}
                    <path
                      d={`M 0,${chartHeight} ${chartData.map((val, idx) => {
                        const x = (idx / (chartData.length - 1)) * (chartContainerRef.current?.clientWidth || 300);
                        const y = chartHeight - ((val - minChartVal) / chartRange) * (chartHeight - 16);
                        return `L ${x},${y}`;
                      }).join(' ')} L ${chartContainerRef.current?.clientWidth || 300},${chartHeight} Z`}
                      fill="url(#chartZoneGlow)"
                    />

                    {/* Native Price Chart Vector Line */}
                    <path
                      d={chartData.map((val, idx) => {
                        const x = (idx / (chartData.length - 1)) * (chartContainerRef.current?.clientWidth || 300);
                        const y = chartHeight - ((val - minChartVal) / chartRange) * (chartHeight - 16);
                        return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />

                    {/* Live pinging node marker */}
                    <circle
                      cx={chartContainerRef.current?.clientWidth || 300}
                      cy={chartHeight - ((currentAssetPrice - minChartVal) / chartRange) * (chartHeight - 16)}
                      r="4"
                      fill="#10b981"
                      className="animate-ping"
                    />
                    <circle
                      cx={chartContainerRef.current?.clientWidth || 300}
                      cy={chartHeight - ((currentAssetPrice - minChartVal) / chartRange) * (chartHeight - 16)}
                      r="3.5"
                      fill="#10b981"
                      stroke="#000000"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Grid for ticker details */}
            <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono text-gray-500 bg-gray-950 p-2 rounded-xl">
              <div>
                <span className="block text-gray-600 font-extrabold uppercase text-[7px] tracking-wider">Interval</span>
                <span className="text-gray-300 font-bold uppercase">{timeframe} Feed</span>
              </div>
              <div className="border-x border-gray-900">
                <span className="block text-gray-600 font-extrabold uppercase text-[7px] tracking-wider">Vol (24h)</span>
                <span className="text-gray-350 font-bold">$1.84M USD</span>
              </div>
              <div>
                <span className="block text-gray-600 font-extrabold uppercase text-[7px] tracking-wider">Status</span>
                <span className="text-emerald-400 font-bold">● Match Sourced</span>
              </div>
            </div>
          </div>

          {/* Upgraded Professional Trade Ticket Entry */}
          <form onSubmit={handleOpenTrade} className="bg-gray-950 p-4.5 rounded-2xl border border-gray-900 space-y-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block font-mono">Contract Configuration</span>
            
            {/* BUY/LONG vs SELL/SHORT tabs with premium glowing borders */}
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-xl border border-gray-900">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`py-2 text-xs font-black rounded-lg uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                  tradeType === 'BUY' 
                    ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <TrendingUp size={13} />
                <span>Buy / Long</span>
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`py-2 text-xs font-black rounded-lg uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                  tradeType === 'SELL' 
                    ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)] font-black' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <TrendingDown size={13} />
                <span>Sell / Short</span>
              </button>
            </div>

            {/* Collateral Amount Input with Preset Tags */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <label className="text-gray-400 uppercase tracking-wide">Security Collateral ($)</label>
                <span className="font-mono text-gray-500 flex items-center gap-1">
                  Available: <strong className="text-white">${(user.tradeBalanceUsd || 0).toFixed(2)} USD</strong>
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 flex items-center text-gray-500 text-sm font-bold">$</span>
                <input
                  type="number"
                  required
                  min="2"
                  placeholder="20"
                  className="w-full bg-black border border-gray-900 focus:border-emerald-500 rounded-xl py-2.5 px-3 pl-7 text-sm font-mono text-white text-right"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                />
              </div>

              {/* Preset buttons for collateral to speed up entry */}
              <div className="flex gap-1.5 justify-between">
                {PRESET_AMOUNTS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTradeAmount(preset)}
                    className={`flex-1 py-1 text-[9px] font-mono font-bold rounded-lg border transition-all ${
                      tradeAmount === preset
                        ? 'bg-emerald-400 text-black border-emerald-400 font-extrabold'
                        : 'bg-black text-gray-400 border-gray-900 hover:border-gray-800'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart leverage slider with danger thresholds */}
            <div className="bg-black p-3 rounded-xl border border-gray-900 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wide block">Multiplier Ratio</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-extrabold transition-all duration-200 ${getLeverageColor(leverage)}`}>
                  {leverage}x Leverage
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="100"
                step="5"
                className="w-full accent-emerald-400 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
              />

              <div className="flex justify-between text-[8px] font-mono text-gray-600 px-0.5">
                <span>1x (Min)</span>
                <span>25x</span>
                <span>50x</span>
                <span>100x (Extreme)</span>
              </div>

              {/* Smart Leverage Risk warning Indicator */}
              <p className="text-[9px] font-medium leading-none text-gray-400 pt-1 text-center font-sans tracking-tight">
                Risk status: <strong className="text-gray-200">{getLeverageLabel(leverage)}</strong>
              </p>
            </div>

            {/* Clear estimate readout */}
            <div className="bg-gray-900/40 p-2.5 rounded-xl border border-gray-900 text-center font-mono text-[9px] text-gray-400 flex justify-between">
              <span>Simulated Position Size:</span>
              <span className="text-white font-extrabold font-mono">
                ${(parseFloat(tradeAmount || '0') * leverage).toFixed(2)} USD
              </span>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-1.5 ${
                tradeType === 'BUY' 
                  ? 'bg-emerald-400 text-black hover:bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.15)]' 
                  : 'bg-rose-500 text-white hover:bg-rose-600 shadow-[0_4px_16px_rgba(244,63,94,0.15)]'
              }`}
            >
              <Play size={12} fill="currentColor" />
              <span>Transact {tradeType} Contract</span>
            </button>
          </form>

          {/* Active Trades Panel */}
          <div className="bg-gray-950 p-3.5 rounded-2xl border border-gray-900 space-y-3">
            <div className="flex justify-between items-center bg-black/40 p-1 px-2.5 rounded-lg border border-gray-900">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wide block font-mono">Open Contracts ({activeTrades.length})</span>
              {activeTrades.length > 0 && (
                <span className="text-[8px] font-mono text-emerald-400 animate-pulse font-bold uppercase">Index tracking is live</span>
              )}
            </div>

            {activeTrades.length === 0 ? (
              <div className="bg-black py-9 text-center rounded-2xl border border-gray-900 space-y-2">
                <Icons.Lock size={24} className="text-gray-700 mx-auto" />
                <p className="text-xs font-bold text-gray-400">No active trading positions.</p>
                <p className="text-[9px] text-gray-650 max-w-xs mx-auto">Set your margin size, select Long/Short direction, and click Transact above to enter a trade!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTrades.map(trade => {
                  const pnl = calculatePnL(trade);
                  const isProfit = pnl >= 0;
                  const pricePercentDiff = ((trade.currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
                  const tradeAssetObj = ASSETS.find(a => a.id === trade.asset);

                  // Liquidation indicator metric threshold (it liquidates if PNL matches negative collateral)
                  const safetyMarginPercent = Math.max(0, 100 + (pnl / trade.amount) * 100);

                  return (
                    <div 
                      key={trade.id} 
                      className="bg-black border border-gray-900 rounded-2xl p-3.5 space-y-3 relative overflow-hidden"
                    >
                      {/* Sub-card decorative glass trace */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${trade.type === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                      {/* Line header */}
                      <div className="flex justify-between items-center relative z-10 pl-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                            trade.type === 'BUY' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                          }`}>
                            {trade.type === 'BUY' ? 'LONG' : 'SHORT'} {trade.leverage}x
                          </span>
                          <span className="text-xs font-extrabold text-white font-mono">{tradeAssetObj?.icon || trade.asset}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCloseTrade(trade.id)}
                          className="bg-gray-950 text-gray-300 hover:text-white hover:bg-gray-900 font-extrabold uppercase tracking-wide text-[9px] px-2.5 py-1 rounded-md border border-gray-850 flex items-center space-x-1 active:scale-95 transition-all"
                        >
                          <X size={10} />
                          <span>Close & Settle</span>
                        </button>
                      </div>

                      {/* Precise values ledger */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-900/50 text-left font-mono text-[9px] pl-1.5">
                        <div>
                          <span className="text-[7.5px] text-gray-500 uppercase block leading-none mb-1">Entry Index</span>
                          <span className="text-gray-200 font-bold block">${trade.entryPrice.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[7.5px] text-gray-500 uppercase block leading-none mb-1">Mark Price</span>
                          <span className="text-gray-200 font-extrabold block animate-pulse text-glow-green">${trade.currentPrice.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7.5px] text-gray-500 uppercase block leading-none mb-1">Margin Collateral</span>
                          <span className="text-gray-200 font-bold block">${trade.amount} USD</span>
                        </div>
                      </div>

                      {/* Visual Liquidation bar indicator */}
                      <div className="space-y-1 pl-1.5">
                        <div className="flex justify-between text-[7px] font-mono text-gray-650">
                          <span>Margin Level Progress</span>
                          <span className={safetyMarginPercent <= 25 ? 'text-rose-450 font-bold animate-pulse' : 'text-gray-500'}>
                            {safetyMarginPercent.toFixed(0)}% Left (Liq near)
                          </span>
                        </div>
                        <div className="w-full bg-gray-950 rounded-full h-1 overflow-hidden border border-gray-90c0">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              safetyMarginPercent <= 25 
                                ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                                : safetyMarginPercent <= 60 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-400'
                            }`} 
                            style={{ width: `${safetyMarginPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Display gain block */}
                      <div className="flex justify-between items-center bg-[#070b09] p-3.5 rounded-xl border border-gray-900 ml-1.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wide text-gray-400">Position Earnings (P&L)</span>
                        <div className="flex items-center space-x-1 font-mono text-xs font-black">
                          {isProfit ? <ArrowUpRight size={13} className="text-emerald-400" /> : <ArrowDownLeft size={13} className="text-rose-500" />}
                          <span className={isProfit ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                            {isProfit ? '+' : ''}${pnl.toFixed(2)} USD ({isProfit ? '+' : ''}{(pricePercentDiff * trade.leverage * (trade.type === 'BUY' ? 1 : -1)).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeSubTab === 'wallet' && (
        <div className="space-y-4.5">
          
          {/* Main info panel card */}
          <div className="bg-gradient-to-br from-emerald-950/20 to-black p-4.5 rounded-2xl border border-emerald-500/20 space-y-3.5 text-left">
            <h4 className="text-xs font-extrabold text-[#99f6e4] uppercase tracking-wider flex items-center space-x-2">
              <span className="p-1 rounded-md bg-emerald-400/10 text-emerald-400"><ShieldCheck size={14} /></span>
              <span>Unified Settlement Platform</span>
            </h4>
            <div className="space-y-2.5 text-[11px] text-gray-400 leading-relaxed font-sans">
              <p>
                To perform and capture trading opportunities on the live desk, you swap standard dashboard <strong className="text-white">Naira (₦)</strong> into trading <strong className="text-white">USD ($)</strong> immediately.
              </p>
              <div className="bg-black/60 p-2.5 rounded-xl border border-emerald-500/10 flex justify-between items-center text-center font-mono">
                <div>
                  <span className="text-[8px] text-gray-500 uppercase block mb-0.5">FX Sell Rate</span>
                  <span className="text-emerald-400 font-bold">1 USD = ₦1,500 NGN</span>
                </div>
                <div className="h-6 w-px bg-emerald-950" />
                <div>
                  <span className="text-[8px] text-gray-500 uppercase block mb-0.5">Instant settlement</span>
                  <span className="text-emerald-400 font-bold">₦0.00 Gas / Processing</span>
                </div>
              </div>
              <p>
                ⚖️ There is absolute liquidity. When you close or settle a contract on the desk, any starting margin and acquired profits are returned as USD inside your wallet. You cash these out straight back to Dashboard Naira at the same ₦1,500 rate with 1 click!
              </p>
            </div>
          </div>

          {/* Swap NGN to USD (Fund) */}
          <div className="bg-gray-950 p-4.5 rounded-2xl border border-gray-900 space-y-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block font-mono">Convert Naira to USD (Capitalize Wallet)</span>
            
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span className="font-bold uppercase tracking-wide">Swapping NGN</span>
                  <span className="font-mono text-gray-500 font-bold">Available: ₦{(user.balance || 0).toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center text-gray-500 text-xs font-bold">₦</span>
                  <input
                    type="number"
                    min="500"
                    placeholder="15,000"
                    className="w-full bg-black border border-gray-900 focus:border-emerald-500/50 rounded-xl py-2.5 px-3 pl-7 text-sm font-mono text-white text-right font-bold"
                    value={depositAmountNaira}
                    onChange={(e) => setDepositAmountNaira(e.target.value)}
                  />
                </div>
              </div>

              {depositAmountNaira && !isNaN(Number(depositAmountNaira)) && (
                <div className="bg-[#050f09]/90 py-2 px-3 rounded-lg text-center border border-emerald-500/10 text-xs font-semibold text-gray-300">
                  You will convert into: <span className="text-emerald-400 font-bold font-mono">${(Number(depositAmountNaira) / EXCHANGE_RATE).toFixed(2)} USD</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleFundTradeAccount(depositAmountNaira, false)}
                className="w-full py-3 bg-emerald-400 text-black hover:bg-emerald-500 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <RefreshCw size={13} className="animate-spin-slow" />
                <span>Instantly Convert & Fund USD Wallet</span>
              </button>
            </div>
          </div>

          {/* Swap USD back to Dashboard Naira */}
          <div className="bg-gray-950 p-4.5 rounded-2xl border border-gray-900 space-y-4">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block font-mono">Cashout USD to Naira (Dashboard Settlement)</span>
            
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-gray-450">
                  <span className="font-bold uppercase tracking-wide">USD Wallet Cashout ($)</span>
                  <button 
                    type="button" 
                    onClick={() => setWithdrawAmountUsd(((user.tradeBalanceUsd || 0) + (user.tradeProfitUsd || 0)).toFixed(2))}
                    className="text-[9px] text-[#22c55e] hover:underline uppercase font-extrabold font-mono"
                  >
                    Use MAX Balance ($[{( (user.tradeBalanceUsd || 0) + (user.tradeProfitUsd || 0) ).toFixed(2)}])
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center text-gray-500 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50"
                    className="w-full bg-black border border-gray-900 focus:border-rose-500/50 rounded-xl py-2.5 px-3 pl-6 text-sm font-mono text-white text-right font-bold"
                    value={withdrawAmountUsd}
                    onChange={(e) => setWithdrawAmountUsd(e.target.value)}
                  />
                </div>
              </div>

              {withdrawAmountUsd && !isNaN(Number(withdrawAmountUsd)) && (
                <div className="bg-[#050f09]/90 py-2 px-3 rounded-lg text-center border border-emerald-500/10 text-xs font-semibold text-gray-300">
                  You will secure instant credit: <span className="text-emerald-400 font-extrabold font-mono">₦{(Number(withdrawAmountUsd) * EXCHANGE_RATE).toLocaleString()} NGN</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleWithdrawTradeProfit}
                className="w-full py-3 bg-gradient-to-r from-gray-950 to-gray-900 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/10 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <ArrowUpRight size={13} />
                <span>Return Capital & Profits to Naira</span>
              </button>
            </div>
          </div>

          {/* Secure Trust Indicator */}
          <div className="bg-gradient-to-r from-gray-950 to-gray-900 p-3.5 rounded-xl border border-gray-900 flex items-center space-x-3 text-left">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">Licensed Decentralized Clearing</span>
              <p className="text-[9px] text-gray-500 font-sans leading-none mt-1">UX payments handle secure client assets under non-custodial sandbox codes.</p>
            </div>
          </div>

        </div>
      )}

      {/* Upgraded Detailed Visual Academy Help */}
      {activeSubTab === 'academy' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-950/20 to-black p-4.5 rounded-2xl border border-emerald-500/20 text-left">
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <Sparkles size={16} />
              <h3 className="text-xs font-black uppercase tracking-wide font-mono">How Trading Works in 3 Core Steps</h3>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              Futures Trading enables you to make money based on whether crypto prices go UP or DOWN. There are absolutely no physical assets transferred—you are trading on simulated index price margins.
            </p>
          </div>

          {/* Steps Timeline block */}
          <div className="space-y-3 relative text-left">
            {/* Connection trace */}
            <div className="absolute left-5.5 top-5 bottom-5 w-0.5 bg-gray-900" />

            {/* Step 1 */}
            <div className="bg-gray-950 p-4.5 rounded-2xl border border-gray-900 flex items-start space-x-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/30 font-black text-emerald-400 text-xs flex items-center justify-center shrink-0 font-mono">
                01
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Exchange Naira to USD trading Wallet</h4>
                <p className="text-[10.5px] text-gray-450 leading-relaxed">
                  Go to <strong className="text-gray-200">Funds Hub</strong> tab or use the <strong className="text-gray-200">Quick Swap</strong> drawer on the trading desk. Convert some Naira to USD. (Rates remain locked: <span className="font-mono text-emerald-400">1 USD = ₦1,500</span>).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-950 p-4.5 rounded-2xl border border-gray-900 flex items-start space-x-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/30 font-black text-indigo-400 text-xs flex items-center justify-center shrink-0 font-mono">
                02
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Enter Positions: Buy (Long) or Sell (Short)</h4>
                <p className="text-[10.5px] text-gray-455 leading-relaxed">
                  Choose a coin. Select <strong className="text-emerald-400">Buy</strong> if you forecast prices rising, or <strong className="text-rose-400">Sell</strong> if prices are falling. Your leverage determines how fast profits compound.
                </p>
                <div className="bg-black/60 p-2 rounded-lg text-[9.5px] text-gray-400 border border-gray-900 font-mono leading-normal">
                  <span className="text-emerald-400 font-extrabold block mb-0.5 mt-0.5">🚀 Leverage Compound Example:</span>
                  If you put in $10 USD collated with 50x leverage, your position behaves as if it is $500. A tiny 2% favorable move doubles your money to 100% profit (+$10 USD)!
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-950 p-4.5 rounded-2xl border border-gray-900 flex items-start space-x-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#3c142c] border border-rose-500/30 font-black text-rose-400 text-xs flex items-center justify-center shrink-0 font-mono">
                03
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Settle anytime & Cashout back to Naira</h4>
                <p className="text-[10.5px] text-gray-455 leading-relaxed">
                  Click <strong className="text-gray-200">Close Position</strong> whenever you are satisfied with the earnings. All starting margins and floating USD profit immediately settle to your trade balance. Go to the <strong className="text-gray-200">Funds Hub</strong> and cash out directly into standard Naira balance instantly!
                </p>
              </div>
            </div>
          </div>

          {/* Trade Risk Disclaimer */}
          <div className="bg-rose-950/10 p-4 rounded-xl border border-rose-500/10 text-left space-y-1">
            <h5 className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Trading Risk Advisory</h5>
            <p className="text-[10px] text-gray-500 leading-normal">
              High leverage speeds up liquidations if prices move opposite of your direction. Use smaller multipliers (like 10x or 15x) to verify and master the process safely first.
            </p>
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="space-y-4">
          
          {/* Win/Loss metrics overview */}
          <div className="grid grid-cols-3 gap-2 border border-gray-900 bg-gray-950/60 rounded-2xl p-2.5">
            <div className="bg-black p-3 rounded-xl border border-gray-900 text-center flex flex-col justify-between">
              <span className="text-[8px] font-bold text-gray-500 uppercase block tracking-wider">Indexed Deals</span>
              <span className="text-sm font-black text-white font-mono leading-none mt-1.5">{historicalTrades.length}</span>
            </div>
            <div className="bg-black p-3 rounded-xl border border-gray-900 text-center flex flex-col justify-between">
              <span className="text-[8px] font-bold text-gray-500 uppercase block tracking-wider">Win Ratio</span>
              <span className="text-sm font-black text-emerald-400 font-mono leading-none mt-1.5">
                {historicalTrades.length > 0 
                  ? `${Math.round((historicalTrades.filter(t => t.status === 'WIN').length / historicalTrades.length) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="bg-black p-3 rounded-xl border border-gray-900 text-center flex flex-col justify-between font-mono">
              <span className="text-[8px] font-bold text-gray-500 uppercase block tracking-wider">All P&L Profit</span>
              {(() => {
                const totalPnL = historicalTrades.reduce((sum, curr) => sum + curr.pnl, 0);
                const isPos = totalPnL >= 0;
                return (
                  <span className={`text-sm font-black leading-none mt-1.5 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? '+' : ''}${totalPnL.toFixed(2)}
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="bg-gray-950 p-4.5 rounded-2xl border border-gray-900 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-900 pb-2">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block font-mono">Contract Settlement Logs</span>
              {historicalTrades.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your trade history metrics?')) {
                      saveHistoricalTrades([]);
                    }
                  }}
                  className="text-[9px] text-rose-400 hover:text-rose-300 transition-colors uppercase font-bold"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {historicalTrades.length === 0 ? (
              <div className="bg-black py-11 text-center rounded-2xl border border-gray-900 space-y-2">
                <Activity size={24} className="text-gray-700 mx-auto" />
                <p className="text-xs font-bold text-gray-500">No trading logs recorded.</p>
                <p className="text-[9px] text-gray-650 max-w-xs mx-auto">Complete futures contracts on the desk desk view to populate records.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {historicalTrades.map((trade) => {
                  const isWin = trade.status === 'WIN';
                  const assetObj = ASSETS.find(a => a.id === trade.asset);
                  const formattedTime = new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const formattedDate = new Date(trade.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <div 
                      key={trade.id} 
                      className="bg-black border border-gray-900 rounded-xl p-3.5 space-y-2 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isWin 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                          }`}>
                            {trade.status}
                          </span>
                          <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wider">
                            ({trade.type} {trade.leverage}x)
                          </span>
                          <span className="text-xs font-bold text-white font-mono">{assetObj?.icon || trade.asset}</span>
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {formattedDate} {formattedTime}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-900/50 text-left font-mono text-[9px]">
                        <div>
                          <span className="text-[7.5px] text-gray-500 uppercase block mb-0.5 leading-none">Entry Index</span>
                          <span className="text-gray-300 font-bold block">${trade.entryPrice.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[7.5px] text-gray-500 uppercase block mb-0.5 leading-none">Settle Index</span>
                          <span className="text-gray-300 font-bold block">${trade.closePrice.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7.5px] text-gray-500 uppercase block mb-0.5 leading-none">Net PnL</span>
                          <span className={`font-black block ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isWin ? '+' : ''}${trade.pnl.toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default UXTrade;
