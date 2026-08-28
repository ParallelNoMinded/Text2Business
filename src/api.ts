/**
 * API-клиент фронтенда.
 *
 * Единая точка доступа к backend-серверу (server.ts):
 *  - хранит dispatch-токен в sessionStorage (сбрасывается при закрытии вкладки);
 *  - `apiFetch` автоматически добавляет заголовок `X-Dispatch-Token`
 *    ко всем запросам (защита API от неавторизованных вызовов).
 */

const TOKEN_STORAGE_KEY = 'T2B_DISPATCH_TOKEN';

/** Токен по умолчанию для dev-режима (SSR / отсутствие sessionStorage). */
const DEFAULT_DEV_TOKEN = 'dev-dispatch-token';

/** Возвращает текущий dispatch-токен или значение по умолчанию. */
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

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) || {}),
    'X-Dispatch-Token': getDispatchToken(),
  };
  return fetch(input, { ...init, headers });
}
