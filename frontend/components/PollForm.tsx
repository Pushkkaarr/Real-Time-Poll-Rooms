'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface PollFormProps {
  onSubmit: (question: string, options: string[]) => void;
  isLoading: boolean;
  error?: string;
}

export default function PollForm({ onSubmit, isLoading, error }: PollFormProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [formError, setFormError] = useState('');

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!question.trim()) {
      setFormError('Please enter a question');
      return;
    }

    if (question.trim().length < 5) {
      setFormError('Question must be at least 5 characters');
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim());
    if (filledOptions.length < 2) {
      setFormError('Please provide at least 2 options');
      return;
    }

    // Remove empty options
    const cleanedOptions = options.filter((opt) => opt.trim());

    onSubmit(question.trim(), cleanedOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Input */}
      <div>
        <label htmlFor="question" className="block text-sm font-bold text-[var(--font-color)] mb-2 uppercase tracking-wider">
          Poll Question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your question?"
          className="brutalist-input resize-none h-32"
          disabled={isLoading}
        />
        <p className="text-xs text-[var(--font-color-sub)] mt-2 font-medium">{question.length}/500 characters</p>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-bold text-[var(--font-color)] mb-2 uppercase tracking-wider">
          Poll Options (min 2, max 10)
        </label>
        <div className="space-y-4">
          {options.map((option, index) => (
            <div key={index} className="flex gap-3">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="brutalist-input flex-1"
                disabled={isLoading}
                maxLength={200}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  disabled={isLoading}
                  className="brutalist-button-sm text-red-500 border-red-500 shadow-[2px_2px_0px_0px_#ef4444]"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
        </div>

        {options.length < 10 && (
          <button
            type="button"
            onClick={handleAddOption}
            disabled={isLoading}
            className="mt-4 flex items-center gap-2 text-[var(--main-color)] hover:underline font-bold uppercase tracking-wider text-sm transition-all"
          >
            <Plus size={18} />
            Add Option
          </button>
        )}
      </div>

      {/* Error Message */}
      {(formError || error) && (
        <div className="bg-red-100 border-[3px] border-red-500 rounded-[10px] p-4 shadow-[4px_4px_0px_0px_#ef4444]">
          <p className="text-red-500 text-sm font-bold uppercase">{formError || error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="brutalist-button-primary w-full uppercase tracking-widest text-lg"
      >
        {isLoading ? 'Creating...' : 'Start Now →'}
      </button>
    </form>
  );
}
