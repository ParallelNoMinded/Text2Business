import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Database,
  Zap,
  Activity,
  User,
  Home,
  Sun,
  Moon,
  Send,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

export type TabType =
  | 'home'
  | 'channels'
  | 'console'
  | 'operator'
  | 'database'
  | 'logs_traces'
  | 'architecture';

export type UserRole = 'dispatcher' | 'admin';

const MODEL_OPTIONS = [
  'qwen3.6-27b',
  'gpt-4o',
  'gemma4:e4b',
  'deepseek-reasoner',
  'nemotron-3-ultra-550b-a55b',
];

const WIDEST_MODEL_LABEL = MODEL_OPTIONS.reduce((a, b) => (b.length > a.length ? b : a));

interface ModelSelectProps {
  value: string;
  onChange: (model: string) => void;
  isDark: boolean;
  id?: string;
}

// Кастомный выпадающий список выбора модели ИИ.
// Ширина кнопки зафиксирована по самому широкому пункту меню (невидимый sizer).
export const ModelSelect: React.FC<ModelSelectProps> = ({ value, onChange, isDark, id }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      {/* Невидимый sizer: ширина контейнера = самый широкий пункт меню */}
      <span
        aria-hidden
        className={`invisible whitespace-nowrap font-mono text-xs font-bold pl-7 pr-8 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {WIDEST_MODEL_LABEL}
      </span>

      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={`absolute inset-0 flex items-center gap-1.5 px-2.5 rounded-lg border font-mono text-xs font-bold transition-all whitespace-nowrap ${
          isDark
            ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white hover:border-slate-500/50'
            : 'bg-white border-slate-300 text-slate-900 shadow-sm hover:border-blue-900/50'
        } ${open && isDark ? 'border-slate-400/60' : ''}`}
        title="Выбрать модель ИИ"
      >
        <Zap className={`h-3.5 w-3.5 flex-shrink-0 ${isDark ? 'text-slate-300' : 'text-blue-900'}`} />
        <span className="flex-1 text-left truncate">{value}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${
            isDark ? 'text-slate-400' : 'text-slate-700'
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1.5 z-[60] min-w-full w-max rounded-xl border overflow-hidden shadow-2xl backdrop-blur-md ${
            isDark
              ? 'bg-[#1C1B1B]/95 border-[#2A2A2A] shadow-[0_10px_30px_rgba(0,0,0,0.7)]'
              : 'bg-white/95 border-slate-300 shadow-xl'
          }`}
        >
          {MODEL_OPTIONS.map((model) => {
            const isActive = model === value;
            return (
              <button
                key={model}
                type="button"
                onClick={() => {
                  onChange(model);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left font-mono text-xs whitespace-nowrap transition ${
                  isActive
                    ? isDark
                      ? 'bg-[#222222] text-slate-100 font-bold'
                      : 'bg-blue-950 text-white font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-blue-950 font-semibold'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Zap
                    className={`h-3 w-3 ${
                      isActive
                        ? isDark
                          ? 'text-slate-300'
                          : 'text-blue-100'
                        : isDark
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  />
                  {model}
                </span>
                {isActive && (
                  <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-slate-300' : 'bg-blue-100'}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userRole?: UserRole;
  setUserRole?: (role: UserRole) => void;
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
  onNavigateHome?: () => void;
  setHomeRoleSelection?: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userRole = 'admin',
  setUserRole,
  theme,
  setTheme,
  selectedModel = 'gpt-4o',
  setSelectedModel,
  pendingOperatorCount = 0,
  githubToken = '',
  onOpenTokenModal,
  setHomeRoleSelection,
  onNavigateHome,
}) => {
  const isDark = theme === 'dark';
  const dispatcherTabs: TabType[] = ['console', 'operator'];
  const adminTabs: TabType[] = ['channels', 'console', 'operator', 'database', 'logs_traces', 'architecture'];
  const visibleTabs = userRole === 'dispatcher' ? dispatcherTabs : adminTabs;

  const getTabLabel = (tab: TabType) => {
    if (tab === 'home') return 'Главная';
    if (tab === 'channels') return 'Каналы';
    if (tab === 'console') return 'Демо-стенд';
    if (tab === 'operator') return 'Заявки';
    if (tab === 'database') return 'Реестр';
    if (tab === 'logs_traces') return 'Логи & Трейсы';
    return 'Архитектура';
  };

  const getTabIcon = (tab: TabType) => {
    if (tab === 'home') return Home;
    if (tab === 'channels') return Send;
    if (tab === 'console') return Zap;
    if (tab === 'operator') return User;
    if (tab === 'database') return Database;
    if (tab === 'logs_traces') return Activity;
    return BookOpen;
  };

  const roleOptions: UserRole[] = ['dispatcher', 'admin'];

  if (activeTab === 'home') {
    return (
      <header className="sticky top-0 z-50 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-end items-center gap-2">
          <button
            id="theme-toggle-btn"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`pointer-events-auto p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-[#06060e]/90 hover:bg-white/10 border-[#2A2A2A] text-slate-300 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                : 'bg-white/90 hover:bg-slate-100 border-slate-300 text-blue-900 shadow-md backdrop-blur-md'
            }`}
            title="Переключить тему оформления"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>
    );
  }

  // Simplified header for dispatcher (use same layout for console and operator)
  if (userRole === 'dispatcher') {
    return (
      <header className={`sticky top-0 z-50 transition-colors duration-200 border-b backdrop-blur-md ${isDark ? 'bg-[#141414]/90 border-[#2A2A2A] text-white' : 'bg-white/95 border-slate-300 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
              <div className="flex items-center gap-3">
                <div onClick={() => onNavigateHome ? onNavigateHome() : setActiveTab('home')} className="flex items-center space-x-2.5 cursor-pointer">
                  <div className="flex items-center">
                    <span className={`font-extrabold text-sm tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>T2B AI</span>
                  </div>
                </div>
                <nav className={`flex items-center gap-3 p-1 rounded-xl border font-mono text-xs bg-transparent ${isDark ? 'border-red-500/30' : 'border-red-300'}`}>
              {(() => {
                const isConsoleActive = activeTab === 'console';
                const isOperatorActive = activeTab === 'operator';
                return (
                  <>
                    <button
                      onClick={() => setActiveTab('console')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold transition ${isConsoleActive ? (isDark ? 'bg-[#222222] text-slate-100 border border-[#2A2A2A]' : 'bg-blue-950 text-white') : isDark ? 'text-slate-300 bg-transparent hover:text-white hover:bg-white/5' : 'text-slate-900 bg-transparent hover:text-blue-950 hover:bg-slate-200/80'}`}
                    >
                      <Zap className="h-4 w-4" />
                      Демо-стенд
                    </button>

                    <button
                      onClick={() => setActiveTab('operator')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold transition ${isOperatorActive ? (isDark ? 'bg-[#222222] text-slate-100 border border-[#2A2A2A]' : 'bg-blue-950 text-white') : isDark ? 'text-slate-300 bg-transparent hover:text-white hover:bg-white/5' : 'text-slate-900 bg-transparent hover:text-blue-950 hover:bg-slate-200/80'}`}
                    >
                      <User className="h-4 w-4" />
                      <span>Заявки</span>
                      {pendingOperatorCount > 0 && <span className="ml-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                    </button>
                  </>
                );
              })()}
                </nav>
              </div>

            <div className="flex items-center gap-2">
              <ModelSelect
                id="header-model-dropdown-dispatcher"
                value={selectedModel}
                onChange={(m) => setSelectedModel?.(m)}
                isDark={isDark}
              />
              <button
                id="header-theme-btn-dispatcher"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`ml-2 p-2 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-400'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-blue-950'
                }`}
                title="Переключить тему"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 border-b backdrop-blur-md ${
        isDark
          ? 'bg-[#141414]/90 border-[#2A2A2A] text-white shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          <div className="flex items-center gap-3">
            <div
              onClick={() => onNavigateHome ? onNavigateHome() : setActiveTab('home')}
              className="flex items-center space-x-2.5 cursor-pointer group flex-shrink-0"
              title="Перейти на главную страницу"
            >
              <div className="flex items-center">
                <span className={`font-extrabold text-sm tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>T2B AI</span>
              </div>
            </div>

            <nav className={`hidden md:flex items-center justify-start gap-3 p-1 rounded-xl border font-mono text-xs ${
              isDark ? 'border-[#2A2A2A] bg-[#141414]' : 'border-slate-300 bg-slate-100/90 shadow-inner'
            }`}>
            {visibleTabs.map((tab) => {
              const Icon = getTabIcon(tab);
              const isActive = activeTab === tab;
              const isOperator = tab === 'operator';

              return (
                <button
                  key={tab}
                  id={`header-tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                    isActive
                      ? isDark
                        ? 'bg-[#222222] text-slate-100 border border-[#2A2A2A]'
                        : 'bg-blue-950 text-white font-extrabold shadow-sm'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-900 hover:text-blue-950 hover:bg-slate-200/80 font-bold'
                  }`}
                >
                  <Icon className="h-4 w-4 opacity-90" />
                  <span>{getTabLabel(tab)}</span>
                  {isOperator && pendingOperatorCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse absolute -top-0.5 -right-0.5"></span>
                  )}
                </button>
              );
            })}
          </nav>

          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {userRole === 'dispatcher' ? (
              <div className="hidden sm:flex items-center gap-2">
                <ModelSelect
                  id="header-model-dropdown"
                  value={selectedModel}
                  onChange={(m) => setSelectedModel?.(m)}
                  isDark={isDark}
                />
                <button
                  id="header-theme-btn-dispatcher"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className={`p-2 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-400'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-blue-950'
                  }`}
                  title="Переключить тему"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <>

                <div className="hidden sm:flex items-center">
                  <ModelSelect
                    id="header-model-dropdown"
                    value={selectedModel}
                    onChange={(m) => {
                      if (setSelectedModel) setSelectedModel(m);
                    }}
                    isDark={isDark}
                  />
                </div>
                <button
                  id="header-theme-btn"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className={`p-2 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-400'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-blue-950'
                  }`}
                  title="Переключить тему"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Role selector removed: role switching only via LandingHome */}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
