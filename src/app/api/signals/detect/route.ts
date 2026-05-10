import { NextRequest, NextResponse } from 'next/server';
import type { OHLCV } from '@/lib/types';
import { detectSMCLevels } from '@/lib/smc/detector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body as { data: OHLCV[] };

    if (!data || !Array.isArray(data) || data.length < 20) {
      return NextResponse.json(
        { error: 'Insufficient data for SMC analysis' },
        { status: 400 }
      );
    }

    const smcAnalysis = detectSMCLevels(data);

    return NextResponse.json({
      success: true,
      ...smcAnalysis,
    });
  } catch (error) {
    console.error('SMC detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect SMC levels' },
      { status: 500 }
    );
  }
}