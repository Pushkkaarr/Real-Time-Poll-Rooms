'use client';

import { useState } from 'react';
import { Poll, PollQuestion } from '@/lib/types/poll';
import VoteButton from './VoteButton';

interface PollResultsProps {
  poll: Poll;
  hasVotedAllQuestions: boolean;
  questionsVoted: string[];
  isLoading: boolean;
  onVote: (questionId: string, optionId: string) => void;
}

export default function PollResults({
  poll,
  hasVotedAllQuestions,
  questionsVoted,
  isLoading,
  onVote,
}: PollResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Toggle expand/collapse for a specific question
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Support both old single-question and new multi-question format
  const questions = poll.questions || (poll.question && poll.options ? [
    {
      questionId: 'legacy',
      text: poll.question,
      options: poll.options || [],
      totalVotes: poll.totalVotes,
    }
  ] : []);

  const totalQuestions = questions.length;
  const votesRemaining = totalQuestions - questionsVoted.length;

  // Get voted option ID from localStorage
  const getVotedOptionId = (questionId: string): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    try {
      const stored = localStorage.getItem(`poll_voted_${poll._id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.votedOptions?.[questionId];
      }
    } catch (e) {
      // Silently handle localStorage errors
    }
    return undefined;
  };

  return (
    <div className="space-y-8">
      {/* Poll Header */}
      <div>
        <h2 className="text-3xl font-black text-[var(--font-color)] mb-4 uppercase leading-tight tracking-tight border-l-4 border-[var(--main-color)] pl-4">
          {poll.title || poll.question}
        </h2>
        
        {poll.description && (
          <p className="text-[var(--font-color-sub)] mb-4 font-bold italic">
            {poll.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="brutalist-button-sm text-xs font-black uppercase px-4 cursor-default whitespace-nowrap">
            {poll.totalVotes} {poll.totalVotes === 1 ? 'Vote' : 'Votes'}
          </div>

          {hasVotedAllQuestions ? (
            <div className="text-xs font-black uppercase px-4 py-2 rounded-full border-2 border-black bg-green-500 text-white shadow-[2px_2px_0px_0px_black]">
              ✓ All Questions Answered
            </div>
          ) : votesRemaining > 0 ? (
            <div className="text-xs font-black uppercase px-4 py-2 rounded-full border-2 border-orange-500 bg-orange-100 text-orange-700 shadow-[2px_2px_0px_0px_orange]">
              {votesRemaining} Question{votesRemaining !== 1 ? 's' : ''} Remaining
            </div>
          ) : null}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question: PollQuestion, questionIdx: number) => {
          const hasVotedThisQuestion = questionsVoted.includes(question.questionId);

          return (
            <div
              key={question.questionId}
              className="brutalist-card bg-[var(--bg-inner)] overflow-hidden border-2 border-black"
            >
              {/* Question Header / Toggle */}
              <button
                onClick={() => toggleQuestion(question.questionId)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-[rgba(0,0,0,0.03)] transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--font-color-sub)]">
                      Question {questionIdx + 1} / {totalQuestions}
                    </span>
                    {hasVotedThisQuestion && (
                      <span className="text-xs font-black uppercase px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-600">
                        ✓ Answered
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--font-color)]">
                    {question.text}
                  </h3>
                </div>
                <div className="ml-4 text-[var(--main-color)] font-black text-xl">
                  {expandedQuestions.has(question.questionId) ? '−' : '+'}
                </div>
              </button>

              {/* Question Options / Content */}
              {expandedQuestions.has(question.questionId) && (
                <div className="border-t-2 border-black p-4 space-y-4 bg-[var(--bg-page)]">
                  <div className="space-y-3">
                    {question.options?.map((option) => {
                      const votedOptionId = getVotedOptionId(question.questionId);
                      const isUserVotedForThisOption = votedOptionId === option.optionId && hasVotedThisQuestion;
                      
                      return (
                        <VoteButton
                          key={option.optionId}
                          option={option}
                          isVoted={hasVotedAllQuestions}
                          isUserVotedForThis={isUserVotedForThisOption}
                          isLoading={isLoading}
                          onVote={() => onVote(question.questionId, option.optionId)}
                          totalVotes={hasVotedAllQuestions ? question.totalVotes || 0 : 0}
                          showVotes={hasVotedAllQuestions}
                        />
                      );
                    })}
                  </div>

                  {/* Status Message */}
                  {!hasVotedThisQuestion && !isLoading && (
                    <div className="brutalist-card py-3 bg-[var(--bg-inner)] text-center border-[var(--main-color)]">
                      <p className="text-xs font-black uppercase tracking-widest text-[var(--main-color)]">
                        👆 Select an option to vote
                      </p>
                    </div>
                  )}

                  {hasVotedThisQuestion && !hasVotedAllQuestions && votesRemaining > 0 && (
                    <div className="brutalist-card py-3 bg-green-100 text-center border-green-600">
                      <p className="text-xs font-black uppercase tracking-widest text-green-700">
                        ✓ Vote recorded! Continue to next question
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Message */}
      {!hasVotedAllQuestions && questionsVoted.length > 0 && (
        <div className="brutalist-card py-4 bg-blue-100 text-center border-blue-500">
          <p className="text-xs font-black uppercase tracking-widest text-blue-700">
            Progress: {questionsVoted.length} / {totalQuestions} questions answered  
          </p>
        </div>
      )}

      {/* Final Results Message */}
      {hasVotedAllQuestions && (
        <div className="brutalist-card py-4 bg-green-100 text-center border-green-500">
          <p className="text-xs font-black uppercase tracking-widest text-green-700">
            ✓ Thank you for voting! Results are now visible above
          </p>
        </div>
      )}
    </div>
  );
}
