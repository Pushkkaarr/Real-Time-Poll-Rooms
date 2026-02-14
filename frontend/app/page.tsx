'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import PollForm from '@/components/PollForm';
import { pollApi } from '@/lib/api/pollClient';

const FEATURES = {
  analytics: {
    icon: '📊',
    title: 'Live Analytics',
    description: 'Watch results pour in as they happen. Our WebSocket-powered engine syncs every vote across all connected devices in milliseconds.'
  },
  sharing: {
    icon: '🔗',
    title: 'Instant Sharing',
    description: 'Generate a unique, permanent link for your poll. Share it anywhere—no account required for you or your voters.'
  },
  security: {
    icon: '🛡️',
    title: 'Anti-Abuse Protection',
    description: 'Keep your data clean. We use device fingerprinting and IP hashing to prevent duplicate votes and ensure unique participation.'
  }
};

export default function CreatePoll() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<keyof typeof FEATURES | null>(null);

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
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 bg-[var(--bg-page)]">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-black text-[var(--font-color)] mb-4 uppercase leading-tight tracking-tighter">
            Real-Time Polls
          </h1>
          <p className="text-[var(--font-color-sub)] text-xl font-bold uppercase tracking-widest">
            Create. Share. Vote.
          </p>
        </div>

        {/* Form Card */}
        <div className="brutalist-card">
          <PollForm
            onSubmit={handleCreatePoll}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Footer info/Login-with style social icons */}
        <div className="mt-12 flex justify-between items-center">
          <div className="flex gap-4">
            <button 
              onClick={() => setSelectedFeature('analytics')}
              className="brutalist-button-sm hover:scale-110 transition-transform active:translate-y-1"
              title="View Analytics Info"
            >
              📊
            </button>
            <button 
              onClick={() => setSelectedFeature('sharing')}
              className="brutalist-button-sm hover:scale-110 transition-transform active:translate-y-1"
              title="View Sharing Info"
            >
              🔗
            </button>
            <button 
              onClick={() => setSelectedFeature('security')}
              className="brutalist-button-sm hover:scale-110 transition-transform active:translate-y-1"
              title="View Security Info"
            >
              🛡️
            </button>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--font-color-sub)] opacity-60">
            Powered by WebSockets
          </p>
        </div>
      </div>

      {/* Feature Explanation Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="brutalist-card max-w-sm w-full bg-[var(--bg-inner)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-4xl">{FEATURES[selectedFeature].icon}</div>
              <button 
                onClick={() => setSelectedFeature(null)}
                className="brutalist-button-sm p-1"
              >
                <X size={20} />
              </button>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">
              {FEATURES[selectedFeature].title}
            </h3>
            <p className="font-bold text-[var(--font-color-sub)] leading-relaxed mb-6">
              {FEATURES[selectedFeature].description}
            </p>
            <button 
              onClick={() => setSelectedFeature(null)}
              className="brutalist-button-primary w-full text-sm py-2"
            >
              GOT IT
            </button>
          </div>
          {/* Overlay click to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedFeature(null)} />
        </div>
      )}
    </div>
  );
}
