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
  AlertTriangle,
  Key,
  BookOpen,
} from 'lucide-react';

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
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  isDryRun,
  setIsDryRun,
  selectedModel = 'gpt-4o',
  setSelectedModel,
  pendingOperatorCount = 1,
  githubToken = '',
  onOpenTokenModal,
}) => {
  const isDark = theme === 'dark';

  if (activeTab === 'home') {
    return (
      <header className="sticky top-0 z-50 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-end items-center gap-2">
          <button
            id="book-architecture-btn-home"
            onClick={() => setActiveTab('architecture')}
            className={`pointer-events-auto p-2.5 rounded-lg border transition-all flex items-center gap-2 font-mono text-xs font-medium ${
              isDark
                ? 'bg-oc-bg-2/90 hover:bg-oc-hover border-oc-border text-oc-accent backdrop-blur-md shadow-sm'
                : 'bg-white/90 hover:bg-oc-hover border-oc-border text-oc-accent shadow-sm backdrop-blur-md'
            }`}
            title="Открыть архитектурный отчёт и C4 схемы"
          >
            <BookOpen className="h-4 w-4" />
          </button>

          <button
            id="theme-toggle-btn"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`pointer-events-auto p-2.5 rounded-lg border transition-all ${
              isDark
                ? 'bg-oc-bg-2/90 hover:bg-oc-hover border-oc-border text-oc-warning backdrop-blur-md shadow-sm'
                : 'bg-white/90 hover:bg-oc-hover border-oc-border text-oc-warning shadow-sm backdrop-blur-md'
            }`}
            title="Переключить тему оформления"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 border-b backdrop-blur-md ${
        isDark
          ? 'bg-oc-bg/95 border-oc-border text-oc-text shadow-sm'
          : 'bg-white/95 border-oc-border text-oc-text shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
            title="Перейти на главную страницу"
          >
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                isDark
                  ? 'bg-oc-surface border border-oc-border'
                  : 'bg-oc-surface border border-oc-border'
              }`}
            >
              <Cpu className={`h-5 w-5 text-oc-accent`} />
            </div>
            <div className="flex flex-col">
              <span className={`font-semibold text-xs sm:text-sm tracking-tight font-mono uppercase leading-none text-oc-text`}>
                TEXT2BUSINESS
              </span>
              <span className={`text-[10px] font-mono tracking-widest font-medium uppercase mt-0.5 leading-none text-oc-accent`}>
                AI-ДИСПЕТЧЕР
              </span>
            </div>
          </div>

          {/* Top 5 Clean Navigation Tabs */}
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-lg border font-mono text-xs overflow-x-auto no-scrollbar max-w-2xl ${
            isDark ? 'border-oc-border bg-oc-bg-2/60' : 'border-oc-border bg-oc-bg-2/60'
          }`}>
            {/* 1. Главная */}
            <button
              id="header-tab-home"
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'home'
                  ? isDark
                    ? 'bg-oc-surface text-oc-accent border border-oc-border'
                    : 'bg-oc-surface text-oc-accent border border-oc-border'
                  : isDark
                  ? 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
                  : 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              <span>Главная</span>
            </button>

            {/* 2. Каналы */}
            <button
              id="header-tab-channels"
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'channels' || activeTab === 'console'
                  ? isDark
                    ? 'bg-oc-surface text-oc-accent border border-oc-border'
                    : 'bg-oc-surface text-oc-accent border border-oc-border'
                  : isDark
                  ? 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
                  : 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Каналы</span>
            </button>

            {/* 3. Демо-стенд */}
            <button
              id="header-tab-console"
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'console'
                  ? isDark
                    ? 'bg-oc-surface text-oc-accent border border-oc-border'
                    : 'bg-oc-surface text-oc-accent border border-oc-border'
                  : isDark
                  ? 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
                  : 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Демо-стенд</span>
            </button>

            {/* 4. Диспетчер (Pulsing Red Attention Badge if pending tickets exist) */}
            <button
              id="header-tab-operator"
              onClick={() => setActiveTab('operator')}
              className={`relative px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'operator'
                  ? isDark
                    ? 'bg-oc-surface text-oc-critical border border-oc-border'
                    : 'bg-oc-surface text-oc-critical border border-oc-border'
                  : isDark
                  ? pendingOperatorCount > 0
                    ? 'text-oc-critical hover:bg-oc-hover border border-oc-border'
                    : 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
                  : pendingOperatorCount > 0
                  ? 'text-oc-critical hover:bg-oc-hover border border-oc-border'
                  : 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Диспетчер</span>
              {pendingOperatorCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-oc-critical animate-pulse absolute -top-0.5 -right-0.5"></span>
              )}
            </button>

            {/* 5. Реестр */}
            <button
              id="header-tab-database"
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'database'
                  ? isDark
                    ? 'bg-oc-surface text-oc-accent border border-oc-border'
                    : 'bg-oc-surface text-oc-accent border border-oc-border'
                  : isDark
                  ? 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
                  : 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Реестр</span>
            </button>

            {/* 6. Логи & Трейсы */}
            <button
              id="header-tab-logs-traces"
              onClick={() => setActiveTab('logs_traces')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'logs_traces'
                  ? isDark
                    ? 'bg-oc-surface text-oc-accent border border-oc-border'
                    : 'bg-oc-surface text-oc-accent border border-oc-border'
                  : isDark
                  ? 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
                  : 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Логи & Трейсы</span>
            </button>
          </nav>

          {/* Controls: Model Selector, GITHUB_MODELS_TOKEN, Architecture Book & Theme Toggle */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium ${
                isDark
                  ? 'bg-oc-bg-2 border-oc-border text-oc-accent'
                  : 'bg-oc-bg-2 border-oc-border text-oc-accent'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 text-oc-accent`} />
              <select
                id="header-model-dropdown"
                value={selectedModel}
                onChange={(e) => {
                  const newModel = e.target.value;
                  if (setSelectedModel) setSelectedModel(newModel);
                }}
                className={`bg-transparent text-xs font-mono font-medium focus:outline-none cursor-pointer ${
                  isDark
                    ? 'text-oc-accent [&>option]:bg-oc-bg-2 [&>option]:text-oc-text'
                    : 'text-oc-accent [&>option]:bg-white [&>option]:text-oc-text'
                }`}
              >
                <option value="qwen3.6-27b">qwen3.6-27b</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gemma4:e4b">gemma4:e4b</option>
                <option value="deepseek-reasoner">deepseek-reasoner</option>
                <option value="nemotron-3-ultra-550b-a55b">nemotron-3-ultra-550b-a55b</option>
              </select>
            </div>

            <button
              id="header-github-token-btn"
              type="button"
              onClick={onOpenTokenModal}
              className={`px-2.5 py-1 rounded-lg border font-mono font-medium text-[11px] transition flex items-center gap-1 ${
                githubToken
                  ? isDark
                    ? 'bg-oc-success/20 text-oc-success border-oc-success/30 hover:bg-oc-success/30'
                    : 'bg-oc-success/20 text-oc-success border-oc-success/30 hover:bg-oc-success/30'
                  : isDark
                  ? 'bg-oc-warning/20 text-oc-warning border-oc-warning/30 hover:bg-oc-warning/30'
                  : 'bg-oc-warning/20 text-oc-warning border-oc-warning/30 hover:bg-oc-warning/30'
              }`}
              title="Настроить GITHUB_MODELS_TOKEN"
            >
              <Key className="h-3 w-3" />
              <span>{githubToken ? 'G_TOKEN: ✅' : 'G_TOKEN: 🔑'}</span>
            </button>

            <button
              id="header-architecture-btn"
              onClick={() => setActiveTab('architecture')}
              className={`p-2 rounded-lg border transition-all ${
                activeTab === 'architecture'
                  ? isDark
                    ? 'bg-oc-surface border-oc-border text-oc-accent'
                    : 'bg-oc-surface border-oc-border text-oc-accent'
                  : isDark
                  ? 'bg-oc-bg-2 hover:bg-oc-hover border-oc-border text-oc-accent'
                  : 'bg-oc-bg-2 hover:bg-oc-hover border-oc-border text-oc-accent'
              }`}
              title="Открыть архитектурный отчёт и C4 схемы"
            >
              <BookOpen className="h-4 w-4" />
            </button>

            <button
              id="header-theme-btn"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-lg border transition-all ${
                isDark
                  ? 'bg-oc-bg-2 hover:bg-oc-hover border-oc-border text-oc-warning'
                  : 'bg-oc-bg-2 hover:bg-oc-hover border-oc-border text-oc-warning'
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
};