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
    <div className="space-y-6">
      {/* Poll Question */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{poll.question}</h2>
        {hasVoted && (
          <>
            <p className="text-sm text-gray-500 mb-2">
              Total votes: <span className="font-semibold text-gray-700">{poll.totalVotes}</span>
            </p>
            <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Votes submitted
            </div>
          </>
        )}
        {!hasVoted && (
          <p className="text-sm text-gray-500">
            {poll.totalVotes === 0 
              ? 'Be the first to vote!'
              : `${poll.totalVotes} vote${poll.totalVotes !== 1 ? 's' : ''} so far`}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-700 font-medium">
            👆 Choose an option to see the results
          </p>
        </div>
      )}
    </div>
  );
}
