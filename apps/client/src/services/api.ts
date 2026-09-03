const API_BASE_URL = process.env.TARO_APP_API_BASE_URL || 'http://127.0.0.1:3000';

export interface ChatRequest {
  sessionId: string;
  userId: string | null;
  townCode: string;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) throw new Error('request_failed');
  return response.json() as Promise<T>;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

