'use client';

import { useState } from 'react';
import { useTelegramStore } from '@/lib/store';

export default function TelegramSetup() {
  const { botToken, chatId, isConnected, setBotToken, setChatId, setConnected } = useTelegramStore();
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!botToken || !chatId) {
      setError('Please enter both bot token and chat ID');
      return;
    }

    setTesting(true);
    setError(null);

    // Simulate test - in production would call Telegram API
    setTimeout(() => {
      // Demo: accept any token that looks valid (24+ chars)
      if (botToken.length >= 24) {
        setConnected(true);
      } else {
        setError('Invalid bot token or chat ID');
      }
      setTesting(false);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setBotToken('');
    setChatId('');
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 text-white">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
        </svg>
        <h3 className="text-lg font-semibold">Telegram Alerts</h3>
        {isConnected && (
          <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded-full">
            Connected
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span>Receiving trading alerts</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bot Token</label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Chat ID</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="123456789"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleConnect}
            disabled={testing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {testing ? 'Connecting...' : 'Connect Telegram Bot'}
          </button>

          <p className="text-xs text-gray-500">
            Create a bot via @BotFather and start a chat with it to get your Chat ID.
          </p>
        </div>
      )}
    </div>
  );
}