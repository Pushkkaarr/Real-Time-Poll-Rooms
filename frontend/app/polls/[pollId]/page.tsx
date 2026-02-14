'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PollResults from '@/components/PollResults';
import SharePoll from '@/components/SharePoll';
import { pollApi } from '@/lib/api/pollClient';
import { useRealtimePoll } from '@/lib/hooks/useRealtimePoll';
import { Poll } from '@/lib/types/poll';
import { generateDeviceFingerprint } from '@/lib/utils/deviceFingerprint';
import { ChevronLeft, Loader } from 'lucide-react';

// Helper to safely get vote data from localStorage
const getStoredVoteData = (pollId: string) => {
  if (typeof window === 'undefined') return { hasVoted: false, votedOptionIds: [] };
  
  try {
    const stored = localStorage.getItem(`poll_voted_${pollId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        hasVoted: parsed.hasVoted || false,
        votedOptionIds: parsed.votedOptionIds || [],
      };
    }
  } catch (e) {
    // Silently handle localStorage errors
  }
  
  return { hasVoted: false, votedOptionIds: [] };
};

export default function PollPage() {
  const params = useParams();
  const pollId = params?.pollId as string;

  // Initialize state from localStorage immediately
  const [hasVoted, setHasVoted] = useState(() => {
    if (pollId) {
      const { hasVoted } = getStoredVoteData(pollId);
      return hasVoted;
    }
    return false;
  });

  const [votedOptionIds, setVotedOptionIds] = useState<string[]>(() => {
    if (pollId) {
      const { votedOptionIds } = getStoredVoteData(pollId);
      return votedOptionIds;
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialPoll, setInitialPoll] = useState<Poll | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Use WebSocket for real-time updates
  const { poll: realtimePoll, isConnected, broadcastVote } = useRealtimePoll(pollId);
  // CRITICAL: Prioritize realtimePoll (WebSocket) over initialPoll (API)
  // This ensures real-time vote updates are displayed immediately
  // Fallback to initialPoll only if WebSocket hasn't received data yet
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

  // Refetch poll data to ensure vote counts are current
  const refetchPoll = async (): Promise<Poll | null> => {
    if (!pollId) return null;
    try {
      const response = await pollApi.getPoll(pollId);
      if (response.success && response.poll) {
        setInitialPoll(response.poll);
        return response.poll;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  };

  const handleVote = async (optionId: string) => {
    if (!pollId) {
      setError('Poll ID is missing');
      return;
    }

    // Validation: Check if user already voted for THIS SPECIFIC OPTION
    if (votedOptionIds.includes(optionId)) {
      setError('You have already voted for this option');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Submit vote to backend
      const response = await pollApi.voteOnPoll(pollId, optionId);
      

      if (response.success && response.poll) {
        // Step 2: Calculate updated state
        const updatedVotedOptionIds = [...votedOptionIds, optionId];
        
        // Step 3: Persist to localStorage IMMEDIATELY (before state updates)
        const voteData = {
          hasVoted: true,
          votedOptionIds: updatedVotedOptionIds,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(`poll_voted_${pollId}`, JSON.stringify(voteData));

        // Step 4: Update React state with fresh poll data from API response
        setHasVoted(true);
        setVotedOptionIds(updatedVotedOptionIds);
        setInitialPoll(response.poll);
        setError(''); // Clear any previous errors

        // Step 5: Broadcast vote to other connected clients IMMEDIATELY
        broadcastVote(response.poll);

        // Step 6: Refetch to ensure absolute latest data (handles race conditions)
        setTimeout(async () => {
          const refetchedPoll = await refetchPoll();
          if (refetchedPoll) {
            // Verify vote is still recorded in localStorage
            const stored = localStorage.getItem(`poll_voted_${pollId}`);
            if (stored) {
              const parsed = JSON.parse(stored);
            }
          }
        }, 500);
      } else {
        // Backend rejected the vote
        const errorMsg = response.message || 'Failed to record vote';
        
        if (
          errorMsg?.includes('already voted for this option') ||
          errorMsg?.includes('You have already voted for this option')
        ) {
          // User already voted - mark as voted and show results
          const updatedVotedOptionIds = [...votedOptionIds, optionId];
          setVotedOptionIds(updatedVotedOptionIds);
          localStorage.setItem(`poll_voted_${pollId}`, JSON.stringify({
            hasVoted: true,
            votedOptionIds: updatedVotedOptionIds,
            timestamp: new Date().toISOString(),
          }));
          setHasVoted(true);
          setError('');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error. Please try again.';
      
      setError(errorMsg);
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
            votedOptionIds={votedOptionIds}
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
