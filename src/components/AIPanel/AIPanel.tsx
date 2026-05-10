'use client';

import { useState } from 'react';
import { useAIStore } from '@/lib/store';

interface AIPanelProps {
  currentPrice?: number;
  onRequestFeedback?: () => void;
}

export default function AIPanel({ currentPrice = 0, onRequestFeedback }: AIPanelProps) {
  const { messages, isThinking, addMessage, clearMessages, setThinking } = useAIStore();
  const [userInput, setUserInput] = useState('');

  const handleSend = async () => {
    if (!userInput.trim() || isThinking) return;

    addMessage({ role: 'user', content: userInput });
    const input = userInput;
    setUserInput('');
    setThinking(true);

    // Simulate AI thinking
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `Demo mode: AI analysis would be shown here.\n\nFor ${currentPrice ? `BTC @ $${currentPrice}` : 'the current chart'}, I would analyze:\n- Current market structure\n- Key SMC levels\n- Trade setup recommendation\n\nSet MINIMAX_API_KEY to enable AI responses.`,
      });
      setThinking(false);
      onRequestFeedback?.();
    }, 1500);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 text-white flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AI Trading Assistant</h3>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[300px]">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            Ask about trading signals or get feedback on your trade plan
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-900/50 ml-8'
                  : 'bg-gray-800 mr-8'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
        {isThinking && (
          <div className="bg-gray-800 mr-8 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about current chart..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleSend}
          disabled={isThinking || !userInput.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}