// MiniMax API client for AI trading suggestions

interface MiniMaxMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  suggestion: string;
  entry: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  reasoning: string;
  smcConcepts: string[];
}

export async function getAISuggestion(
  pair: string,
  currentPrice: number,
  smcLevels: {
    orderBlocks: { bullish: any[]; bearish: any[] };
    fvgs: any[];
    swingPoints: any[];
    bosSignals: any[];
  }
): Promise<AIResponse> {
  const apiKey = process.env.MINIMAX_API_KEY || process.env.NEXT_PUBLIC_MINIMAX_API_KEY;

  if (!apiKey) {
    return {
      suggestion: 'Demo mode - MiniMax API key not configured',
      entry: null,
      takeProfit: null,
      stopLoss: null,
      reasoning: 'Please set MINIMAX_API_KEY in your environment variables.',
      smcConcepts: [],
    };
  }

  const prompt = buildSMCAnalysisPrompt(pair, currentPrice, smcLevels);

  try {
    const response = await fetch('https://api.minimax.chat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          {
            role: 'system',
            content: `You are a crypto trading analyst specializing in Smart Money Concept (SMC).
You analyze price action, identify institutional trading zones, and provide clear trading recommendations.
Always explain your reasoning using SMC terminology.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return parseAIResponse(content);
  } catch (error) {
    console.error('MiniMax API error:', error);
    return {
      suggestion: 'Error connecting to AI service',
      entry: null,
      takeProfit: null,
      stopLoss: null,
      reasoning: 'Failed to get AI response. Please try again.',
      smcConcepts: [],
    };
  }
}

export async function getUserPlanFeedback(
  userPlan: { entry: number; tp: number; sl: number; direction: 'long' | 'short' },
  aiSuggestion: { entry: number; takeProfit: number; stopLoss: number },
  pair: string,
  currentPrice: number
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY || process.env.NEXT_PUBLIC_MINIMAX_API_KEY;

  if (!apiKey) {
    return 'Demo mode - MiniMax API key not configured. Set MINIMAX_API_KEY to enable AI feedback.';
  }

  const prompt = `Analyze this user's trading plan for ${pair} at current price $${currentPrice}:

User's Plan:
- Direction: ${userPlan.direction.toUpperCase()}
- Entry: $${userPlan.entry}
- Take Profit: $${userPlan.tp}
- Stop Loss: $${userPlan.sl}

AI Suggestion (for reference):
- Entry: $${aiSuggestion.entry || 'N/A'}
- Take Profit: $${aiSuggestion.takeProfit || 'N/A'}
- Stop Loss: $${aiSuggestion.stopLoss || 'N/A'}

Compare the user's plan against SMC best practices. Identify:
1. Is the entry level reasonable given current market structure?
2. Is the risk/reward ratio at least 1:2?
3. Are TP/SL levels aligned with key SMC zones (order blocks, FVGs, liquidity)?
4. Any specific improvements suggested?

Provide concise, actionable feedback.`;

  try {
    const response = await fetch('https://api.minimax.chat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          {
            role: 'system',
            content: 'You are a trading coach providing feedback on user trading plans. Be direct and educational.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No feedback available.';
  } catch (error) {
    console.error('AI feedback error:', error);
    return 'Failed to get AI feedback. Please try again.';
  }
}

function buildSMCAnalysisPrompt(
  pair: string,
  currentPrice: number,
  smcLevels: any
): string {
  const { orderBlocks, fvgs, swingPoints, bosSignals } = smcLevels;

  return `Analyze ${pair} at current price $${currentPrice}.

Current SMC Analysis:
- Bullish Order Blocks: ${orderBlocks.bullish.length} detected
- Bearish Order Blocks: ${orderBlocks.bearish.length} detected
- Fair Value Gaps: ${fvgs.length} detected
- Swing Highs: ${swingPoints.filter((p: any) => p.type === 'high').length}
- Swing Lows: ${swingPoints.filter((p: any) => p.type === 'low').length}
- BOS Signals: ${bosSignals.length}

Based on this SMC analysis, provide:
1. Current market structure (bullish/bearish/neutral)
2. Key trade setup if any (entry, TP, SL)
3. Primary SMC concept being utilized
4. Risk/reward assessment

Keep response concise and actionable.`;
}

function parseAIResponse(content: string): AIResponse {
  // Try to extract numbers from the response
  const entryMatch = content.match(/entry[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)/i);
  const tpMatch = content.match(/tp|take\s*profit[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)/i);
  const slMatch = content.match(/sl|stop\s*loss[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)/i);

  const entry = entryMatch ? parseFloat(entryMatch[1].replace(',', '')) : null;
  const takeProfit = tpMatch ? parseFloat(tpMatch[1].replace(',', '')) : null;
  const stopLoss = slMatch ? parseFloat(slMatch[1].replace(',', '')) : null;

  // Extract SMC concepts mentioned
  const smcConcepts: string[] = [];
  const conceptPatterns = /order\s*block|FVG|fair\s*value\s*gap|liquidity|swing|BOS|CHoCH|ob|buy-side|liquidity\s*grab/i;
  const matches = content.match(conceptPatterns);
  if (matches) {
    smcConcepts.push(...new Set(matches.map(m => m.toLowerCase())));
  }

  return {
    suggestion: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
    entry,
    takeProfit,
    stopLoss,
    reasoning: content,
    smcConcepts,
  };
}