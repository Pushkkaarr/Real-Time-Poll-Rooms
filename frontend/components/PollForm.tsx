'use client';

import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface PollFormProps {
  onSubmit: (title: string, description: string, questions: Array<{ text: string; options: string[] }>) => void;
  isLoading: boolean;
  error?: string;
}

export default function PollForm({ onSubmit, isLoading, error }: PollFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', options: ['', ''] },
  ]);
  const [expandedQuestion, setExpandedQuestion] = useState('1');
  const [formError, setFormError] = useState('');

  const handleAddQuestion = () => {
    if (questions.length < 20) {
      const newId = String(Math.max(...questions.map(q => parseInt(q.id))) + 1);
      setQuestions([
        ...questions,
        { id: newId, text: '', options: ['', ''] },
      ]);
      setExpandedQuestion(newId);
    }
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length > 1) {
      const filtered = questions.filter(q => q.id !== id);
      setQuestions(filtered);
      if (expandedQuestion === id && filtered.length > 0) {
        setExpandedQuestion(filtered[0].id);
      }
    }
  };

  const handleQuestionTextChange = (id: string, text: string) => {
    setQuestions(
      questions.map(q => (q.id === id ? { ...q, text } : q))
    );
  };

  const handleAddOption = (questionId: string) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId && q.options.length < 10
          ? { ...q, options: [...q.options, ''] }
          : q
      )
    );
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId && q.options.length > 2
          ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
          : q
      )
    );
  };

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === optionIndex ? value : opt)),
            }
          : q
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation - Title
    if (!title.trim()) {
      setFormError('Please enter a poll title');
      return;
    }

    if (title.trim().length < 5) {
      setFormError('Title must be at least 5 characters');
      return;
    }

    if (title.trim().length > 200) {
      setFormError('Title cannot exceed 200 characters');
      return;
    }

    // Validation - Questions
    if (questions.length === 0) {
      setFormError('Please add at least 1 question');
      return;
    }

    for (const question of questions) {
      if (!question.text.trim()) {
        setFormError('All questions must have text');
        return;
      }

      if (question.text.trim().length < 5) {
        setFormError('Each question must be at least 5 characters');
        return;
      }

      const filledOptions = question.options.filter(opt => opt.trim());
      if (filledOptions.length < 2) {
        setFormError('Each question must have at least 2 options');
        return;
      }
    }

    // Prepare data
    const questionsData = questions.map(q => ({
      text: q.text.trim(),
      options: q.options.filter(opt => opt.trim()),
    }));

    onSubmit(title.trim(), description.trim(), questionsData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-bold text-[var(--font-color)] mb-2 uppercase tracking-wider">
          Poll Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's this poll about?"
          className="brutalist-input w-full bg-white"
          disabled={isLoading}
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-2 font-medium">{title.length}/200 characters</p>
      </div>

      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-bold text-[var(--font-color)] mb-2 uppercase tracking-wider">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more context about this poll..."
          className="brutalist-input resize-none h-20 bg-white"
          disabled={isLoading}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-2 font-medium">{description.length}/500 characters</p>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-[var(--font-color)] uppercase tracking-wider">
            Questions ({questions.length}/20)
          </label>
          {questions.length < 20 && (
            <button
              type="button"
              onClick={handleAddQuestion}
              disabled={isLoading}
              className="flex items-center gap-2 text-[var(--main-color)] hover:underline font-bold uppercase tracking-wider text-sm transition-all"
            >
              <Plus size={18} />
              Add Question
            </button>
          )}
        </div>

        {questions.map((question, questionIdx) => (
          <div
            key={question.id}
            className="brutalist-card bg-gray-800 border-black"
          >
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-700 p-2 rounded transition" onClick={() => setExpandedQuestion(expandedQuestion === question.id ? '' : question.id)}>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-gray-300 mb-2">
                  Question {questionIdx + 1}
                </p>
                <p className="font-bold text-white">
                  {question.text || '(No text yet)'}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedQuestion(expandedQuestion === question.id ? '' : question.id);
                }}
                className="ml-4 p-2 hover:bg-gray-600 rounded transition text-white"
              >
                {expandedQuestion === question.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {/* Question Details (Expandable) */}
            {expandedQuestion === question.id && (
              <div className="space-y-4 pt-4 border-t-2 border-gray-600">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                    Question Text
                  </label>
                  <textarea
                    value={question.text}
                    onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                    placeholder={`Question ${questionIdx + 1}...`}
                    className="brutalist-input resize-none h-24 bg-white text-black border-2 border-black"
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-300 mt-2 font-medium">
                    {question.text.length}/500 characters
                  </p>
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                    Options (min 2, max 10)
                  </label>
                  <div className="space-y-3">
                    {question.options.map((option, optionIdx) => (
                      <div key={optionIdx} className="flex gap-3">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(question.id, optionIdx, e.target.value)
                          }
                          placeholder={`Option ${optionIdx + 1}`}
                          className="brutalist-input flex-1 bg-white text-black border-2 border-black"
                          disabled={isLoading}
                          maxLength={200}
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(question.id, optionIdx)}
                            disabled={isLoading}
                            className="brutalist-button-sm text-red-500 border-red-500 bg-red-100 shadow-[2px_2px_0px_0px_#ef4444]"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {question.options.length < 10 && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(question.id)}
                      disabled={isLoading}
                      className="mt-3 flex items-center gap-2 text-yellow-300 hover:text-yellow-200 font-bold uppercase tracking-wider text-sm transition-all"
                    >
                      <Plus size={18} />
                      Add Option
                    </button>
                  )}
                </div>

                {/* Delete Question */}
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(question.id)}
                    disabled={isLoading}
                    className="w-full brutalist-button text-red-400 border-red-500 text-sm py-2 bg-red-900 hover:bg-red-800"
                  >
                    Remove Question
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
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
        {isLoading ? 'Creating...' : 'Create Poll →'}
      </button>
    </form>
  );
}
