'use client';

import { useState } from 'react';
import { Poll } from '@/lib/types/poll';

interface VoteButtonProps {
  option: Poll['options'][0];
  isVoted: boolean;
  isUserVotedForThis: boolean;
  isLoading: boolean;
  onVote: () => void;
  totalVotes: number;
}

export default function VoteButton({
  option,
  isVoted,
  isUserVotedForThis,
  isLoading,
  onVote,
  totalVotes,
}: VoteButtonProps) {
  const votePercentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;

  return (
    <button
      onClick={() => {
        onVote();
      }}
      disabled={isUserVotedForThis || isLoading}
      title={isUserVotedForThis ? 'You have already voted for this option' : 'Click to vote'}
      className="w-full text-left group transition-all"
    >
      <div className="relative overflow-hidden rounded-lg border-2 bg-white p-4 transition-all duration-200 hover:shadow-lg disabled:shadow-none"
        style={{
          backgroundColor: isUserVotedForThis ? '#dcfce7' : (isVoted ? '#e0f2fe' : 'white'),
          borderColor: isUserVotedForThis ? '#22c55e' : (isVoted ? '#0284c7' : '#bfdbfe'),
          opacity: isUserVotedForThis || isLoading ? 1 : 'inherit',
          pointerEvents: isUserVotedForThis ? 'none' : 'auto',
        }}
      >
        {/* Progress bar background - show if voted by anyone */}
        {isVoted && (
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500"
            style={{
              background: isUserVotedForThis 
                ? 'linear-gradient(to right, #86efac, #bbf7d0)' 
                : 'linear-gradient(to right, rgb(191, 219, 254), rgb(191, 219, 254))',
              width: `${votePercentage}%`,
              opacity: 0.5,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{option.text}</span>
            {isUserVotedForThis && (
              <span className="text-lg font-bold text-green-600">✓ Your vote</span>
            )}
            {isLoading && (
              <span className="text-sm text-gray-500 animate-pulse">Voting...</span>
            )}
          </div>
          {isVoted ? (
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: isUserVotedForThis ? '#22c55e' : '#0284c7' }}>
                {option.votes}
              </div>
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
