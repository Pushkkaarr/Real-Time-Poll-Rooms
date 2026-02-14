'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PollResults from '@/components/PollResults';
import SharePoll from '@/components/SharePoll';
import { pollApi } from '@/lib/api/pollClient';
import { useRealtimePoll } from '@/lib/hooks/useRealtimePoll';
import { Poll } from '@/lib/types/poll';
import { ChevronLeft, Loader } from 'lucide-react';

export default function PollPage() {
  const params = useParams();
  const pollId = params?.pollId as string;

  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialPoll, setInitialPoll] = useState<Poll | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [localVoteCount, setLocalVoteCount] = useState(0);

  // Use WebSocket for real-time updates
  const { poll: realtimePoll, isConnected } = useRealtimePoll(pollId);
  const poll = realtimePoll || initialPoll;

  // Fetch initial poll data
  useEffect(() => {
    if (!pollId) return;

    const fetchPoll = async () => {
      setPageLoading(true);
      try {
        const response = await pollApi.getPoll(pollId);
        if (response.success) {
          setInitialPoll(response.poll);
        } else {
          setError(response.message || 'Poll not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load poll');
      } finally {
        setPageLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  const handleVote = async (optionId: string) => {
    if (!pollId || hasVoted) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await pollApi.voteOnPoll(pollId, optionId);

      if (response.success) {
        setHasVoted(true);
        setInitialPoll(response.poll);
        // The real-time update will handle the rest via WebSocket
        setLocalVoteCount(localVoteCount + 1);
      } else {
        setError(response.message || 'Failed to record vote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to vote. Please try again.');
      console.error('Error voting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/polls/${pollId}`
    : '';

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8"
          >
            <ChevronLeft size={20} />
            Create New Poll
          </Link>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 text-lg font-semibold mb-2">Poll Not Found</p>
            <p className="text-red-600 text-sm mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Create a New Poll
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8"
        >
          <ChevronLeft size={20} />
          Create New Poll
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-6">
          {/* WebSocket Status Indicator */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-gray-600">
              {isConnected ? 'Live' : 'Connecting...'}
            </span>
          </div>

          <PollResults
            poll={poll}
            hasVoted={hasVoted}
            isLoading={isLoading}
            onVote={handleVote}
          />

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Share Card */}
        <SharePoll pollId={pollId} shareUrl={shareUrl} />
      </div>
    </div>
  );
}
