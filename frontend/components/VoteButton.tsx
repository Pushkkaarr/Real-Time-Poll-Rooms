'use client';

import { useState } from 'react';
import { Poll } from '@/lib/types/poll';

interface VoteButtonProps {
  option: Poll['options'][0];
  isVoted: boolean;
  isLoading: boolean;
  onVote: () => void;
  totalVotes: number;
}

export default function VoteButton({
  option,
  isVoted,
  isLoading,
  onVote,
  totalVotes,
}: VoteButtonProps) {
  const votePercentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;

  return (
    <button
      onClick={onVote}
      disabled={isVoted || isLoading}
      className="w-full text-left group"
    >
      <div className="relative overflow-hidden rounded-lg border-2 border-blue-200 bg-white p-4 transition-all duration-200 hover:border-blue-400 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isVoted ? '#e0f2fe' : 'white',
          borderColor: isVoted ? '#0284c7' : '#bfdbfe',
        }}
      >
        {/* Progress bar background - only show if voted */}
        {isVoted && (
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-200 to-blue-100 transition-all duration-500"
            style={{
              width: `${votePercentage}%`,
              opacity: 0.5,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="font-medium text-gray-800">{option.text}</span>
          {isVoted ? (
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">{option.votes}</div>
              <div className="text-sm text-gray-500">{votePercentage.toFixed(1)}%</div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Click to vote</div>
          )}
        </div>
      </div>
    </button>
  );
}
