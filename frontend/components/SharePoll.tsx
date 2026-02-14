'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface SharePollProps {
  pollId: string;
  shareUrl: string;
}

export default function SharePoll({ pollId, shareUrl }: SharePollProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Silently handle copy errors
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Share Your Poll</h3>
        <p className="text-sm text-gray-600">
          Share this link with others so they can vote on your poll
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-mono text-gray-700"
        />
        <button
          onClick={handleCopy}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check size={18} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={18} />
              Copy
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Poll ID: <span className="font-mono text-gray-700">{pollId}</span>
      </p>
    </div>
  );
}
