import type React from 'react';
import {
  Activity,
  BookOpen,
  Database,
  Home,
  LifeBuoy,
  Send,
  User,
  Zap,
} from 'lucide-react';

/**
 * Единый источник состава разделов и прав доступа к ним.
 *
 * Раньше правило «какие разделы видит роль» существовало в двух
 * независимых копиях: `allowedTabs` в App.tsx (что разрешено открыть) и
 * `visibleNavItems` в Header.tsx (что показать в меню). Копии совпадали
 * только пока их правили одновременно, а при добавлении раздела нужно
 * было вспомнить про обе — иначе пункт либо появлялся в меню без права
 * открытия, либо открывался, но отсутствовал в навигации.
 *
 * Теперь состав разделов и доступ описаны здесь один раз, а меню,
 * маршрутизация и командная палитра читают этот список.
 */

export type TabType =
  | 'home'
  | 'channels'
  | 'console'
  | 'operator'
  | 'database'
  | 'logs_traces'
  | 'architecture'
  | 'users'
  | 'help';

export type Role = 'dispatcher' | 'admin';

export interface NavItem {
  tab: TabType;
  label: string;
  /** Краткое пояснение — для меню, палитры команд и подписи в справке. */
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  domId: string;
  /** Роли, которым раздел доступен. Пустого списка быть не должно. */
  roles: Role[];
}

const BOTH: Role[] = ['dispatcher', 'admin'];
const ADMIN: Role[] = ['admin'];

export const NAV_ITEMS: NavItem[] = [
  { tab: 'home', label: 'Главная', hint: 'Обзор возможностей стенда', icon: Home, domId: 'header-tab-home', roles: BOTH },
  { tab: 'channels', label: 'Каналы', hint: 'Источники входящих обращений', icon: Send, domId: 'header-tab-channels', roles: ADMIN },
  { tab: 'console', label: 'Демо-стенд', hint: 'Разбор обращения по шагам', icon: Zap, domId: 'header-tab-console', roles: BOTH },
  { tab: 'operator', label: 'Диспетчер', hint: 'Проверка и подтверждение заявок', icon: User, domId: 'header-tab-operator', roles: BOTH },
  { tab: 'database', label: 'Реестр', hint: 'Сохранённые заявки', icon: Database, domId: 'header-tab-database', roles: ADMIN },
  { tab: 'logs_traces', label: 'Журнал обработки', hint: 'Ход и результаты обработки запросов', icon: Activity, domId: 'header-tab-logs-traces', roles: ADMIN },
  { tab: 'architecture', label: 'Документация', hint: 'Описание проекта и архитектурные схемы', icon: BookOpen, domId: 'header-tab-architecture', roles: ADMIN },
  { tab: 'users', label: 'Пользователи', hint: 'Аккаунты и роли сотрудников', icon: User, domId: 'header-tab-users', roles: ADMIN },
  { tab: 'help', label: 'Справка', hint: 'Порядок работы, сроки и статусы', icon: LifeBuoy, domId: 'header-tab-help', roles: BOTH },
];

/** Разделы, доступные роли, в порядке полосы меню. */
export const navItemsForRole = (role: Role): NavItem[] =>
  NAV_ITEMS.filter((item) => item.roles.includes(role));

/** Только идентификаторы — для проверки права открыть раздел. */
export const tabsForRole = (role: Role): TabType[] =>
  navItemsForRole(role).map((item) => item.tab);
