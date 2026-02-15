'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  if (typeof window === 'undefined') return { hasVotedAllQuestions: false, questionsVoted: [] };
  
  try {
    const stored = localStorage.getItem(`poll_voted_${pollId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        hasVotedAllQuestions: parsed.hasVotedAllQuestions || false,
        questionsVoted: parsed.questionsVoted || [],
      };
    }
  } catch (e) {
    // Silently handle localStorage errors
  }
  
  return { hasVotedAllQuestions: false, questionsVoted: [] };
};

export default function PollPage() {
  const params = useParams();
  const pollId = params?.pollId as string;

  // Initialize state from localStorage immediately
  const [hasVotedAllQuestions, setHasVotedAllQuestions] = useState(() => {
    if (pollId) {
      const { hasVotedAllQuestions } = getStoredVoteData(pollId);
      return hasVotedAllQuestions;
    }
    return false;
  });

  const [questionsVoted, setQuestionsVoted] = useState<string[]>(() => {
    if (pollId) {
      const { questionsVoted } = getStoredVoteData(pollId);
      return questionsVoted;
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialPoll, setInitialPoll] = useState<Poll | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const isOwner = typeof window !== 'undefined' && 
    JSON.parse(localStorage.getItem('my_polls') || '[]').includes(pollId);

  // Use WebSocket for real-time updates
  const { poll: realtimePoll, isConnected, isDeleted, broadcastVote } = useRealtimePoll(pollId);
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

  const handleVote = async (questionId: string, optionId: string) => {
    if (!pollId) {
      setError('Poll ID is missing');
      return;
    }

    // Validation: Check if user already voted for THIS SPECIFIC QUESTION
    if (questionsVoted.includes(questionId)) {
      setError('You have already voted on this question');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Submit vote to backend
      const response = await pollApi.voteOnPoll(pollId, questionId, optionId);

      if (response.success && response.poll) {
        // Step 2: Calculate updated state
        const updatedQuestionsVoted = [...questionsVoted, questionId];
        const totalQuestions = response.poll.questions?.length || 1;
        const allQuestionsVoted = updatedQuestionsVoted.length === totalQuestions;
        
        // Step 3: Persist to localStorage IMMEDIATELY (before state updates)
        const voteData = {
          hasVotedAllQuestions: allQuestionsVoted,
          questionsVoted: updatedQuestionsVoted,
          votedOptions: {
            ...JSON.parse(localStorage.getItem(`poll_voted_${pollId}`) || '{}').votedOptions || {},
            [questionId]: optionId,
          },
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(`poll_voted_${pollId}`, JSON.stringify(voteData));

        // Step 4: Update React state with fresh poll data from API response
        setQuestionsVoted(updatedQuestionsVoted);
        setHasVotedAllQuestions(allQuestionsVoted);
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
          errorMsg?.includes('already voted on this question') ||
          errorMsg?.includes('You have already voted on this question')
        ) {
          // User already voted - mark as voted and show results
          const updatedQuestionsVoted = [...questionsVoted, questionId];
          const totalQuestions = response.poll?.questions?.length || 1;
          const allQuestionsVoted = updatedQuestionsVoted.length === totalQuestions;
          
          setQuestionsVoted(updatedQuestionsVoted);
          setHasVotedAllQuestions(allQuestionsVoted);
          localStorage.setItem(`poll_voted_${pollId}`, JSON.stringify({
            hasVotedAllQuestions: allQuestionsVoted,
            questionsVoted: updatedQuestionsVoted,
            timestamp: new Date().toISOString(),
          }));
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

  const handleDeletePoll = async () => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await pollApi.deletePoll(pollId);
      if (response.success) {
        // Remove from local "my_polls"
        const myPolls = JSON.parse(localStorage.getItem('my_polls') || '[]');
        const updatedMyPolls = myPolls.filter((id: string) => id !== pollId);
        localStorage.setItem('my_polls', JSON.stringify(updatedMyPolls));
        
        router.push('/');
      } else {
        alert(response.message || 'Failed to delete poll');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting poll');
    } finally {
      setIsDeleting(false);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/polls/${pollId}`
    : '';

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-[var(--main-color)] animate-spin mx-auto mb-4" />
          <p className="font-bold uppercase tracking-widest text-[var(--main-color)]">Syncing Data...</p>
        </div>
      </div>
    );
  }

  if ((error && !poll) || isDeleted) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--main-color)] hover:underline font-black uppercase tracking-widest mb-12 transform-all hover:-translate-x-1"
          >
            <ChevronLeft size={20} />
            Abort & Reset
          </Link>

          <div className="brutalist-card bg-red-100 border-red-500 shadow-[4px_4px_0_0_#ef4444] text-center p-12">
            <h1 className="text-4xl font-black text-red-500 uppercase tracking-tighter mb-4">Access Denied</h1>
            <p className="text-red-700 font-bold uppercase text-sm mb-10 leading-relaxed italic">
              This data stream has been terminated by the source.
            </p>
            <Link
              href="/"
              className="brutalist-button inline-block bg-red-500 border-black text-white shadow-[4px_4px_0_0_#000000]"
            >
              Start New Stream →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--main-color)] hover:underline font-black uppercase tracking-widest mb-8 transform-all hover:-translate-x-1"
        >
          <ChevronLeft size={20} />
          Back to Poll Creation
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Card */}
          <div className="flex-1 w-full brutalist-card lg:mb-10">
            {/* WebSocket Status Indicator */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                  {isConnected ? 'LIVE FEED ACTIVE' : 'RECONNECTING...'}
                </span>
              </div>
            </div>

            <PollResults
              poll={poll}
              hasVotedAllQuestions={hasVotedAllQuestions}
              questionsVoted={questionsVoted}
              isLoading={isLoading}
              onVote={handleVote}
            />

            {error && (
              <div className="mt-8 brutalist-card bg-red-900/20 border-red-500 shadow-[4px_4px_0px_0px_#ef4444] p-4">
                <p className="text-red-500 text-xs font-black uppercase">{error}</p>
              </div>
            )}
          </div>

          {/* Side Panel: Share & Actions */}
          <div className="w-full lg:w-[380px] space-y-8">
            <SharePoll pollId={pollId} shareUrl={shareUrl} />

            {/* Owner Actions in side panel */}
            {isOwner && (
              <div className="brutalist-card bg-red-50/50 border-red-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">Danger Zone</h4>
                <button
                  onClick={handleDeletePoll}
                  disabled={isDeleting}
                  className="w-full brutalist-button bg-red-500 text-white border-black text-xs py-3"
                >
                  {isDeleting ? 'ERASING...' : 'DELETE POLL FOREVER'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
