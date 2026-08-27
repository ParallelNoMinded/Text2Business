import { PublicUser, Ticket, UserRole } from './types';

export const RU_PRIORITY: Record<Ticket['priority'], string> = {
  critical: 'КРИТИЧНЫЙ',
  high: 'ВЫСОКИЙ',
  medium: 'СРЕДНИЙ',
  low: 'НИЗКИЙ',
};

export function ruPriority(p: string): string {
  const key = p.toLowerCase() as Ticket['priority'];
  return RU_PRIORITY[key] || p;
}

export function ruLogLevel(level: string): string {
  const map: Record<string, string> = {
    INFO: 'ИНФО',
    SUCCESS: 'УСПЕХ',
    WARNING: 'ПРЕДУПР.',
    WARN: 'ПРЕДУПР.',
    ERROR: 'ОШИБКА',
    CRITICAL: 'КРИТИЧ.',
  };
  return map[level] || level;
}

export function ruHealth(state: string): string {
  const map: Record<string, string> = {
    Operational: 'Работает',
    Degraded: 'Ограничен',
    Down: 'Недоступен',
  };
  return map[state] || state;
}

export function ruTicketStatus(status: string): string {
  const map: Record<string, string> = {
    NEW: 'НОВАЯ',
    IN_PROGRESS: 'В РАБОТЕ',
    WAITING_DISPATCHER: 'ОЖИДАЕТ ДИСПЕТЧЕРА',
    RESOLVED: 'РЕШЕНА',
    CLOSED: 'ЗАКРЫТА',
  };
  return map[status] || status;
}

export function ruAssetStatus(status: string): string {
  const map: Record<string, string> = {
    OK: 'В НОРМЕ',
    WARNING: 'ПРЕДУПР.',
    ERROR: 'ОШИБКА',
    CRITICAL: 'КРИТИЧНО',
    DOWN: 'НЕДОСТУПЕН',
  };
  return map[status] || ruConnStatus(status);
}

export function ruConnStatus(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'АКТИВЕН',
    WAITING: 'ОЖИДАНИЕ',
    ERROR: 'ОШИБКА',
    DISCONNECTED: 'ОТКЛЮЧЁН',
    HEALTHY: 'В НОРМЕ',
    FAILED: 'СБОЙ',
    UNKNOWN: 'НЕИЗВЕСТНО',
    DOWN: 'НЕДОСТУПЕН',
    DEGRADED: 'ОГРАНИЧЕН',
    OPERATIONAL: 'РАБОТАЕТ',
    IDLE: 'ПРОСТОЙ',
    CRITICAL: 'КРИТИЧНО',
    AUTOMATION: 'АВТО',
    PROCESSING: 'В РАБОТЕ',
    COMPLETED: 'ГОТОВО',
    RUNNING: 'ИДЁТ',
    READY: 'ГОТОВО',
    'NEEDS REVIEW': 'НА ПРОВЕРКЕ',
    'DRY-RUN': 'ЧЕРНОВИК',
    AI: 'ИИ',
  };
  return map[status] || status;
}

export function ruUserRole(role: UserRole): string {
  return role === 'admin' ? 'Администратор' : 'Диспетчер';
}

export function formatUserRoleLine(user: Pick<PublicUser, 'firstName' | 'lastName' | 'role'>): string {
  return `${user.firstName} ${user.lastName} · ${ruUserRole(user.role)}`;
}
