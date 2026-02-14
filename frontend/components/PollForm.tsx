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
        <label htmlFor="question" className="block text-sm font-semibold text-gray-700 mb-2">
          Poll Question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your question?"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none transition-colors"
          rows={3}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">{question.length}/500 characters</p>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Poll Options (minimum 2, maximum 10)
        </label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                disabled={isLoading}
                maxLength={200}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  disabled={isLoading}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
            className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
            Add Option
          </button>
        )}
      </div>

      {/* Error Message */}
      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">{formError || error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {isLoading ? 'Creating Poll...' : 'Create Poll'}
      </button>
    </form>
  );
}
