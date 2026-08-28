import { AppTab, UserRole } from './types';

export const DISPATCHER_TABS: AppTab[] = [
  'home',
  'operator',
  'database',
  'sla',
  'history',
  'notifications',
  'profile',
];

const PATH_BY_TAB: Record<AppTab, string> = {
  home: '/',
  operator: '/operator',
  database: '/tickets',
  sla: '/sla',
  history: '/history',
  notifications: '/notifications',
  profile: '/profile',
  channels: '/admin/channels',
  console: '/admin/console',
  logs_traces: '/admin/logs',
  architecture: '/admin/architecture',
  admin_users: '/admin/users',
  admin_roles: '/admin/roles',
  admin_activity: '/admin/activity',
  admin_settings: '/admin/settings',
  admin_analytics: '/admin/analytics',
};

const TAB_BY_PATH: Record<string, AppTab> = {
  '/': 'home',
  '/operator': 'operator',
  '/tickets': 'database',
  '/sla': 'sla',
  '/history': 'history',
  '/notifications': 'notifications',
  '/profile': 'profile',
  '/admin': 'admin_users',
  '/admin/users': 'admin_users',
  '/admin/roles': 'admin_roles',
  '/admin/activity': 'admin_activity',
  '/admin/channels': 'channels',
  '/admin/console': 'console',
  '/admin/logs': 'logs_traces',
  '/admin/monitoring': 'logs_traces',
  '/admin/registry': 'database',
  '/admin/architecture': 'architecture',
  '/admin/settings': 'admin_settings',
  '/admin/analytics': 'admin_analytics',
};

export function pathForTab(tab: AppTab, role: UserRole): string {
  if (tab === 'database' && role === 'admin') return '/admin/registry';
  return PATH_BY_TAB[tab] || '/';
}

export function tabForPath(pathname: string): AppTab | null {
  return TAB_BY_PATH[pathname] || null;
}

export function canAccessTab(role: UserRole, tab: string): boolean {
  if (role === 'admin') return true;
  return DISPATCHER_TABS.includes(tab as AppTab);
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname === '/login' || pathname === '/register') return true;
  if (pathname.startsWith('/admin')) return role === 'admin';
  const tab = tabForPath(pathname);
  if (!tab) return false;
  return canAccessTab(role, tab);
}
