import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
  ChevronDown,
  Database,
  Home,
  Key,
  Menu,
  Moon,
  Send,
  Sun,
  User,
  X,
  Zap,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { AppRole, canAccessTab } from '../roles';

export type TabType =
  | 'home'
  | 'channels'
  | 'console'
  | 'operator'
  | 'database'
  | 'logs_traces'
  | 'architecture';

interface HeaderProps {
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
  onRequestDemo?: () => void;
  sessionRole?: AppRole;
  onResetRole?: () => void;
}

const INDUSTRIES = [
  {
    title: 'Обслуживание оборудования',
    items: [
      'Сервисные компании',
      'Климатические системы (ОВИК)',
      'Холодильное оборудование',
      'Производство и ТЭК',
      'Телекоммуникации и ИТ',
    ],
  },
  {
    title: 'Недвижимость',
    items: ['Торговые и бизнес-центры', 'Клининг', 'Строительство и ремонты', 'Ритейл', 'ЖКХ'],
  },
  {
    title: 'Мобильные сотрудники',
    items: ['Обходы и проверки', 'Выездной ремонт', 'Доставка', 'Другие отрасли'],
  },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  selectedModel = 'gpt-4o',
  setSelectedModel,
  pendingOperatorCount = 0,
  githubToken = '',
  onOpenTokenModal,
  onRequestDemo,
  sessionRole = 'guest' as AppRole,
  onResetRole,
}) => {
  const isDark = theme === 'dark';
  const [openMenu, setOpenMenu] = useState<null | 'industries' | 'features' | 'mobile'>(null);
  const wrapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = (tab: TabType) => {
    setActiveTab(tab);
    setOpenMenu(null);
  };

  const navLink = (tab: TabType, label: string, icon: React.ReactNode, badge?: number) => {
    const isCurrent =
      tab === 'channels'
        ? activeTab === 'channels'
        : tab === 'console'
        ? activeTab === 'console'
        : activeTab === tab;
    const locked = !canAccessTab(sessionRole, tab);
    return (
      <button
        type="button"
        onClick={() => !locked && go(tab)}
        disabled={locked}
        title={
          locked
            ? sessionRole === 'demo'
              ? 'Недоступно в роли демо-стенда'
              : 'Недоступно в роли диспетчера'
            : undefined
        }
        className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${
          locked
            ? 'opacity-35 cursor-not-allowed text-zinc-400'
            : isCurrent
            ? isDark
              ? 'bg-white/10 text-white'
              : 'bg-zinc-900 text-white'
            : isDark
            ? 'text-zinc-300 hover:bg-white/5 hover:text-white'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
      >
        {icon}
        <span>{label}</span>
        {!!badge && badge > 0 && !locked && (
          <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-700 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>
    );
  };

  const megaPanel = (children: React.ReactNode) => (
    <div
      className={`absolute left-1/2 top-[calc(100%+10px)] z-50 w-[min(920px,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border p-6 shadow-[0_24px_80px_rgba(16,24,40,0.12)] ${
        isDark ? 'bg-[#1A1D22] border-[#2C3139]' : 'bg-white border-[#E6E8EC]'
      }`}
    >
      {children}
    </div>
  );

  return (
    <header
      ref={wrapRef}
      className={`sticky top-0 z-50 border-b backdrop-blur-md ${
        isDark ? 'bg-[#121417]/92 border-[#2C3139] text-white' : 'bg-white/92 border-[#E6E8EC] text-zinc-900'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-[68px]">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={() => go('home')} title="На главную">
            <BrandLogo markClassName="h-9 w-9" />
          </button>
          {sessionRole !== 'guest' && (
            <span
              className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                isDark ? 'border-[#3A404A] text-zinc-300' : 'border-[#E6E8EC] text-zinc-600'
              }`}
            >
              {sessionRole === 'demo' ? 'Роль: демо' : 'Роль: диспетчер'}
            </span>
          )}
        </div>

        <nav className="hidden lg:flex items-center gap-0.5 relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'industries' ? null : 'industries')}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
              openMenu === 'industries'
                ? isDark
                  ? 'text-white'
                  : 'text-zinc-900'
                : isDark
                ? 'text-zinc-300 hover:text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Отрасли
            <ChevronDown className={`h-3.5 w-3.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
          </button>
          {openMenu === 'industries' &&
            megaPanel(
              <div className="grid grid-cols-3 gap-8">
                {INDUSTRIES.map((col) => (
                  <div key={col.title}>
                    <h4 className="text-sm font-extrabold mb-3">{col.title}</h4>
                    <ul className="space-y-2">
                      {col.items.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            onClick={() => go('architecture')}
                            className={`text-sm text-left w-full rounded-xl px-2 py-1.5 transition ${
                              isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                            }`}
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'features' ? null : 'features')}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
              openMenu === 'features'
                ? isDark
                  ? 'text-white'
                  : 'text-zinc-900'
                : isDark
                ? 'text-zinc-300 hover:text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Возможности
            <ChevronDown className={`h-3.5 w-3.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
          </button>
          {openMenu === 'features' &&
            megaPanel(
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tab: 'channels' as TabType, title: 'Каналы', desc: 'Telegram, почта, голос, приём из систем' },
                  { tab: 'console' as TabType, title: 'Демо-стенд', desc: 'Четыре сценария, пробный прогон и подтверждение' },
                  { tab: 'operator' as TabType, title: 'Диспетчер', desc: 'Уточнения и эскалации оператору' },
                  { tab: 'database' as TabType, title: 'Реестр', desc: 'Контрагенты, объекты, заявки' },
                  { tab: 'logs_traces' as TabType, title: 'Журнал', desc: 'Наблюдение и сроки реакции' },
                  { tab: 'architecture' as TabType, title: 'Обзор системы', desc: 'Схемы и архитектурный отчёт' },
                ].map((f) => {
                  const locked = !canAccessTab(sessionRole, f.tab);
                  return (
                  <button
                    key={f.tab}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && go(f.tab)}
                    className={`rounded-2xl p-3 text-left transition ${
                      locked
                        ? 'opacity-40 cursor-not-allowed'
                        : isDark
                        ? 'hover:bg-white/5'
                        : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="text-sm font-extrabold">{f.title}</div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {locked ? 'Закрыто для текущей роли' : f.desc}
                    </div>
                  </button>
                  );
                })}
              </div>
            )}

          {navLink('console', 'Демо-стенд', <Zap className="h-3.5 w-3.5" />)}
          {navLink('operator', 'Диспетчер', <User className="h-3.5 w-3.5" />, pendingOperatorCount)}
          {navLink('database', 'Реестр', <Database className="h-3.5 w-3.5" />)}
          <button
            type="button"
            onClick={() => go('architecture')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
              activeTab === 'architecture'
                ? isDark
                  ? 'bg-white/10 text-white'
                  : 'bg-zinc-900 text-white'
                : isDark
                ? 'text-zinc-300 hover:bg-white/5'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Обзор системы
          </button>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <select
            id="header-model-dropdown"
            value={selectedModel}
            onChange={(e) => setSelectedModel?.(e.target.value)}
            className={`hidden md:block max-w-[140px] rounded-full border bg-transparent px-2.5 py-1.5 text-[11px] font-semibold focus:outline-none ${
              isDark ? 'border-[#3A404A] text-zinc-200' : 'border-[#E6E8EC] text-zinc-700'
            }`}
            title="Модель LLM"
          >
            <option value="qwen3.6-27b">qwen3.6-27b</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gemma4:e4b">gemma4:e4b</option>
            <option value="deepseek-reasoner">deepseek-reasoner</option>
            <option value="nemotron-3-ultra-550b-a55b">nemotron-3-ultra</option>
          </select>

          <button
            id="header-github-token-btn"
            type="button"
            onClick={onOpenTokenModal}
            className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
              githubToken
                ? isDark
                  ? 'border-emerald-800/60 text-emerald-300'
                  : 'border-emerald-200 text-emerald-800'
                : isDark
                ? 'border-[#3A404A] text-zinc-300'
                : 'border-[#E6E8EC] text-zinc-700'
            }`}
            title="Войти / токен модели"
          >
            <Key className="h-3.5 w-3.5" />
            Войти
          </button>

          {sessionRole !== 'guest' && (
            <button
              type="button"
              onClick={() => {
                go('home');
                onResetRole?.();
              }}
              className={`hidden lg:inline-flex items-center rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${
                isDark ? 'border-[#3A404A] text-zinc-300 hover:bg-white/5' : 'border-[#E6E8EC] text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Сменить роль
            </button>
          )}

          {sessionRole === 'dispatcher' ? (
            <button
              type="button"
              onClick={() => go('operator')}
              className="hidden sm:inline-flex items-center rounded-full bg-zinc-700 px-4 py-2 text-[13px] font-bold text-white hover:bg-zinc-800"
            >
              К заявкам
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go('console')}
              className="hidden sm:inline-flex items-center rounded-full bg-zinc-700 px-4 py-2 text-[13px] font-bold text-white hover:bg-zinc-800"
            >
              Пробный запуск
            </button>
          )}

          <button
            id="header-theme-btn"
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`rounded-full border p-2 ${isDark ? 'border-[#3A404A]' : 'border-[#E6E8EC]'}`}
            title="Тема"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            className={`lg:hidden rounded-full border p-2 ${isDark ? 'border-[#3A404A]' : 'border-[#E6E8EC]'}`}
            onClick={() => setOpenMenu(openMenu === 'mobile' ? null : 'mobile')}
            aria-label="Меню"
          >
            {openMenu === 'mobile' ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {openMenu === 'mobile' && (
        <div className={`lg:hidden border-t px-4 py-4 space-y-1 ${isDark ? 'border-[#2C3139]' : 'border-[#E6E8EC]'}`}>
          {navLink('home', 'Главная', <Home className="h-4 w-4" />)}
          {navLink('channels', 'Каналы', <Send className="h-4 w-4" />)}
          {navLink('console', 'Демо-стенд', <Zap className="h-4 w-4" />)}
          {navLink('operator', 'Диспетчер', <User className="h-4 w-4" />, pendingOperatorCount)}
          {navLink('database', 'Реестр', <Database className="h-4 w-4" />)}
          {navLink('logs_traces', 'Логи', <Activity className="h-4 w-4" />)}
          {navLink('architecture', 'Обзор системы', <BookOpen className="h-4 w-4" />)}
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              onRequestDemo?.();
            }}
            className={`w-full rounded-2xl px-3 py-2 text-left text-[13px] font-semibold ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
            }`}
          >
            Запросить показ
          </button>
          {sessionRole !== 'guest' && (
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                onResetRole?.();
              }}
              className={`w-full rounded-2xl px-3 py-2 text-left text-[13px] font-semibold ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
              }`}
            >
              Сменить роль
            </button>
          )}
          <button
            type="button"
            onClick={() => go(sessionRole === 'dispatcher' ? 'operator' : 'console')}
            className="mt-2 w-full rounded-full bg-zinc-700 px-4 py-2.5 text-sm font-bold text-white"
          >
            {sessionRole === 'dispatcher' ? 'К заявкам' : 'Пробный запуск'}
          </button>
        </div>
      )}
    </header>
  );
};
