import type { OHLCV } from '../types';

/**
 * Detect Order Blocks - zones where institutional players have traded
 * Bullish OB: Last bearish candle before 2+ consecutive bullish candles
 * Bearish OB: Last bullish candle before 2+ consecutive bearish candles
 */
export function detectOrderBlocks(data: OHLCV[]): { bullish: OHLCV[]; bearish: OHLCV[] } {
  const bullish: OHLCV[] = [];
  const bearish: OHLCV[] = [];

  if (data.length < 5) return { bullish, bearish };

  for (let i = 2; i < data.length - 2; i++) {
    const curr = data[i];
    const prev = data[i - 1];
    const next1 = data[i + 1];
    const next2 = data[i + 2];

    // Check for bearish order block (last bearish before bullish momentum)
    if (curr.close < curr.open && next1.close > next1.open && next2.close > next2.open) {
      // Ensure prev was also bearish (strong institutional selling)
      if (prev.close < prev.open) {
        bullish.push(curr);
      }
    }

    // Check for bullish order block (last bullish before bearish momentum)
    if (curr.close > curr.open && next1.close < next1.open && next2.close < next2.open) {
      if (prev.close > prev.open) {
        bearish.push(curr);
      }
    }
  }

  return { bullish, bearish };
}

/**
 * Detect Fair Value Gaps (FVG) - imbalance zones
 * Formed when price gaps up/down between two candles
 */
export interface FVGCandidate {
  time: number;
  high: number;
  low: number;
  type: 'bullish' | 'bearish';
}

export function detectFVGs(data: OHLCV[]): FVGCandidate[] {
  const fvgs: FVGCandidate[] = [];

  if (data.length < 3) return fvgs;

  for (let i = 2; i < data.length; i++) {
    const curr = data[i];
    const prev = data[i - 1];
    const prevPrev = data[i - 2];

    // Bullish FVG: gap up - current low > prev high
    if (curr.low > prev.high) {
      fvgs.push({
        time: curr.time,
        high: curr.low,
        low: prev.high,
        type: 'bullish',
      });
    }

    // Bearish FVG: gap down - current high < prev low
    if (curr.high < prev.low) {
      fvgs.push({
        time: curr.time,
        high: prev.low,
        low: curr.high,
        type: 'bearish',
      });
    }
  }

  return fvgs;
}

/**
 * Detect swing highs and lows for liquidity zones
 */
export interface SwingPoint {
  time: number;
  price: number;
  type: 'high' | 'low';
  strength: number; // Based on volume
}

export function detectSwingPoints(data: OHLCV[], lookback: number = 5): SwingPoint[] {
  const points: SwingPoint[] = [];

  for (let i = lookback; i < data.length - lookback; i++) {
    const curr = data[i];
    let isHigh = true;
    let isLow = true;

    // Check if it's a swing high
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].high >= curr.high) {
        isHigh = false;
        break;
      }
    }

    // Check if it's a swing low
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].low <= curr.low) {
        isLow = false;
        break;
      }
    }

    if (isHigh) {
      points.push({
        time: curr.time,
        price: curr.high,
        type: 'high',
        strength: curr.volume,
      });
    }

    if (isLow) {
      points.push({
        time: curr.time,
        price: curr.low,
        type: 'low',
        strength: curr.volume,
      });
    }
  }

  return points;
}

/**
 * Detect Break of Structure (BOS) and Change of Character (CHoCH)
 */
export interface BOSSignal {
  type: 'BOS' | 'CHoCH';
  direction: 'bullish' | 'bearish';
  time: number;
  price: number;
  brokenLevel: number;
}

export function detectBOS(
  data: OHLCV[],
  swingPoints: SwingPoint[]
): BOSSignal[] {
  const signals: BOSSignal[] = [];

  // Find recent swing highs/lows
  const recentHighs = swingPoints
    .filter((p) => p.type === 'high')
    .slice(-3);
  const recentLows = swingPoints
    .filter((p) => p.type === 'low')
    .slice(-3);

  if (recentHighs.length >= 2 && recentLows.length >= 2) {
    // Check for bullish BOS (breaking above last swing high)
    const lastHigh = recentHighs[recentHighs.length - 1];
    const prevHigh = recentHighs[recentHighs.length - 2];

    // If price breaks above previous high with strength
    const currentPrice = data[data.length - 1].close;
    if (currentPrice > lastHigh.price && lastHigh.price > prevHigh.price) {
      signals.push({
        type: 'BOS',
        direction: 'bullish',
        time: data[data.length - 1].time,
        price: currentPrice,
        brokenLevel: lastHigh.price,
      });
    }

    // Check for bearish BOS (breaking below last swing low)
    const lastLow = recentLows[recentLows.length - 1];
    const prevLow = recentLows[recentLows.length - 2];

    if (currentPrice < lastLow.price && lastLow.price < prevLow.price) {
      signals.push({
        type: 'BOS',
        direction: 'bearish',
        time: data[data.length - 1].time,
        price: currentPrice,
        brokenLevel: lastLow.price,
      });
    }
  }

  return signals;
}

/**
 * Main SMC detection function
 */
export function detectSMCLevels(data: OHLCV[]) {
  const orderBlocks = detectOrderBlocks(data);
  const fvgs = detectFVGs(data);
  const swingPoints = detectSwingPoints(data);
  const bosSignals = detectBOS(data, swingPoints);

  return {
    orderBlocks,
    fvgs,
    swingPoints,
    bosSignals,
  };
}

export type SMCDetectionResult = ReturnType<typeof detectSMCLevels>;