import React from 'react';
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
            id="book-architecture-btn-home"
            onClick={() => setActiveTab('architecture')}
            className={`pointer-events-auto p-2.5 rounded-xl border transition-all flex items-center space-x-2 font-mono text-xs font-bold ${
              isDark
                ? 'bg-[#06060e]/90 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                : 'bg-white/90 hover:bg-slate-100 border-slate-300 text-blue-900 shadow-md backdrop-blur-md'
            }`}
            title="Открыть архитектурный отчёт и C4 схемы"
          >
            <BookOpen className="h-5 w-5 text-cyan-400" />
          </button>

          <button
            id="theme-toggle-btn"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`pointer-events-auto p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-[#06060e]/90 hover:bg-white/10 border-cyan-500/30 text-amber-400 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)]'
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
      <header className={`sticky top-0 z-50 transition-colors duration-200 border-b backdrop-blur-md ${isDark ? 'bg-[#141414]/90 border-cyan-500/20 text-white' : 'bg-white/95 border-slate-300 text-slate-900'}`}>
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
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold transition ${isConsoleActive ? (isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-blue-950 text-white') : 'text-slate-300 bg-transparent hover:text-white hover:bg-white/5'}`}
                    >
                      <Zap className="h-4 w-4" />
                      Демо-стенд
                    </button>

                    <button
                      onClick={() => setActiveTab('operator')}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold transition ${isOperatorActive ? (isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-blue-950 text-white') : 'text-slate-300 bg-transparent hover:text-white hover:bg-white/5'}`}
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
              <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold w-36 bg-[#0B2731] border-[#0B2731] text-white">
                <Zap className={`h-3.5 w-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
                <select
                  id="header-model-dropdown-dispatcher"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel?.(e.target.value)}
                  className={`appearance-none bg-[#0B2731] text-white text-xs font-mono font-bold focus:outline-none cursor-pointer w-full [&>option]:bg-[#0B2731] [&>option]:text-white`}
                >
                  <option value="qwen3.6-27b">qwen3.6-27b</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gemma4:e4b">gemma4:e4b</option>
                  <option value="deepseek-reasoner">deepseek-reasoner</option>
                  <option value="nemotron-3-ultra-550b-a55b">nemotron-3-ultra-550b-a55b</option>
                </select>
                <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              </div>
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
          ? 'bg-[#141414]/90 border-cyan-500/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
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
              isDark ? 'border-cyan-500/30 bg-[#141414]' : 'border-slate-300 bg-slate-100/90 shadow-inner'
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
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
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
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold ${
                isDark
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-blue-50 border-blue-200 text-blue-950 font-bold'
              }`}>
                <Zap className={`h-3.5 w-3.5 animate-pulse ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
                <select id="header-model-dropdown" value={selectedModel} onChange={(e) => setSelectedModel?.(e.target.value)} className={`bg-transparent text-xs font-mono font-bold focus:outline-none cursor-pointer w-full ${isDark ? 'text-cyan-300 [&>option]:bg-[#060612] [&>option]:text-white' : 'text-blue-950 [&>option]:bg-white [&>option]:text-slate-900'}`}>
                  <option value="qwen3.6-27b">qwen3.6-27b</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gemma4:e4b">gemma4:e4b</option>
                  <option value="deepseek-reasoner">deepseek-reasoner</option>
                  <option value="nemotron-3-ultra-550b-a55b">nemotron-3-ultra-550b-a55b</option>
                </select>
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
            ) : (
              <>

                <div className="relative hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold w-36 bg-[#0B2731] border-[#0B2731] text-white">
                  <Zap className={`h-3.5 w-3.5 animate-pulse ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
                  <select
                    id="header-model-dropdown"
                    value={selectedModel}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      if (setSelectedModel) setSelectedModel(newModel);
                    }}
                    className={`appearance-none bg-[#0B2731] text-white text-xs font-mono font-bold focus:outline-none cursor-pointer w-full [&>option]:bg-[#0B2731] [&>option]:text-white`}
                  >
                    <option value="qwen3.6-27b">qwen3.6-27b</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gemma4:e4b">gemma4:e4b</option>
                    <option value="deepseek-reasoner">deepseek-reasoner</option>
                    <option value="nemotron-3-ultra-550b-a55b">nemotron-3-ultra-550b-a55b</option>
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
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
