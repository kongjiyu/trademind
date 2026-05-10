import { create } from 'zustand';
import type { OHLCV, OrderBlock, FairValueGap, LiquidityZone, Signal, Timeframe, PaperTrade, TradingPair } from './types';

interface ChartState {
  // Current data
  pair: string;
  timeframe: Timeframe;
  ohlcvData: OHLCV[];
  isLoading: boolean;

  // SMC signals
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  liquidityZones: LiquidityZone[];
  signals: Signal[];

  // UI state
  selectedLevels: string[];

  // Paper trading
  paperTrades: PaperTrade[];
  openTrade: PaperTrade | null;

  // Actions
  setPair: (pair: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  setOHLCVData: (data: OHLCV[]) => void;
  setLoading: (loading: boolean) => void;
  setSMCLevels: (orderBlocks: OrderBlock[], fvgs: FairValueGap[], liquidityZones: LiquidityZone[]) => void;
  setSignals: (signals: Signal[]) => void;
  toggleLevelSelection: (id: string) => void;
  addPaperTrade: (trade: PaperTrade) => void;
  closeTrade: (id: string, pnl: number) => void;
  resetOpenTrade: () => void;
}

export const useChartStore = create<ChartState>((set) => ({
  pair: 'BTC/USDT',
  timeframe: '1h',
  ohlcvData: [],
  isLoading: false,
  orderBlocks: [],
  fairValueGaps: [],
  liquidityZones: [],
  signals: [],
  selectedLevels: [],
  paperTrades: [],
  openTrade: null,

  setPair: (pair) => set({ pair }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setOHLCVData: (ohlcvData) => set({ ohlcvData }),
  setLoading: (isLoading) => set({ isLoading }),
  setSMCLevels: (orderBlocks, fairValueGaps, liquidityZones) =>
    set({ orderBlocks, fairValueGaps, liquidityZones }),
  setSignals: (signals) => set({ signals }),
  toggleLevelSelection: (id) =>
    set((state) => ({
      selectedLevels: state.selectedLevels.includes(id)
        ? state.selectedLevels.filter((x) => x !== id)
        : [...state.selectedLevels, id],
    })),
  addPaperTrade: (trade) =>
    set((state) => ({
      paperTrades: [...state.paperTrades, trade],
      openTrade: trade,
    })),
  closeTrade: (id, pnl) =>
    set((state) => ({
      paperTrades: state.paperTrades.map((t) =>
        t.id === id ? { ...t, status: 'closed' as const, pnl, closedAt: Date.now() } : t
      ),
      openTrade: null,
    })),
  resetOpenTrade: () => set({ openTrade: null }),
}));

// Telegram settings store
interface TelegramState {
  botToken: string;
  chatId: string;
  isConnected: boolean;
  setBotToken: (token: string) => void;
  setChatId: (chatId: string) => void;
  setConnected: (connected: boolean) => void;
}

export const useTelegramStore = create<TelegramState>((set) => ({
  botToken: '',
  chatId: '',
  isConnected: false,
  setBotToken: (botToken) => set({ botToken }),
  setChatId: (chatId) => set({ chatId }),
  setConnected: (isConnected) => set({ isConnected }),
}));

// AI chat store
interface AIState {
  messages: { role: 'user' | 'assistant'; content: string }[];
  isThinking: boolean;
  addMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  clearMessages: () => void;
  setThinking: (thinking: boolean) => void;
}

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  isThinking: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  setThinking: (isThinking) => set({ isThinking }),
}));