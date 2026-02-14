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
    <div className="brutalist-card space-y-6">
      <div>
        <h3 className="text-xl font-black text-[var(--font-color)] mb-2 uppercase tracking-tighter">Spread the Word</h3>
        <p className="text-sm font-bold text-[var(--font-color-sub)] uppercase whitespace-nowrap overflow-hidden text-ellipsis">
          Share this link with your community
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="brutalist-input w-full font-mono text-xs py-2 h-12"
        />
        <button
          onClick={handleCopy}
          className="brutalist-button w-full py-3 text-sm uppercase tracking-widest whitespace-nowrap"
        >
          {copied ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={18} />
              COPIED
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Copy size={18} />
              COPY LINK
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase text-[var(--font-color-sub)] tracking-[0.2em]">
          ID: {pollId}
        </p>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--main-color)]" />
          <div className="w-2 h-2 rounded-full bg-[var(--main-color)] opacity-50" />
          <div className="w-2 h-2 rounded-full bg-[var(--main-color)] opacity-25" />
        </div>
      </div>
    </div>
  );
}
