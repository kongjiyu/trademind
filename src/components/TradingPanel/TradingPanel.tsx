'use client';

import { useState } from 'react';
import { useChartStore } from '@/lib/store';
import type { TradePlan } from '@/lib/types';

interface TradingPanelProps {
  currentPrice?: number;
  onSubmitPlan?: (plan: TradePlan) => void;
}

export default function TradingPanel({ currentPrice = 0, onSubmitPlan }: TradingPanelProps) {
  const { openTrade, addPaperTrade } = useChartStore();

  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entry, setEntry] = useState('');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const plan: TradePlan = {
      direction,
      entry: parseFloat(entry),
      takeProfit: parseFloat(tp),
      stopLoss: parseFloat(sl),
    };

    addPaperTrade({
      id: Date.now().toString(),
      pair: 'BTC/USDT',
      direction: plan.direction,
      entry: plan.entry,
      tp: plan.takeProfit,
      sl: plan.stopLoss,
      status: 'open',
      openedAt: Date.now(),
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Reset form
    setEntry('');
    setTp('');
    setSl('');

    onSubmitPlan?.(plan);
  };

  const calculateRiskReward = () => {
    const e = parseFloat(entry);
    const t = parseFloat(tp);
    const s = parseFloat(sl);

    if (!e || !t || !s) return null;

    const risk = Math.abs(e - s);
    const reward = Math.abs(t - e);
    const rr = reward / risk;

    return rr.toFixed(2);
  };

  const rr = calculateRiskReward();

  return (
    <div className="bg-gray-900 rounded-lg p-4 text-white">
      <h3 className="text-lg font-semibold mb-4">Trade Plan</h3>

      {openTrade && (
        <div className="mb-4 p-3 bg-emerald-900/50 rounded-lg border border-emerald-700">
          <p className="text-sm text-emerald-400">Open Trade</p>
          <p className="font-medium">
            {openTrade.direction.toUpperCase()} @ ${openTrade.entry}
          </p>
          <p className="text-xs text-gray-400">
            TP: ${openTrade.tp} | SL: ${openTrade.sl}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection('long')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              direction === 'long'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => setDirection('short')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              direction === 'short'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Short
          </button>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Entry Price</label>
          <input
            type="number"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder={currentPrice ? currentPrice.toString() : 'Enter entry'}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            step="any"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Take Profit</label>
          <input
            type="number"
            value={tp}
            onChange={(e) => setTp(e.target.value)}
            placeholder="TP price"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            step="any"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Stop Loss</label>
          <input
            type="number"
            value={sl}
            onChange={(e) => setSl(e.target.value)}
            placeholder="SL price"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
            step="any"
            required
          />
        </div>

        {rr && (
          <div className={`text-sm px-3 py-2 rounded-lg ${
            parseFloat(rr) >= 2 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'
          }`}>
            Risk/Reward: 1:{rr} {parseFloat(rr) < 2 ? '(Aim for 1:2+)' : '(Good)'}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-medium transition-colors"
        >
          {openTrade ? 'Update Trade' : 'Open Paper Trade'}
        </button>

        {showSuccess && (
          <p className="text-sm text-emerald-400 text-center">
            Trade opened successfully!
          </p>
        )}
      </form>
    </div>
  );
}