'use client';

import { useState } from 'react';
import { PollOption } from '@/lib/types/poll';

interface VoteButtonProps {
  option: PollOption;
  isVoted: boolean;
  isUserVotedForThis: boolean;
  isLoading: boolean;
  onVote: () => void;
  totalVotes: number;
  showVotes?: boolean;
}

export default function VoteButton({
  option,
  isVoted,
  isUserVotedForThis,
  isLoading,
  onVote,
  totalVotes,
  showVotes = true,
}: VoteButtonProps) {
  const votes = option.votes || 0;
  const votePercentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

  return (
    <button
      onClick={() => {
        onVote();
      }}
      disabled={isVoted || isUserVotedForThis || isLoading}
      title={isUserVotedForThis ? 'You have already voted for this option' : isVoted ? 'Vote recorded' : 'Click to vote'}
      className="w-full text-left group transition-all"
    >
      <div 
        className={`relative overflow-hidden rounded-lg border-[3px] p-4 transition-all duration-200 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
          isUserVotedForThis 
            ? 'bg-green-100 border-green-500 shadow-[4px_4px_0px_0px_#22c55e]' 
            : showVotes && isVoted
              ? 'bg-[var(--bg-inner)] border-[var(--main-color)] shadow-[4px_4px_0px_0px_var(--main-color)]'
              : 'bg-[var(--bg-inner)] border-[var(--main-color)] shadow-[4px_4px_0px_0px_var(--main-color)] hover:shadow-[6px_6px_0px_0px_var(--main-color)]'
        }`}
      >
        {/* Progress bar background - show when votes are visible and results are shown */}
        {showVotes && isVoted && votePercentage > 0 && (
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500 opacity-50 bg-[var(--main-color)]"
            style={{
              width: `${votePercentage}%`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--font-color)] uppercase tracking-tight">{option.text}</span>
            {isUserVotedForThis && (
              <span className="text-[10px] font-black text-white bg-green-600 px-2 py-0.5 rounded border-2 border-black shadow-[2px_2px_0px_0px_black]">✓ VOTED</span>
            )}
            {isLoading && (
              <span className="text-sm text-[var(--font-color-sub)] animate-pulse font-bold italic">VOTING...</span>
            )}
          </div>
          {showVotes && isVoted ? (
            <div className="text-right">
              <div className={`text-xl font-black ${isUserVotedForThis ? 'text-green-700' : 'text-[var(--font-color)]'}`}>
                {votes}
              </div>
              <div className="text-xs font-bold text-[var(--font-color-sub)]">{votePercentage.toFixed(1)}%</div>
            </div>
          ) : (
            <div className="text-xs font-black text-[var(--main-color)] uppercase tracking-widest">Vote</div>
          )}
        </div>
      </div>
    </button>
  );
}
