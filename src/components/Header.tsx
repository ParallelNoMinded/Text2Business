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
        <div className="max-w-7xl mx-auto flex justify-end items-center space-x-2">
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

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 border-b backdrop-blur-md ${
        isDark
          ? 'bg-[#030712]/90 border-cyan-500/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center space-x-2.5 cursor-pointer group flex-shrink-0"
            title="Перейти на главную страницу"
          >
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isDark
                  ? 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                  : 'bg-transparent'
              }`}
            >
              <div
                className={`h-full w-full rounded-[10px] flex items-center justify-center ${
                  isDark ? 'bg-[#030712]' : 'bg-transparent'
                }`}
              >
                <Cpu className={`h-5 w-5 ${isDark ? 'text-cyan-400' : 'text-blue-950'}`} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`font-extrabold text-xs sm:text-sm tracking-tight font-mono uppercase leading-none ${isDark ? 'text-white' : 'text-blue-950'}`}>
                TEXT2BUSINESS
              </span>
              <span className={`text-[10px] font-mono tracking-widest font-bold uppercase mt-0.5 leading-none ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                AI-ДИСПЕТЧЕР
              </span>
            </div>
          </div>

          {/* Top 5 Clean Navigation Tabs */}
          <nav className={`hidden md:flex items-center space-x-1 p-1 rounded-xl border font-mono text-xs overflow-x-auto no-scrollbar max-w-2xl ${
            isDark ? 'border-cyan-500/30 bg-[#020204]/60' : 'border-slate-300 bg-slate-100/90 shadow-inner'
          }`}>
            {/* 1. Главная */}
            <button
              id="header-tab-home"
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'home'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-950 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-900 hover:text-blue-950 hover:bg-slate-200/80 font-bold'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              <span>Главная</span>
            </button>

            {/* 2. Каналы */}
            <button
              id="header-tab-channels"
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'channels' || activeTab === 'console'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-950 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-900 hover:text-blue-950 hover:bg-slate-200/80 font-bold'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Каналы</span>
            </button>

            {/* 3. Диспетчер (Pulsing Red Attention Badge if pending tickets exist) */}
            <button
              id="header-tab-operator"
              onClick={() => setActiveTab('operator')}
              className={`relative px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'operator'
                  ? isDark
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'bg-red-950 text-white font-extrabold shadow-sm'
                  : isDark
                  ? pendingOperatorCount > 0
                    ? 'text-red-400 hover:bg-red-500/10 border border-red-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  : pendingOperatorCount > 0
                  ? 'text-red-800 bg-red-100/90 border border-red-300 font-extrabold'
                  : 'text-slate-900 hover:text-blue-950 hover:bg-slate-200/80 font-bold'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Диспетчер</span>
              {pendingOperatorCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5"></span>
              )}
            </button>

            {/* 4. Реестр */}
            <button
              id="header-tab-database"
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'database'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-950 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-900 hover:text-blue-950 hover:bg-slate-200/80 font-bold'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Реестр</span>
            </button>

            {/* 5. Логи & Трейсы */}
            <button
              id="header-tab-logs-traces"
              onClick={() => setActiveTab('logs_traces')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'logs_traces'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-950 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-900 hover:text-blue-950 hover:bg-slate-200/80 font-bold'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Логи & Трейсы</span>
            </button>
          </nav>

          {/* Controls: Model Selector, GITHUB_MODELS_TOKEN, Architecture Book & Theme Toggle */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold ${
                isDark
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-blue-50 border-blue-200 text-blue-950 font-bold'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 animate-pulse ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
              <select
                id="header-model-dropdown"
                value={selectedModel}
                onChange={(e) => {
                  const newModel = e.target.value;
                  if (setSelectedModel) setSelectedModel(newModel);
                }}
                className={`bg-transparent text-xs font-mono font-bold focus:outline-none cursor-pointer ${
                  isDark
                    ? 'text-cyan-300 [&>option]:bg-[#060612] [&>option]:text-white'
                    : 'text-blue-950 [&>option]:bg-white [&>option]:text-slate-900'
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
              className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-[11px] transition flex items-center space-x-1 ${
                githubToken
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold hover:bg-emerald-200'
                  : isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                  : 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold hover:bg-amber-200 animate-pulse'
              }`}
              title="Настроить GITHUB_MODELS_TOKEN"
            >
              <Key className="h-3 w-3" />
              <span>{githubToken ? 'G_TOKEN: ✅' : 'G_TOKEN: 🔑'}</span>
            </button>

            <button
              id="header-dryrun-toggle"
              type="button"
              onClick={() => setIsDryRun(!isDryRun)}
              className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-[11px] transition ${
                isDryRun
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold'
                  : isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold'
              }`}
            >
              {isDryRun ? 'ТЕСТОВЫЙ РЕЖИМ' : 'ПРОМ 1С'}
            </button>

            {/* Book Icon Button to Open Architecture Report */}
            <button
              id="header-architecture-btn"
              onClick={() => setActiveTab('architecture')}
              className={`p-2 rounded-lg border transition-all ${
                activeTab === 'architecture'
                  ? isDark
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                    : 'bg-blue-950 text-white border-blue-900'
                  : isDark
                  ? 'bg-white/5 hover:bg-cyan-500/20 border-white/10 text-cyan-400'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-blue-950'
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
};
