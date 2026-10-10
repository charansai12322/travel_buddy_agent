import type { HealthResponse, QueryResponse } from '../types/api';

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.PROD) {
    return 'https://travel-buddy-agent.onrender.com';
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getBaseUrl().replace(/\/+$/, '');

/**
 * Checks backend health via GET /api/health with a short timeout.
 */
export async function checkBackendHealth(timeoutMs: number = 4000): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return false;
    }

    const data: HealthResponse = await res.json();
    return data.status === 'ok';
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Submits a travel query to the Travel Buddy backend agent via POST /api/query.
 */
export async function submitTravelQuery(queryText: string): Promise<string> {
  const trimmed = queryText.trim();
  if (!trimmed) {
    throw new Error('Please enter a travel query before submitting.');
  }

  if (trimmed.length > 2000) {
    throw new Error('Query exceeds maximum allowed limit of 2,000 characters.');
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: trimmed }),
    });
  } catch (err: unknown) {
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    if (isAbort) {
      throw new Error('The request timed out. Please try again.');
    }
    throw new Error(
      `Unable to connect to Travel Buddy backend at ${API_BASE_URL}. Please ensure the backend server is running.`
    );
  }

  if (!res.ok) {
    let errorDetail = '';
    try {
      const errJson = await res.json();
      if (errJson && typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (errJson && Array.isArray(errJson.detail)) {
        // FastAPI validation errors
        errorDetail = errJson.detail.map((d: { msg?: string }) => d.msg || '').join(', ');
      }
    } catch {
      // Non-JSON response
    }

    if (res.status === 400 || res.status === 422) {
      throw new Error(errorDetail || 'Invalid request. Please check your query.');
    }

    if (res.status === 500) {
      if (errorDetail && errorDetail.includes('Missing required API key')) {
        throw new Error(errorDetail);
      }
      throw new Error(
        errorDetail || 'The travel agent encountered an error processing your request. Please try again.'
      );
    }

    throw new Error(
      errorDetail || `Request failed with status ${res.status}. Please try again.`
    );
  }

  try {
    const data: QueryResponse = await res.json();
    if (typeof data.response !== 'string' || !data.response.trim()) {
      throw new Error('Received an empty response from the travel agent.');
    }
    return data.response;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to parse agent response from server.');
  }
}
