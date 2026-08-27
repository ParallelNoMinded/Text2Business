import React, { useEffect, useRef, useState } from 'react';
import {
  Cpu,
  Database,
  Zap,
  Activity,
  User,
  Inbox,
  Sun,
  Moon,
  Send,
  Key,
  BookOpen,
  Menu,
  X,
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
import { StatusBadge } from './ui/StatusBadge';
import { AppTab, PublicUser } from '../types';
import { formatUserRoleLine } from '../uiRu';

export type TabType = AppTab;

const WORK_NAV: { id: TabType; label: string; icon: typeof Inbox; elementId: string }[] = [
  { id: 'operator', label: 'Обращения', icon: Inbox, elementId: 'header-tab-operator' },
  { id: 'home', label: 'AI-диспетчер', icon: Cpu, elementId: 'header-tab-home' },
  { id: 'database', label: 'Заявки', icon: Database, elementId: 'header-tab-database' },
  { id: 'sla', label: 'SLA', icon: Timer, elementId: 'header-tab-sla' },
  { id: 'history', label: 'История', icon: Clock, elementId: 'header-tab-history' },
  { id: 'notifications', label: 'Уведомления', icon: Bell, elementId: 'header-tab-notifications' },
  { id: 'profile', label: 'Профиль', icon: User, elementId: 'header-tab-profile' },
];

const ADMIN_NAV: { id: TabType; label: string; icon: typeof Users; elementId: string }[] = [
  { id: 'admin_users', label: 'Пользователи', icon: Users, elementId: 'header-admin-users' },
  { id: 'admin_users', label: 'Роли', icon: Shield, elementId: 'header-admin-roles' },
  { id: 'admin_users', label: 'Активность', icon: Activity, elementId: 'header-admin-activity' },
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
  isDryRun,
  selectedModel = 'gpt-4o',
  setSelectedModel,
  pendingOperatorCount = 0,
  githubToken = '',
  onOpenTokenModal,
  apiHealthy = null,
  currentUser = null,
  onLogout,
}) => {
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUser?.role === 'admin';
  const adminActive =
    isAdmin &&
    [...ADMIN_NAV, ...ADMIN_EXTRA].some((item) => item.id === activeTab && item.id !== 'database');
  const userLine = currentUser ? formatUserRoleLine(currentUser) : '';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setAdminOpen(false);
      }
    };
    const onDoc = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
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

  const systemTone =
    pendingOperatorCount > 0 ? 'warning' : apiHealthy === false ? 'danger' : 'success';
  const systemLabel =
    pendingOperatorCount > 0 ? 'НА ПРОВЕРКЕ' : apiHealthy === false ? 'ОШИБКА' : 'В НОРМЕ';

  const apiTone = apiHealthy === false ? 'danger' : apiHealthy ? 'success' : 'neutral';
  const apiLabel = apiHealthy === false ? 'СБОЙ' : apiHealthy ? 'АКТИВЕН' : 'НЕИЗВЕСТНО';

  const llmConnected = Boolean(githubToken) || geminiActive;
  const llmTone = llmConnected ? 'info' : 'warning';
  const llmLabel = llmConnected ? 'ИИ' : 'ОЖИДАНИЕ';

  const navButtonClass = (id: TabType) => {
    const active = activeTab === id;
    return `inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors whitespace-nowrap ${
      active
        ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]'
        : 'text-[var(--oc-muted)] hover:bg-[var(--oc-surface-2)] hover:text-[var(--oc-text)]'
    }`;
  };

  const iconButtonClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--oc-muted)] transition-colors hover:bg-[var(--oc-surface-2)] hover:text-[var(--oc-text)]';

  const renderWorkItem = (item: (typeof WORK_NAV)[number], keyPrefix = '') => {
    const Icon = item.icon;
    return (
      <button
        key={`${keyPrefix}${item.id}`}
        id={keyPrefix ? undefined : item.elementId}
        type="button"
        aria-current={activeTab === item.id ? 'page' : undefined}
        onClick={() => go(item.id)}
        className={`${navButtonClass(item.id)} ${keyPrefix ? 'w-full justify-start' : ''}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{item.id === 'database' && isAdmin ? 'Заявки / реестр' : item.label}</span>
        {item.id === 'operator' && pendingOperatorCount > 0 && (
          <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--status-warning-soft)] px-1 text-[10px] font-semibold text-[var(--status-warning)]">
            {pendingOperatorCount}
          </span>
        )}
        {item.id === 'notifications' && pendingOperatorCount > 0 && (
          <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--status-warning-soft)] px-1 text-[10px] font-semibold text-[var(--status-warning)]">
            {pendingOperatorCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--oc-border)] bg-[var(--oc-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-12 max-w-[1440px] items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={() => go('home')}
          className="-ml-1 inline-flex shrink-0 items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-[var(--oc-surface-2)]"
          title="Перейти к AI-диспетчеру"
          aria-label="Перейти к AI-диспетчеру"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]">
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="hidden leading-tight sm:flex sm:flex-col">
            <span className="text-[12px] font-semibold tracking-tight">Text2Business</span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--oc-muted)]">
              AI-ДИСПЕТЧЕР
            </span>
          </span>
        </button>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex"
          aria-label="Рабочая навигация"
        >
          {WORK_NAV.map((item) => renderWorkItem(item))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-1.5">
          {isAdmin && (
            <div className="relative hidden lg:block" ref={adminRef}>
              <button
                id="header-admin-menu-btn"
                type="button"
                aria-expanded={adminOpen}
                aria-haspopup="menu"
                onClick={() => setAdminOpen((v) => !v)}
                className={`${navButtonClass(adminActive ? activeTab : 'admin_users')} ${
                  adminActive ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]' : ''
                }`}
              >
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Администрирование
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </button>
              {adminOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-[var(--oc-border)] bg-[var(--oc-surface)] py-1 shadow-lg"
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
                </div>
              )}
            </div>
          )}

          <StatusBadge tone={systemTone} label={systemLabel} title="Статус системы" className="hidden sm:inline-flex" />
          <StatusBadge
            tone={apiTone}
            label={apiLabel}
            title="Подключение API"
            className="hidden lg:inline-flex"
          />
          <StatusBadge
            tone={llmTone}
            label={llmLabel}
            title={githubToken ? 'Токен модели задан' : 'Эвристический запасной режим / без токена'}
            className="hidden xl:inline-flex"
          />
          {isDryRun && (
            <StatusBadge tone="warning" label="ЧЕРНОВИК" title="Запись в БД только после подтверждения" className="hidden md:inline-flex" />
          )}

          {isAdmin && (
            <div className="hidden items-center gap-1 rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-1.5 py-0.5 2xl:flex">
              <label className="sr-only" htmlFor="header-model-dropdown">
                Модель ИИ
              </label>
              <Zap className="h-3 w-3 text-[var(--oc-accent)]" aria-hidden="true" />
              <select
                id="header-model-dropdown"
                value={selectedModel}
                onChange={(e) => setSelectedModel?.(e.target.value)}
                className="max-w-[9.5rem] cursor-pointer bg-transparent text-[11px] text-[var(--oc-text)] focus:outline-none"
              >
                <option value="qwen3.6-27b">qwen3.6-27b</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gemma4:e4b">gemma4:e4b</option>
                <option value="deepseek-reasoner">deepseek-reasoner</option>
                <option value="nemotron-3-ultra-550b-a55b">nemotron-3-ultra-550b-a55b</option>
              </select>
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
            <span
              className="hidden min-w-0 max-w-[14rem] truncate text-[11px] text-[var(--oc-text)] sm:inline"
              title={currentUser.email}
            >
              {userLine}
            </span>
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

          <button
            id="header-mobile-menu-btn"
            type="button"
            className={`${iconButtonClass} lg:hidden`}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            title={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav-panel"
          className="border-t border-[var(--oc-border)] bg-[var(--oc-surface)] lg:hidden"
          aria-label="Мобильная навигация"
        >
          {currentUser && (
            <p className="mx-auto max-w-[1440px] px-3 pt-2 text-[11px] text-[var(--oc-muted)] sm:hidden">
              {userLine}
            </p>
          )}
          <p className="mx-auto max-w-[1440px] px-3 pt-2 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">
            Работа
          </p>
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-1 px-3 py-2 sm:grid-cols-3">
            {WORK_NAV.map((item) => renderWorkItem(item, 'm-'))}
          </div>
          {isAdmin && (
            <>
              <p className="mx-auto max-w-[1440px] px-3 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">
                Администрирование
              </p>
              <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-1 px-3 py-2 sm:grid-cols-3">
                {[...ADMIN_NAV, ...ADMIN_EXTRA].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={`m-${item.elementId}`}
                      type="button"
                      onClick={() => go(item.id)}
                      className={`${navButtonClass(item.id)} w-full justify-start`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 pb-2 sm:hidden">
                <label className="sr-only" htmlFor="header-model-dropdown-mobile">
                  Модель ИИ
                </label>
                <select
                  id="header-model-dropdown-mobile"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel?.(e.target.value)}
                  className="h-8 w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 text-[12px]"
                >
                  <option value="qwen3.6-27b">qwen3.6-27b</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gemma4:e4b">gemma4:e4b</option>
                  <option value="deepseek-reasoner">deepseek-reasoner</option>
                  <option value="nemotron-3-ultra-550b-a55b">nemotron-3-ultra-550b-a55b</option>
                </select>
              </div>
            </>
          )}
        </nav>
      )}
    </header>
  );
};
