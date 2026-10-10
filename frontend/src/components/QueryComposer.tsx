import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, CornerDownLeft } from 'lucide-react';

interface QueryComposerProps {
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (q: string) => void;
  isLoading: boolean;
  maxLength?: number;
}

const EXAMPLE_PROMPTS = [
  'Plan a 3-day trip to Goa from Hyderabad',
  'Find flight options from Hyderabad to Delhi',
  'Suggest places to visit in Jaipur',
];

export const QueryComposer: React.FC<QueryComposerProps> = ({
  query,
  setQuery,
  onSubmit,
  isLoading,
  maxLength = 2000,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea according to content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 110),
        280
      )}px`;
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && query.trim()) {
        onSubmit(query.trim());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && query.trim()) {
      onSubmit(query.trim());
    }
  };

  const handleSelectExample = (example: string) => {
    setQuery(example);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const trimmedLength = query.trim().length;
  const isOverLimit = query.length > maxLength;
  const isSubmitDisabled = isLoading || trimmedLength === 0 || isOverLimit;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
      >
        <label htmlFor="travel-query" className="sr-only">
          Travel query or trip description
        </label>

        <textarea
          id="travel-query"
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your trip, destination, budget, or flight requirements..."
          disabled={isLoading}
          rows={3}
          maxLength={maxLength + 50}
          className="w-full resize-none border-0 p-0 text-slate-800 placeholder-slate-400 text-sm sm:text-base focus:ring-0 focus:outline-hidden disabled:bg-white disabled:text-slate-500"
          aria-describedby="char-count"
        />

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3 text-xs text-slate-400">
            <span
              id="char-count"
              className={isOverLimit ? 'text-rose-600 font-semibold' : ''}
            >
              {query.length.toLocaleString()} / {maxLength.toLocaleString()} chars
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
              <CornerDownLeft className="w-3 h-3" />
              <span>Press Ctrl + Enter to plan</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Planning your trip...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Plan my trip</span>
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Clickable prompt examples */}
      <div className="mt-3 sm:mt-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium px-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Try an example prompt:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isLoading}
              onClick={() => handleSelectExample(prompt)}
              className="text-xs bg-white text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 border border-slate-200/90 rounded-lg px-3 py-1.5 transition-colors text-left disabled:opacity-50 disabled:pointer-events-none"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
