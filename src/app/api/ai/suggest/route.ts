import { NextRequest, NextResponse } from 'next/server';
import { getAISuggestion } from '@/lib/ai/minimax';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pair, currentPrice, smcLevels } = body;

    if (!pair || !currentPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: pair, currentPrice' },
        { status: 400 }
      );
    }

    const suggestion = await getAISuggestion(pair, currentPrice, smcLevels);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI suggestion' },
      { status: 500 }
    );
  }
}