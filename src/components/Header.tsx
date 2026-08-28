import React, { useEffect, useRef, useState } from 'react';
import {
  Cpu,
  Database,
  Zap,
  Activity,
  Inbox,
  Sun,
  Moon,
  Send,
  Key,
  BookOpen,
  Menu,
  LogOut,
  Settings,
  Users,
  Bell,
  Clock,
  Timer,
  Shield,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import { AppTab, PublicUser } from '../types';
import { formatUserRoleLine } from '../uiRu';
import { AssistantPicker } from './AssistantPicker';

export type TabType = AppTab;

const WORK_NAV: { id: TabType; label: string; icon: typeof Inbox; elementId: string }[] = [
  { id: 'operator', label: 'Обращения', icon: Inbox, elementId: 'header-tab-operator' },
  { id: 'home', label: 'AI-диспетчер', icon: Cpu, elementId: 'header-tab-home' },
  { id: 'database', label: 'Заявки', icon: Database, elementId: 'header-tab-database' },
  { id: 'sla', label: 'SLA', icon: Timer, elementId: 'header-tab-sla' },
  { id: 'history', label: 'История', icon: Clock, elementId: 'header-tab-history' },
  { id: 'notifications', label: 'Уведомления', icon: Bell, elementId: 'header-tab-notifications' },
];

const ADMIN_NAV: { id: TabType; label: string; icon: typeof Users; elementId: string }[] = [
  { id: 'admin_users', label: 'Пользователи', icon: Users, elementId: 'header-admin-users' },
  { id: 'admin_roles', label: 'Список и роли', icon: Shield, elementId: 'header-admin-roles' },
  { id: 'admin_activity', label: 'Активность', icon: Activity, elementId: 'header-admin-activity' },
  { id: 'logs_traces', label: 'Мониторинг', icon: Activity, elementId: 'header-admin-monitoring' },
  { id: 'logs_traces', label: 'Логи', icon: Activity, elementId: 'header-admin-logs' },
  { id: 'admin_analytics', label: 'Аналитика', icon: BarChart3, elementId: 'header-admin-analytics' },
  { id: 'admin_settings', label: 'Настройки', icon: Settings, elementId: 'header-admin-settings' },
  { id: 'channels', label: 'Интеграции', icon: Send, elementId: 'header-admin-integrations' },
];

const ADMIN_EXTRA: { id: TabType; label: string; icon: typeof Zap; elementId: string }[] = [
  { id: 'console', label: 'Демо-стенд ИИ', icon: Zap, elementId: 'header-tab-console' },
  { id: 'architecture', label: 'Архитектура', icon: BookOpen, elementId: 'header-architecture-btn' },
];

export interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  geminiActive: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isDryRun: boolean;
  setIsDryRun: (val: boolean) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  pendingOperatorCount?: number;
  githubToken?: string;
  onOpenTokenModal?: () => void;
  apiHealthy?: boolean | null;
  currentUser?: PublicUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  geminiActive,
  theme,
  setTheme,
  selectedModel = 'gpt-4o',
  setSelectedModel,
  pendingOperatorCount = 0,
  githubToken = '',
  onOpenTokenModal,
  currentUser = null,
  onLogout,
}) => {
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUser?.role === 'admin';
  const adminActive =
    isAdmin &&
    [...ADMIN_NAV, ...ADMIN_EXTRA].some((item) => item.id === activeTab && item.id !== 'database');
  const activeWork = WORK_NAV.find((item) => item.id === activeTab);
  const userLine = currentUser ? formatUserRoleLine(currentUser) : '';
  const userLineShort = currentUser ? formatUserRoleLine(currentUser, true) : '';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setAdminOpen(false);
      }
    };
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (adminRef.current && !adminRef.current.contains(t)) setAdminOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, []);

  const go = (tab: TabType) => {
    setActiveTab(tab);
    setMenuOpen(false);
    setAdminOpen(false);
  };

  const triggerClass = (active: boolean) =>
    `inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium whitespace-nowrap ${
      active
        ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--oc-accent)_35%,transparent)]'
        : 'text-[var(--oc-muted)] hover:bg-[var(--oc-surface-2)] hover:text-[var(--oc-text)]'
    }`;

  const menuItemClass = (active: boolean) =>
    `flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-[var(--oc-surface-2)] ${
      active ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]' : 'text-[var(--oc-text)]'
    }`;

  const iconButtonClass =
    'inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-md text-[var(--oc-muted)] transition-colors hover:bg-[var(--oc-surface-2)] hover:text-[var(--oc-text)]';

  const dropdownClass =
    'absolute left-0 z-50 mt-1 w-56 max-w-[calc(100vw-1.5rem)] rounded-md border border-[var(--oc-border)] bg-[var(--oc-surface)] py-1 shadow-lg';

  return (
    <header className="oc-topbar sticky top-0 z-50">
      <div className="mx-auto flex min-h-14 max-w-[1440px] items-center gap-1 px-3 py-2 sm:gap-2 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={() => go('home')}
          className="-ml-1 inline-flex shrink-0 items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-[var(--oc-surface-2)]"
          title="Перейти к AI-диспетчеру"
          aria-label="Перейти к AI-диспетчеру"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--oc-accent)_35%,var(--oc-border))] bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]">
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden leading-tight sm:flex sm:flex-col">
            <span className="text-[12px] font-semibold tracking-tight">Text2Business</span>
            <span className="hidden text-[10px] text-[var(--oc-muted)] 2xl:block">AI-диспетчер</span>
          </span>
        </button>

        <nav className="flex min-w-0 items-center gap-1" aria-label="Навигация">
          <div className="relative" ref={menuRef}>
            <button
              id="header-work-menu-btn"
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => {
                setMenuOpen((v) => !v);
                setAdminOpen(false);
              }}
              className={triggerClass(Boolean(activeWork))}
            >
              <Menu className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="min-w-0 break-words">
                {activeWork ? (activeWork.id === 'database' && isAdmin ? 'Реестр' : activeWork.label) : 'Меню'}
              </span>
              {pendingOperatorCount > 0 && (
                <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--status-warning-soft)] px-1 text-[10px] font-semibold text-[var(--status-warning)]">
                  {pendingOperatorCount}
                </span>
              )}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div role="menu" className={dropdownClass}>
                {WORK_NAV.map((item) => {
                  const Icon = item.icon;
                  const label = item.id === 'database' && isAdmin ? 'Реестр' : item.label;
                  return (
                    <button
                      key={item.id}
                      id={item.elementId}
                      type="button"
                      role="menuitem"
                      aria-current={activeTab === item.id ? 'page' : undefined}
                      onClick={() => go(item.id)}
                      className={menuItemClass(activeTab === item.id)}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{label}</span>
                      {item.id === 'operator' && pendingOperatorCount > 0 && (
                        <span className="text-[10px] font-semibold text-[var(--status-warning)]">
                          {pendingOperatorCount}
                        </span>
                      )}
                    </button>
                  );
                })}
                {currentUser && (
                  <>
                    <div className="my-1 border-t border-[var(--oc-border)] lg:hidden" />
                    <button
                      type="button"
                      role="menuitem"
                      className={`${menuItemClass(activeTab === 'profile')} lg:hidden`}
                      onClick={() => go('profile')}
                    >
                      {userLineShort}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="relative" ref={adminRef}>
              <button
                id="header-admin-menu-btn"
                type="button"
                aria-expanded={adminOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setAdminOpen((v) => !v);
                  setMenuOpen(false);
                }}
                className={triggerClass(adminActive)}
              >
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Админ</span>
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </button>
              {adminOpen && (
                <div
                  role="menu"
                  className={`${dropdownClass} left-auto right-0`}
                >
                  {ADMIN_NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.elementId}
                        id={item.elementId}
                        type="button"
                        role="menuitem"
                        onClick={() => go(item.id)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[var(--oc-text)] hover:bg-[var(--oc-surface-2)]"
                      >
                        <Icon className="h-3.5 w-3.5 text-[var(--oc-accent)]" aria-hidden="true" />
                        {item.label}
                      </button>
                    );
                  })}
                  <div className="my-1 border-t border-[var(--oc-border)]" />
                  {ADMIN_EXTRA.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.elementId}
                        id={item.elementId}
                        type="button"
                        role="menuitem"
                        onClick={() => go(item.id)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-[var(--oc-muted)] hover:bg-[var(--oc-surface-2)] hover:text-[var(--oc-text)]"
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {item.label}
                      </button>
                    );
                  })}
                  {setSelectedModel && (
                    <div className="border-t border-[var(--oc-border)] px-2 py-2 xl:hidden">
                      <AssistantPicker
                        selectedModel={selectedModel}
                        onSelect={setSelectedModel}
                        tokenReady={Boolean(githubToken) || geminiActive}
                        compact
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-1.5">
          {isAdmin && setSelectedModel && (
            <div className="hidden min-w-0 xl:block">
              <AssistantPicker
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
                tokenReady={Boolean(githubToken) || geminiActive}
              />
            </div>
          )}

          {isAdmin && (
            <button
              id="header-github-token-btn"
              type="button"
              onClick={onOpenTokenModal}
              aria-label="Настроить токен API"
              className="hidden h-8 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-[var(--oc-muted)] transition-colors hover:bg-[var(--oc-surface-2)] hover:text-[var(--oc-text)] 2xl:inline-flex"
              title="Настроить токен GitHub Models"
            >
              <Key className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{githubToken ? 'Токен API' : 'Токен'}</span>
            </button>
          )}

          {currentUser && (
            <button
              id="header-tab-profile"
              type="button"
              onClick={() => go('profile')}
              title={currentUser.email}
              aria-current={activeTab === 'profile' ? 'page' : undefined}
              className={`hidden min-w-0 max-w-[16rem] whitespace-normal rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 py-1 text-left text-[11px] leading-snug lg:inline ${
                activeTab === 'profile'
                  ? 'border-[var(--oc-accent)] text-[var(--oc-accent)]'
                  : 'text-[var(--oc-text)] hover:bg-[var(--oc-surface-2)]'
              }`}
            >
              <span className="2xl:hidden">{userLineShort}</span>
              <span className="hidden 2xl:inline">{userLine}</span>
            </button>
          )}
          {onLogout && (
            <button
              id="header-logout-btn"
              type="button"
              onClick={onLogout}
              className={iconButtonClass}
              aria-label="Выйти"
              title="Выйти"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <button
            id="header-theme-btn"
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={iconButtonClass}
            aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title="Переключить тему"
          >
            {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
};
