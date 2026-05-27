import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { User, Transaction } from '../types';
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
  Activity
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

const ASSETS = [
  { id: 'BTC-USD', name: 'Bitcoin / USD', basePrice: 68500, icon: 'BTC', volatility: 0.0015 },
  { id: 'ETH-USD', name: 'Ethereum / USD', basePrice: 3550, icon: 'ETH', volatility: 0.0025 },
  { id: 'SOL-USD', name: 'Solana / USD', basePrice: 165.5, icon: 'SOL', volatility: 0.004 },
  { id: 'CHIX-USD', name: 'chix9ja Token / USD', basePrice: 1.25, icon: 'CHIX', volatility: 0.008 },
];

const EXCHANGE_RATE = 1500; // 1 USD = 1,500 NGN

const UXTrade: React.FC<UXTradeProps> = ({ user, onUpdateUser, onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState<'trade' | 'wallet'>('trade');
  const [selectedAssetId, setSelectedAssetId] = useState('BTC-USD');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeAmount, setTradeAmount] = useState<string>('50');
  const [leverage, setLeverage] = useState<number>(10);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  
  // Wallet states
  const [depositAmountNaira, setDepositAmountNaira] = useState<string>('15000');
  const [withdrawAmountUsd, setWithdrawAmountUsd] = useState<string>('50');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Asset prices tracker
  const [prices, setPrices] = useState<Record<string, number>>(
    ASSETS.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.basePrice }), {})
  );

  // Chart state
  const [chartData, setChartData] = useState<number[]>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const selectedAsset = ASSETS.find(a => a.id === selectedAssetId) || ASSETS[0];
  const currentAssetPrice = prices[selectedAssetId];

  // Initialize trade items if present in localStorage to persist experience
  useEffect(() => {
    const saved = localStorage.getItem(`chix9ja_trades_${user.email.toLowerCase()}`);
    if (saved) {
      try {
        setActiveTrades(JSON.parse(saved));
      } catch (e) {
        console.warn('Could not restore trades:', e);
      }
    }
  }, [user.email]);

  // Save trades when they update
  const saveTrades = (newTrades: ActiveTrade[]) => {
    setActiveTrades(newTrades);
    localStorage.setItem(`chix9ja_trades_${user.email.toLowerCase()}`, JSON.stringify(newTrades));
  };

  // Simulating live ticking prices & price feedback
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const nextPrices = { ...prev };
        ASSETS.forEach(asset => {
          const current = prev[asset.id];
          const changePercent = (Math.random() - 0.49) * 2 * asset.volatility; // slight upwards bias
          nextPrices[asset.id] = parseFloat((current * (1 + changePercent)).toFixed(asset.id === 'CHIX-USD' ? 4 : 2));
        });
        return nextPrices;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Update open trades live and update chart live
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
      // Skip writing if basically unchanged to prevent hook loops, but update currentPrice
      const changed = JSON.stringify(updated) !== JSON.stringify(activeTrades);
      if (changed) {
        setActiveTrades(updated);
      }
    }
  }, [prices]);

  // Generate chart data on asset selection change
  useEffect(() => {
    // Generate some mock historical candles/lines
    const pts: number[] = [];
    let price = selectedAsset.basePrice;
    for (let i = 0; i < 20; i++) {
      price = price * (1 + (Math.random() - 0.5) * 2 * selectedAsset.volatility);
      pts.push(price);
    }
    setChartData(pts);
  }, [selectedAssetId]);

  // Tick the active chart with live current prices
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

  // Flash action helper
  const showFlash = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4500);
  };

  // 1. Funding standard UX-Trade USD balance from chix9ja Naira balance
  const handleFundTradeAccount = () => {
    const amtNaira = parseFloat(depositAmountNaira);
    if (!amtNaira || amtNaira < 500) {
      showFlash('error', 'Minimum funding amount is ₦500.');
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
      description: `Funded UX-Trade: exchanged ₦${amtNaira.toLocaleString()} to $${usdGained} USD.`,
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
    showFlash('success', `Exchanged ₦${amtNaira.toLocaleString()} for $${usdGained} USD. Trade Wallet is live!`);
    setDepositAmountNaira('');
  };

  // Convert/Withdraw Earned USD Trade profit to chix9ja Naira balance
  const handleWithdrawTradeProfit = () => {
    const amtUsd = parseFloat(withdrawAmountUsd);
    const availableUsdInProfit = user.tradeProfitUsd || 0;
    const availableUsdInTradeBalance = user.tradeBalanceUsd || 0;
    const totalAvailableUsd = parseFloat((availableUsdInProfit + availableUsdInTradeBalance).toFixed(2));

    if (!amtUsd || amtUsd <= 0) {
      showFlash('error', 'Please enter a valid USD amount to withdraw.');
      return;
    }

    if (amtUsd > totalAvailableUsd) {
      showFlash('error', `You only have $${totalAvailableUsd.toFixed(2)} USD in your UX-Trade accounts.`);
      return;
    }

    // Deduct first from profit, and then from main trade balance
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
      description: `UX-Trade Settlement: withdrew $${amtUsd} USD to Naira.`,
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
    showFlash('success', `Settled $${amtUsd} USD. Recieved ₦${nairaPayout.toLocaleString()} instantly into dashboard!`);
    setWithdrawAmountUsd('');
  };

  // 3. Opening a Trade position
  const handleOpenTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const tradeAmt = parseFloat(tradeAmount);
    const availableUsd = user.tradeBalanceUsd || 0;

    if (!tradeAmt || tradeAmt <= 0) {
      showFlash('error', 'Enter a valid trading amount in USD.');
      return;
    }

    if (tradeAmt > availableUsd) {
      showFlash('error', `Insufficient USD Trade wallet funds. You have $${availableUsd.toFixed(2)} USD. Go to 'Wallets' to exchange your Naira.`);
      return;
    }

    // Deduct amount from trade balance to secure margin
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

    showFlash('success', `Opened ${tradeType} status position on ${selectedAsset.name} at price $${currentAssetPrice}.`);
  };

  // Calculating position floating profit and loss
  const calculatePnL = (trade: ActiveTrade): number => {
    const priceDiff = trade.currentPrice - trade.entryPrice;
    const priceMovePercent = priceDiff / trade.entryPrice;
    
    // Profit multiplier: direction * price move * leverage * amount
    const directionMult = trade.type === 'BUY' ? 1 : -1;
    const finalPnL = directionMult * priceMovePercent * trade.leverage * trade.amount;
    
    // Cap loss at 100% of collateral (liquidated if goes below -100%)
    if (finalPnL <= -trade.amount) {
      return -trade.amount;
    }
    return parseFloat(finalPnL.toFixed(2));
  };

  // Closing a Trade
  const handleCloseTrade = (tradeId: string) => {
    const trade = activeTrades.find(t => t.id === tradeId);
    if (!trade) return;

    const pnl = calculatePnL(trade);
    const collateralReturned = trade.amount;
    const isLiquidated = pnl <= -trade.amount;

    // Remove from active list
    const remainingTrades = activeTrades.filter(t => t.id !== tradeId);
    saveTrades(remainingTrades);

    // If profit is positive, record tradeProfitUsd. 
    // If it is loss, deduct it from returned tradeBalanceUsd
    const prevUsdBalance = user.tradeBalanceUsd || 0;
    const prevProfitUsd = user.tradeProfitUsd || 0;

    let nextUsdBalance = prevUsdBalance;
    let nextProfitUsd = prevProfitUsd;

    if (pnl > 0) {
      // Gain: Return original collateral to trade balance, add profit to Earnings Wallet
      nextUsdBalance = parseFloat((prevUsdBalance + collateralReturned).toFixed(2));
      nextProfitUsd = parseFloat((prevProfitUsd + pnl).toFixed(2));
    } else {
      // Loss: Return whatever remaining collateral back to trade balance
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
      showFlash('error', `Position Liquidated! You lost your $${trade.amount} USD security margin.`);
    } else if (pnl >= 0) {
      showFlash('success', `Position Closed! Profit of +$${pnl.toFixed(2)} USD added to UX-Trade earnings.`);
    } else {
      showFlash('success', `Position Closed. Lost $${Math.abs(pnl).toFixed(2)} USD.`);
    }
  };

  // Sparkline generator for prices
  const minChartVal = Math.min(...chartData);
  const maxChartVal = Math.max(...chartData);
  const chartHeight = 80;
  const chartRange = maxChartVal - minChartVal || 1;

  return (
    <div className="px-4 py-4 space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* Top Banner Navigation Row */}
      <div className="flex items-center justify-between border-b border-gray-900 pb-3">
        <button 
          onClick={onBack}
          className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors"
        >
          <Icons.ArrowLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-widest font-mono">Back</span>
        </button>
        <div className="flex items-center space-x-2 bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-800">
          <Activity size={14} className="text-green-glow animate-pulse" />
          <span className="text-xs font-bold text-glow-green text-green-glow font-mono uppercase tracking-widest">UX-Trade Live</span>
        </div>
      </div>

      {/* Floating alert */}
      {actionMessage && (
        <div className={`p-3 rounded-xl border flex items-center space-x-2 animate-in fade-in slide-in-from-top-3 ${
          actionMessage.type === 'success' 
            ? 'bg-green-glow/10 border-green-glow/30 text-green-glow' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <p className="text-xs font-bold leading-snug">{actionMessage.text}</p>
        </div>
      )}

      {/* Balance HUD */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 p-3.5 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-0.5">Naira Balance</span>
            <div className="text-lg font-black text-white font-mono leading-none">
              ₦{(user.balance || 0).toLocaleString()}
            </div>
          </div>
          <span className="text-[9px] text-gray-600 mt-2 font-mono">Main chix9ja Dashboard</span>
        </div>

        <div className="bg-gradient-to-br from-gray-950 to-gray-900 p-3.5 rounded-2xl border border-green-glow/20 shadow-[0_4px_12px_rgba(34,197,94,0.05)] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-green-glow text-glow-green tracking-widest block mb-0.5">Trade Balance (USD)</span>
            <div className="text-lg font-black text-white font-mono leading-none flex items-baseline">
              <span className="text-green-glow">$</span>
              {(user.tradeBalanceUsd || 0).toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] text-gray-400 mt-2 font-mono border-t border-gray-900 pt-1.5">
            <span>Earnings:</span>
            <span className="text-green-glow font-bold">${(user.tradeProfitUsd || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
        <button
          onClick={() => setActiveSubTab('trade')}
          className={`w-1/2 py-2 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'trade' 
              ? 'bg-green-glow text-black font-black' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Trading Desk</span>
        </button>
        <button
          onClick={() => setActiveSubTab('wallet')}
          className={`w-1/2 py-2 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeSubTab === 'wallet' 
              ? 'bg-green-glow text-black font-black' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Wallet size={14} />
          <span>Wallets / Cashout</span>
        </button>
      </div>

      {activeSubTab === 'trade' && (
        <>
          {/* Market Assets Panel */}
          <div className="bg-gray-950 p-3.5 rounded-2xl border border-gray-800 space-y-3">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Select Crypto Asset</span>
            <div className="grid grid-cols-4 gap-1.5">
              {ASSETS.map(asset => {
                const isSelected = selectedAssetId === asset.id;
                const livePrice = prices[asset.id];
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className={`p-2 rounded-xl text-left border flex flex-col justify-between h-20 transition-all ${
                      isSelected 
                        ? 'bg-green-glow/10 border-green-glow ring-1 ring-green-glow/50' 
                        : 'bg-black border-gray-900 hover:border-gray-800'
                    }`}
                  >
                    <span className="text-[10px] font-black text-white font-mono">{asset.icon}</span>
                    <div className="mt-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tight block">Price</span>
                      <span className="text-[10px] font-bold font-mono text-gray-100 truncate w-full block">
                        ${livePrice?.toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Simulated Dynamic Line Chart */}
            <div className="bg-black p-3 rounded-xl border border-gray-900 relative">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[9px] font-black uppercase text-gray-600 tracking-wider">Live {selectedAsset.name} Index</span>
                <span className="text-xs font-black text-green-glow font-mono text-glow-green animate-pulse">
                  ${currentAssetPrice?.toLocaleString()}
                </span>
              </div>
              
              {/* Plot Sparkline SVG */}
              <div ref={chartContainerRef} className="h-20 w-full relative pt-2">
                {chartData.length > 1 && (
                  <svg className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Glow Area */}
                    <path
                      d={`M 0,${chartHeight} ${chartData.map((val, idx) => {
                        const x = (idx / (chartData.length - 1)) * (chartContainerRef.current?.clientWidth || 300);
                        const y = chartHeight - ((val - minChartVal) / chartRange) * (chartHeight - 14);
                        return `L ${x},${y}`;
                      }).join(' ')} L ${chartContainerRef.current?.clientWidth || 300},${chartHeight} Z`}
                      fill="url(#chartGlow)"
                    />
                    {/* Stock Line Trace */}
                    <path
                      d={chartData.map((val, idx) => {
                        const x = (idx / (chartData.length - 1)) * (chartContainerRef.current?.clientWidth || 300);
                        const y = chartHeight - ((val - minChartVal) / chartRange) * (chartHeight - 14);
                        return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Live price dot marker at absolute end */}
                    <circle
                      cx={chartContainerRef.current?.clientWidth || 300}
                      cy={chartHeight - ((currentAssetPrice - minChartVal) / chartRange) * (chartHeight - 14)}
                      r="4.5"
                      fill="#22c55e"
                      className="animate-ping"
                    />
                    <circle
                      cx={chartContainerRef.current?.clientWidth || 300}
                      cy={chartHeight - ((currentAssetPrice - minChartVal) / chartRange) * (chartHeight - 14)}
                      r="3"
                      fill="#22c55e"
                      stroke="#000000"
                      strokeWidth="1"
                    />
                  </svg>
                )}
              </div>
              
              <div className="flex justify-between text-[8px] text-gray-500 font-mono mt-1 pt-1 border-t border-gray-950">
                <span>20 mins ago</span>
                <span>REAL-TIME SENSORS Ticking</span>
                <span>LIVE FEED</span>
              </div>
            </div>
          </div>

          {/* Place Order Panel */}
          <form onSubmit={handleOpenTrade} className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-4">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Configure Futures Contract</span>
            
            {/* BUY or SELL Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-xl border border-gray-900">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`py-2 text-xs font-black rounded-lg uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                  tradeType === 'BUY' 
                    ? 'bg-green-glow text-black font-black' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <TrendingUp size={14} />
                <span>Buy / Long</span>
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`py-2 text-xs font-black rounded-lg uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                  tradeType === 'SELL' 
                    ? 'bg-red-500 text-white font-black' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                <TrendingDown size={14} />
                <span>Sell / Short</span>
              </button>
            </div>

            {/* Input Margins */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Trade Position ($)</label>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    required
                    min={5}
                    placeholder="50"
                    className="w-full bg-black border border-gray-900 focus:border-green-glow rounded-xl py-2 px-3 pl-6 text-sm font-mono text-white text-right"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Leverage Ratio</label>
                  <span className="text-[10px] text-green-glow font-black font-mono">{leverage}x</span>
                </div>
                <div className="flex bg-black items-center h-[38px] border border-gray-900 rounded-xl px-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="5"
                    className="w-full accent-green-glow h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 ${
                tradeType === 'BUY' 
                  ? 'bg-green-glow text-black hover:bg-green-dark' 
                  : 'bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.2)]'
              }`}
            >
              <Play size={14} fill="currentColor" />
              <span>Transact {tradeType} Position</span>
            </button>
          </form>

          {/* Active Trades Panel */}
          <div className="bg-gray-950 p-3.5 rounded-2xl border border-gray-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Open Futures Contracts ({activeTrades.length})</span>
              {activeTrades.length > 0 && (
                <span className="text-[9px] font-mono text-gray-600 uppercase">Interactive simulation</span>
              )}
            </div>

            {activeTrades.length === 0 ? (
              <div className="bg-black py-8 text-center rounded-xl border border-gray-900 space-y-2">
                <Icons.Lock size={28} className="text-gray-700 mx-auto" />
                <p className="text-xs font-bold text-gray-500">No contracts currently active.</p>
                <p className="text-[10px] text-gray-600">Enter a margin amount above and buy/sell to begin.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTrades.map(trade => {
                  const pnl = calculatePnL(trade);
                  const isProfit = pnl >= 0;
                  const pricePercentDiff = ((trade.currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
                  const tradeAssetObj = ASSETS.find(a => a.id === trade.asset);

                  return (
                    <div 
                      key={trade.id} 
                      className="bg-black border border-gray-900 rounded-xl p-3 space-y-2.5 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gray-900/10 rounded-full blur-xl pointer-events-none" />
                      
                      {/* Header line */}
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            trade.type === 'BUY' 
                              ? 'bg-green-glow/10 text-green-glow border border-green-glow/20' 
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {trade.type} {trade.leverage}x
                          </span>
                          <span className="text-xs font-black text-white font-mono">{tradeAssetObj?.icon}</span>
                        </div>
                        <button
                          onClick={() => handleCloseTrade(trade.id)}
                          className="bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-all font-black uppercase tracking-wider text-[9px] px-2.5 py-1 rounded-md border border-gray-800 flex items-center space-x-1"
                        >
                          <X size={10} />
                          <span>Close / Settle</span>
                        </button>
                      </div>

                      {/* Info data row */}
                      <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-gray-950 text-left relative z-10 font-mono">
                        <div>
                          <span className="text-[8px] text-gray-600 uppercase block">Entry</span>
                          <span className="text-[10px] text-gray-300 font-bold block">${trade.entryPrice.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-600 uppercase block">Index Mark</span>
                          <span className="text-[10px] text-gray-300 font-bold block animate-pulse">${trade.currentPrice.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-gray-600 uppercase block">Collateral</span>
                          <span className="text-[10px] text-gray-300 font-bold block">${trade.amount} USD</span>
                        </div>
                      </div>

                      {/* Earnings display metric */}
                      <div className="flex justify-between items-center bg-gray-950 p-2 rounded-lg border border-gray-900/50 relative z-10">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Position P&L</span>
                        <div className="flex items-center space-x-1 font-mono text-xs font-black">
                          {isProfit ? <ArrowUpRight size={13} className="text-green-glow" /> : <ArrowDownLeft size={13} className="text-red-500" />}
                          <span className={isProfit ? 'text-green-glow' : 'text-red-400'}>
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
        <div className="space-y-4">
          
          {/* Quick Info Box */}
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-900 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center space-x-2">
              <span className="p-1 rounded bg-green-glow/10 text-green-glow"><Activity className="text-green-glow" size={14} /></span>
              <span>UX-Trade Protocol Mechanics</span>
            </h4>
            <div className="space-y-2 text-[11px] text-gray-400 leading-relaxed font-sans">
              <p>
                ⚡ Exchange standard dashboard Naira (₦) for USD (<span className="text-green-glow font-bold">$</span>) to start executing futures contracts on the crypto desk.
              </p>
              <p>
                ⚖️ Exchange Rate: <strong className="text-white font-mono">1.00 USD = ₦1,500 NGN</strong>
              </p>
              <p>
                📈 Any amount or profit you earn from trading is deposited inside your profit/trade balance. You get instant Naira cashouts straight into your chix9ja main balance.
              </p>
            </div>
          </div>

          {/* Top up account: convert NGN to USD */}
          <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-4">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Fund Futures Wallet (Naira ➔ USD)</span>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Naira to Convert (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center text-gray-400 text-xs font-bold">₦</span>
                  <input
                    type="number"
                    min={500}
                    placeholder="15,000"
                    className="w-full bg-black border border-gray-900 focus:border-green-glow rounded-xl py-2 px-3 pl-8 text-sm font-mono text-white text-right"
                    value={depositAmountNaira}
                    onChange={(e) => setDepositAmountNaira(e.target.value)}
                  />
                </div>
              </div>

              {depositAmountNaira && !isNaN(Number(depositAmountNaira)) && (
                <div className="bg-black p-2 rounded-lg text-center border border-gray-900 text-xs font-bold text-gray-400">
                  You will receive: <span className="text-green-glow font-mono">${(Number(depositAmountNaira) / EXCHANGE_RATE).toFixed(2)} USD</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleFundTradeAccount}
                className="w-full py-3 bg-green-glow text-black hover:bg-green-dark rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center space-x-1.5"
              >
                <RefreshCw size={13} className="animate-spin-slow" />
                <span>Instantly Convert & Fund Wallet</span>
              </button>
            </div>
          </div>

          {/* Cash out/Withdraw USD to Dashboard Naira */}
          <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-4">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block font-mono">Collect Earnings (USD ➔ Naira)</span>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">USD Amount to Cash Out ($)</label>
                  <button 
                    type="button" 
                    onClick={() => setWithdrawAmountUsd(((user.tradeBalanceUsd || 0) + (user.tradeProfitUsd || 0)).toFixed(2))}
                    className="text-[9px] text-green-glow hover:underline uppercase font-bold"
                  >
                    Max
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 inset-y-0 flex items-center text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50"
                    className="w-full bg-black border border-gray-900 focus:border-green-glow rounded-xl py-2 px-3 pl-6 text-sm font-mono text-white text-right"
                    value={withdrawAmountUsd}
                    onChange={(e) => setWithdrawAmountUsd(e.target.value)}
                  />
                </div>
              </div>

              {withdrawAmountUsd && !isNaN(Number(withdrawAmountUsd)) && (
                <div className="bg-black p-2 rounded-lg text-center border border-gray-900 text-xs font-bold text-gray-400">
                  You will get paid: <span className="text-green-glow font-mono">₦{(Number(withdrawAmountUsd) * EXCHANGE_RATE).toLocaleString()} NGN</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleWithdrawTradeProfit}
                className="w-full py-3 bg-black border border-green-glow/50 text-green-glow hover:bg-green-glow/10 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-1.5"
              >
                <ArrowUpRight size={14} />
                <span>Withdraw to chix9ja Balance</span>
              </button>
            </div>
          </div>

          {/* Visual card mimicking safety certificates */}
          <div className="bg-gradient-to-r from-gray-950 to-gray-900 p-3.5 rounded-xl border border-gray-850 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Icons.ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500">Licensed Settlement Protocol</span>
              <p className="text-[10px] text-gray-500 font-sans leading-none mt-1">UX-Trade index leverages decentralised, tamper-proof security sensors.</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default UXTrade;
