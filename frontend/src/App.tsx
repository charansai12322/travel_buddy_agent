import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { QueryComposer } from './components/QueryComposer';
import { ResponsePanel } from './components/ResponsePanel';
import { checkBackendHealth, submitTravelQuery } from './services/api';
import type { BackendConnectionState } from './types/api';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendConnectionState>('checking');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const responseSectionRef = useRef<HTMLDivElement>(null);

  // Health check callback
  const verifyHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const isOk = await checkBackendHealth();
      setBackendStatus(isOk ? 'connected' : 'unavailable');
    } catch {
      setBackendStatus('unavailable');
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  // Check health on mount and every 30 seconds
  useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, [verifyHealth]);

  // Scroll to response when generated
  useEffect(() => {
    if (response && responseSectionRef.current) {
      responseSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);

  const handleSubmitQuery = async (queryToSubmit: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const planResult = await submitTravelQuery(queryToSubmit);
      setResponse(planResult);
      setBackendStatus('connected');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while communicating with Travel Buddy.';
      setErrorMessage(message);

      // If network failure, recheck health
      if (message.includes('Unable to connect')) {
        setBackendStatus('unavailable');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setResponse(null);
    setErrorMessage(null);
  };

  const handleRetry = () => {
    if (query.trim()) {
      handleSubmitQuery(query.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Header
        backendStatus={backendStatus}
        onRefreshHealth={verifyHealth}
        isCheckingHealth={isCheckingHealth}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {/* Hero Section */}
        <HeroSection />

        {/* Backend Warning Banner if unavailable */}
        {backendStatus === 'unavailable' && (
          <div
            role="alert"
            className="w-full max-w-3xl mx-auto my-4 p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-800 text-xs sm:text-sm flex items-start gap-3 shadow-2xs"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-amber-900">Backend Server Not Detected:</span>{' '}
              FastAPI is not currently responding at{' '}
              <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-[11px]">
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
              </code>
              . Please make sure Uvicorn is running in your terminal.
            </div>
            <button
              onClick={verifyHealth}
              disabled={isCheckingHealth}
              className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-amber-100/50 border border-amber-300 rounded-md shrink-0 transition-colors"
            >
              Recheck
            </button>
          </div>
        )}

        {/* Query Input Card */}
        <div className="mt-4">
          <QueryComposer
            query={query}
            setQuery={setQuery}
            onSubmit={handleSubmitQuery}
            isLoading={isLoading}
            maxLength={2000}
          />
        </div>

        {/* Submission Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="w-full max-w-3xl mx-auto mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-rose-900">Request Failed</h3>
              <p className="mt-0.5 text-rose-700 leading-normal">{errorMessage}</p>
            </div>
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-100/60 border border-rose-300 rounded-lg shrink-0 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Response Panel */}
        {response && (
          <div ref={responseSectionRef}>
            <ResponsePanel response={response} onClear={handleClear} />
          </div>
        )}

        {/* Loading placeholder skeleton while fetching */}
        {isLoading && !response && (
          <div className="w-full max-w-3xl mx-auto mt-8 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-slate-200 rounded"></div>
                <div className="h-3 w-64 bg-slate-100 rounded"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
              <div className="h-4 w-full bg-slate-100 rounded"></div>
              <div className="h-4 w-4/6 bg-slate-100 rounded"></div>
              <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Travel Buddy AI — Intelligent Trip Planning &amp; Flight Search</span>
          <span className="text-slate-400">
            Powered by Gemini, LangChain, Tavily &amp; SerpAPI
          </span>
        </div>
      </footer>
    </div>
  );
}
export default App;
