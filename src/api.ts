import { clearSessionId, getSessionId } from './authSession';
import { navigateTo } from './appPath';

const TOKEN_STORAGE_KEY = 'T2B_DISPATCH_TOKEN';

const DEFAULT_DEV_TOKEN = 'dev-dispatch-token';

export function getDispatchToken(): string {
  if (typeof window === 'undefined') return DEFAULT_DEV_TOKEN;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) || DEFAULT_DEV_TOKEN;
}

export function setDispatchToken(token: string) {
  if (typeof window === 'undefined') return;
  if (token.trim()) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function isAuthEndpoint(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : String(input);
  return url.includes('/api/auth/');
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) || {}),
  };
  const sessionId = getSessionId();
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && !isAuthEndpoint(input) && typeof window !== 'undefined') {
    clearSessionId();
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      navigateTo('/login');
    }
  }
  return res;
}
