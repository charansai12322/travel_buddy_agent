export interface HealthResponse {
  status: string;
}

export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  response: string;
}

export type BackendConnectionState = 'checking' | 'connected' | 'unavailable';

export interface ApiError {
  message: string;
  statusCode?: number;
  isNetworkError?: boolean;
}
