import type { TabType } from './components/Header';

export type AppRole = 'guest' | 'demo' | 'dispatcher';

export function roleFromTab(tab: TabType): AppRole | null {
  if (tab === 'console' || tab === 'channels') return 'demo';
  if (tab === 'operator' || tab === 'database' || tab === 'logs_traces') return 'dispatcher';
  return null;
}

export function canAccessTab(role: AppRole, tab: TabType): boolean {
  if (tab === 'home' || tab === 'architecture') return true;
  if (role === 'guest') return true;
  if (role === 'demo') return tab === 'console' || tab === 'channels';
  return tab === 'operator' || tab === 'database' || tab === 'logs_traces';
}

export function blockedRoleMessage(role: AppRole): string {
  if (role === 'demo') {
    return 'Сессия демо-стенда: рабочее место диспетчера закрыто. Смените роль на главной.';
  }
  if (role === 'dispatcher') {
    return 'Сессия диспетчера: демо-стенд закрыт. Смените роль на главной.';
  }
  return '';
}
