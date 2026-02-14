'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PollForm from '@/components/PollForm';
import { pollApi } from '@/lib/api/pollClient';

export default function CreatePoll() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreatePoll = async (question: string, options: string[]) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await pollApi.createPoll(question, options);

      if (response.success && response.pollId) {
        // Store the poll ID in localStorage to identify the owner
        const myPolls = JSON.parse(localStorage.getItem('my_polls') || '[]');
        myPolls.push(response.pollId);
        localStorage.setItem('my_polls', JSON.stringify(myPolls));

        // Redirect to the poll page
        router.push(`/polls/${response.pollId}`);
      } else {
        setError(response.message || 'Failed to create poll');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create poll. Please try again.');
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create a Poll</h1>
          <p className="text-lg text-gray-600">
            Ask a question and get instant feedback from your community
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <PollForm
            onSubmit={handleCreatePoll}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time Results</h3>
            <p className="text-sm text-gray-600">
              See poll results update instantly as people vote
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">🔗</div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy Sharing</h3>
            <p className="text-sm text-gray-600">
              Share a unique link so anyone can access your poll
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">🛡️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Fair Voting</h3>
            <p className="text-sm text-gray-600">
              Anti-abuse mechanisms prevent repeat voting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
