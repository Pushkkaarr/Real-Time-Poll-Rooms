'use client';

import { useState } from 'react';
import { Poll } from '@/lib/types/poll';
import VoteButton from './VoteButton';

interface PollResultsProps {
  poll: Poll;
  hasVoted: boolean;
  votedOptionIds: string[];
  isLoading: boolean;
  onVote: (optionId: string) => void;
}

export default function PollResults({
  poll,
  hasVoted,
  votedOptionIds,
  isLoading,
  onVote,
}: PollResultsProps) {
  return (
    <div className="space-y-8">
      {/* Poll Question */}
      <div>
        <h2 className="text-3xl font-black text-[var(--font-color)] mb-4 uppercase leading-tight tracking-tight border-l-4 border-[var(--main-color)] pl-4">
          {poll.question}
        </h2>
        
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="brutalist-button-sm text-xs font-black uppercase px-4 cursor-default whitespace-nowrap">
            {poll.totalVotes} {poll.totalVotes === 1 ? 'Vote' : 'Votes'}
          </div>
          
          {hasVoted && (
            <div className="text-xs font-black uppercase px-4 py-2 rounded-full border-2 border-black bg-green-500 text-white shadow-[2px_2px_0px_0px_black]">
              ✓ Record Saved
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {poll.options.map((option) => (
          <VoteButton
            key={option.optionId}
            option={option}
            isVoted={hasVoted}
            isUserVotedForThis={votedOptionIds.includes(option.optionId)}
            isLoading={isLoading}
            onVote={() => onVote(option.optionId)}
            totalVotes={poll.totalVotes}
          />
        ))}
      </div>

      {/* Instructions for users who haven't voted */}
      {!hasVoted && poll.totalVotes > 0 && (
        <div className="brutalist-card py-4 bg-[var(--bg-inner)] text-center">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--main-color)]">
            👆 Select an option to see results
          </p>
        </div>
      )}
    </div>
  );
}
