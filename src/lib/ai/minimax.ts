// MiniMax API client for AI trading suggestions

const MINIMAX_API_URL = 'https://api.minimax.chat/v1/chat/completions';
const MODEL = 'MiniMax-M2.7';

interface AIResponse {
  suggestion: string;
  entry: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  reasoning: string;
  smcConcepts: string[];
}

function getApiKey(): string | null {
  return process.env.MINIMAX_API_KEY || process.env.NEXT_PUBLIC_MINIMAX_API_KEY || null;
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
  const apiKey = getApiKey();

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
    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
        messages: [
          {
            role: 'system',
            content: [
              {
                type: 'text',
                text: `You are a crypto trading analyst specializing in Smart Money Concept (SMC).
You analyze price action, identify institutional trading zones, and provide clear trading recommendations.
Always explain your reasoning using SMC terminology.`,
                cache_control: { type: 'ephemeral' },
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`MiniMax API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = extractTextContent(data.choices?.[0]?.message?.content);

    return parseAIResponse(content);
  } catch (error) {
    console.error('MiniMax API error:', error);
    return {
      suggestion: 'Error connecting to AI service',
      entry: null,
      takeProfit: null,
      stopLoss: null,
      reasoning: error instanceof Error ? error.message : 'Failed to get AI response. Please try again.',
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
  const apiKey = getApiKey();

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
    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 1024,
        temperature: 0.5,
        top_p: 0.95,
        messages: [
          {
            role: 'system',
            content: [
              {
                type: 'text',
                text: 'You are a trading coach providing feedback on user trading plans. Be direct and educational.',
                cache_control: { type: 'ephemeral' },
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return extractTextContent(data.choices?.[0]?.message?.content) || 'No feedback available.';
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

function extractTextContent(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((block: any) => {
      if (typeof block === 'string') return block;
      if (block.type === 'text') return block.text || '';
      if (block.text) return block.text;
      return '';
    }).join('');
  }
  if (content.text) return content.text;
  return String(content);
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
    smcConcepts.push(...new Set(matches.map((m: string) => m.toLowerCase())));
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