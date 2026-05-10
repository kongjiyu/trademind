import type { OHLCV, TradingPair } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Map timeframe to CoinGecko days (approximate)
function timeframeToDays(tf: string): number {
  switch (tf) {
    case '15m': return 1;
    case '1h': return 7;
    case '4h': return 30;
    case '1d': return 90;
    default: return 7;
  }
}

// CoinGecko doesn't support 15m directly, use hourly and aggregate
const TIMEFRAME_MAP: Record<string, string> = {
  '15m': 'minute',
  '1h': 'hourly',
  '4h': 'hourly',
  '1d': 'daily',
};

// Common trading pairs
export const TRADING_PAIRS: TradingPair[] = [
  { symbol: 'BTC', name: 'Bitcoin', currentPrice: 0, change24h: 0 },
  { symbol: 'ETH', name: 'Ethereum', currentPrice: 0, change24h: 0 },
  { symbol: 'SOL', name: 'Solana', currentPrice: 0, change24h: 0 },
];

export async function getMarketData(coinId: string) {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&community=false&developer=false`
    );
    if (!response.ok) throw new Error('Failed to fetch market data');
    const data = await response.json();

    return {
      currentPrice: data.market_data?.current_price?.usd || 0,
      change24h: data.market_data?.price_change_percentage_24h || 0,
      high24h: data.market_data?.high_24h?.usd || 0,
      low24h: data.market_data?.low_24h?.usd || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
    };
  } catch (error) {
    console.error('CoinGecko market data error:', error);
    return null;
  }
}

export async function getOHLCData(coinId: string, days: number = 7): Promise<OHLCV[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
    );

    if (!response.ok) throw new Error('Failed to fetch OHLC data');

    const data = await response.json();

    // CoinGecko returns [timestamp, open, high, low, close]
    return data.map((item: number[]) => ({
      time: Math.floor(item[0] / 1000), // Convert to seconds for TradingView
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: 0, // OHLC endpoint doesn't include volume
    }));
  } catch (error) {
    console.error('CoinGecko OHLC error:', error);
    return [];
  }
}

// For 15m data, we need to use the ohlc endpoint with more days and filter
export async function getMinuteOHLCData(coinId: string): Promise<OHLCV[]> {
  try {
    // Get 2 days of minute data (2880 points for 15m intervals)
    const response = await fetch(
      `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=2`
    );

    if (!response.ok) throw new Error('Failed to fetch minute OHLC data');
    const data = await response.json();

    // Filter for 15m intervals (every 4th point starting from appropriate offset)
    // CoinGecko minute data has 1-minute candles
    const ohlcv: OHLCV[] = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      // Only take every 15th candle to get ~15m data
      if (i % 15 === 0) {
        ohlcv.push({
          time: Math.floor(item[0] / 1000),
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
          volume: 0,
        });
      }
    }

    return ohlcv;
  } catch (error) {
    console.error('CoinGecko minute OHLC error:', error);
    return [];
  }
}

export function getCoinId(symbol: string): string {
  const map: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
  };
  return map[symbol] || symbol.toLowerCase();
}

export function getDaysForTimeframe(timeframe: string): number {
  switch (timeframe) {
    case '15m': return 2;
    case '1h': return 7;
    case '4h': return 30;
    case '1d': return 90;
    default: return 7;
  }
}