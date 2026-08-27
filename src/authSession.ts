const SESSION_STORAGE_KEY = 'T2B_SESSION_ID';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
}

export function setSessionId(sessionId: string) {
  if (typeof window === 'undefined') return;
  if (sessionId.trim()) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId.trim());
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function clearSessionId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
