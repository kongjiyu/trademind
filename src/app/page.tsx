'use client';

import { useEffect, useState } from 'react';
import { useChartStore } from '@/lib/store';
import type { Timeframe } from '@/lib/types';
import Chart from '@/components/Chart/Chart';
import TradingPanel from '@/components/TradingPanel/TradingPanel';
import AIPanel from '@/components/AIPanel/AIPanel';
import TelegramSetup from '@/components/TelegramSetup/TelegramSetup';
import { detectSMCLevels } from '@/lib/smc/detector';

const PAIRS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
];

const TIMEFRAMES: Timeframe[] = ['15m', '1h', '4h', '1d'];

export default function Home() {
  const {
    pair,
    timeframe,
    ohlcvData,
    setPair,
    setTimeframe,
    setSMCLevels,
    setLoading,
    orderBlocks,
    fairValueGaps,
    liquidityZones,
  } = useChartStore();

  const [currentPrice, setCurrentPrice] = useState(0);

  // Detect SMC levels when data changes
  useEffect(() => {
    if (ohlcvData.length < 20) return;

    const analysis = detectSMCLevels(ohlcvData);
    setSMCLevels(
      analysis.orderBlocks.bullish.map((ob, i) => ({
        id: `bullish-ob-${i}`,
        type: 'bullish' as const,
        startTime: ob.time,
        endTime: ob.time + 3600,
        high: ob.high,
        low: ob.low,
        strength: 1,
      })),
      analysis.fvgs.map((fvg, i) => ({
        id: `fvg-${i}`,
        type: fvg.type as 'bullish' | 'bearish',
        startTime: fvg.time,
        endTime: fvg.time + 1800,
        high: fvg.high,
        low: fvg.low,
      })),
      analysis.swingPoints.map((sp, i) => ({
        id: `swing-${i}`,
        type: sp.type === 'high' ? 'swing_high' as const : 'swing_low' as const,
        time: sp.time,
        price: sp.price,
        volume: sp.strength,
      }))
    );

    // Update current price from latest candle
    if (ohlcvData.length > 0) {
      setCurrentPrice(ohlcvData[ohlcvData.length - 1].close);
    }
  }, [ohlcvData, setSMCLevels]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg" />
            <h1 className="text-xl font-bold">TradeMind</h1>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">
              AI-Powered
            </span>
          </div>

          {/* Pair Selector */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {PAIRS.map((p) => (
                <button
                  key={p.symbol}
                  onClick={() => setPair(p.symbol)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pair === p.symbol
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {p.symbol}
                </button>
              ))}
            </div>

            {/* Timeframe Selector */}
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Price Display */}
      <div className="border-b border-gray-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <span className="text-2xl font-bold">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-gray-400">
            {pair.split('/')[0]}/USDT
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: '500px' }}>
              <Chart pair={pair} timeframe={timeframe} />
            </div>

            {/* SMC Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500/30 border border-emerald-500 rounded" />
                <span className="text-gray-400">Order Blocks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/30 border border-blue-500 rounded" />
                <span className="text-gray-400">Fair Value Gaps</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 border-t-2 border-amber-500" />
                <span className="text-gray-400">Swing Highs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 border-t-2 border-purple-500" />
                <span className="text-gray-400">Swing Lows</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 border-t-2 border-yellow-500 border-dashed" />
                <span className="text-gray-400">BOS/CHoCH</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <TradingPanel currentPrice={currentPrice} />
            <AIPanel currentPrice={currentPrice} />
            <TelegramSetup />

            {/* Disclaimer */}
            <div className="bg-gray-900/50 rounded-lg p-3 text-xs text-gray-500">
              <p className="font-medium text-gray-400 mb-1">Disclaimer</p>
              <p>
                TradeMind is for educational purposes only. Not financial advice.
                Trading involves risk and you can lose money.
              </p>
            </div>
          </div>
        </div>

        {/* Paper Trading History */}
        {useChartStore.getState().paperTrades.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Paper Trading History</h3>
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-400">Date</th>
                    <th className="text-left px-4 py-2 text-gray-400">Pair</th>
                    <th className="text-left px-4 py-2 text-gray-400">Direction</th>
                    <th className="text-left px-4 py-2 text-gray-400">Entry</th>
                    <th className="text-left px-4 py-2 text-gray-400">TP</th>
                    <th className="text-left px-4 py-2 text-gray-400">SL</th>
                    <th className="text-left px-4 py-2 text-gray-400">Status</th>
                    <th className="text-right px-4 py-2 text-gray-400">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {useChartStore.getState().paperTrades.map((trade) => (
                    <tr key={trade.id} className="border-t border-gray-800">
                      <td className="px-4 py-2 text-gray-400">
                        {new Date(trade.openedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">{trade.pair}</td>
                      <td className={`px-4 py-2 ${trade.direction === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.direction.toUpperCase()}
                      </td>
                      <td className="px-4 py-2">${trade.entry}</td>
                      <td className="px-4 py-2">${trade.tp}</td>
                      <td className="px-4 py-2">${trade.sl}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          trade.status === 'open' ? 'bg-blue-900 text-blue-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right ${trade.pnl ? (trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400') : ''}`}>
                        {trade.pnl !== undefined ? `$${trade.pnl.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}