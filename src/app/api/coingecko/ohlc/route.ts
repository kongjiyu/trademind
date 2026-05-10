import { NextRequest, NextResponse } from 'next/server';
import { getOHLCData, getCoinId, getDaysForTimeframe } from '@/lib/coingecko/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'BTC';
  const timeframe = searchParams.get('timeframe') || '1h';

  const coinId = getCoinId(symbol);
  const days = getDaysForTimeframe(timeframe);

  const data = await getOHLCData(coinId, days);

  return NextResponse.json({
    symbol,
    timeframe,
    data,
    timestamp: Date.now(),
  });
}