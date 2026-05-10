// Core types for TradeMind

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBlock {
  id: string;
  type: 'bullish' | 'bearish';
  startTime: number;
  endTime: number;
  high: number;
  low: number;
  strength: number;
}

export interface FairValueGap {
  id: string;
  type: 'bullish' | 'bearish';
  startTime: number;
  endTime: number;
  high: number;
  low: number;
}

export interface LiquidityZone {
  id: string;
  type: 'swing_high' | 'swing_low';
  time: number;
  price: number;
  volume: number;
}

export interface Signal {
  id: string;
  type: 'BOS' | 'CHoCH';
  direction: 'bullish' | 'bearish';
  time: number;
  price: number;
  description: string;
}

export interface TradingPair {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
}

export interface TradePlan {
  entry: number;
  takeProfit: number;
  stopLoss: number;
  direction: 'long' | 'short';
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PaperTrade {
  id: string;
  pair: string;
  direction: 'long' | 'short';
  entry: number;
  tp: number;
  sl: number;
  status: 'open' | 'closed';
  pnl?: number;
  openedAt: number;
  closedAt?: number;
}

export type Timeframe = '15m' | '1h' | '4h' | '1d';

export type SMCLevel = OrderBlock | FairValueGap | LiquidityZone;

// SMC Detection raw output (before conversion to chart format)
export interface SMCDetectionResult {
  orderBlocks: {
    bullish: OHLCV[];
    bearish: OHLCV[];
  };
  fvgs: {
    time: number;
    high: number;
    low: number;
    type: 'bullish' | 'bearish';
  }[];
  swingPoints: {
    time: number;
    price: number;
    type: 'high' | 'low';
    strength: number;
  }[];
  bosSignals: {
    type: 'BOS' | 'CHoCH';
    direction: 'bullish' | 'bearish';
    time: number;
    price: number;
    brokenLevel: number;
  }[];
}

// AI Suggestion with levels
export interface AISuggestion {
  direction: 'long' | 'short' | 'neutral';
  entry: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  smcConcepts: string[];
  keyLevels: {
    type: 'ob' | 'fvg' | 'liquidity' | 'bos';
    price: number;
    label: string;
  }[];
}