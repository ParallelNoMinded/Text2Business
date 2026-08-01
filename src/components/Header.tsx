import React from 'react';
import {
  Cpu,
  Database,
  ShieldCheck,
  Zap,
  Activity,
  User,
  Home,
  Sun,
  Moon,
} from 'lucide-react';

export type TabType =
  | 'home'
  | 'console'
  | 'customer'
  | 'ai_engine'
  | 'operator'
  | 'tech_lead'
  | 'matrix'
  | 'database'
  | 'suite';

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
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  geminiActive,
  theme,
  setTheme,
  isDryRun,
  setIsDryRun,
  selectedModel = 'gemini 3.6',
  setSelectedModel,
}) => {
  const isDark = theme === 'dark';

  // Header on landing page (home) is replaced by only the theme toggle button
  if (activeTab === 'home') {
    return (
      <header className="sticky top-0 z-50 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-end">
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
          {/* Logo & Brand -> Navigates to Landing 'home' */}
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

          {/* Top 5 Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 p-1 rounded-xl border font-mono text-xs overflow-x-auto no-scrollbar max-w-xl">
            <button
              id="header-tab-home"
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'home'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-900 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              <span>Главная</span>
            </button>

            <button
              id="header-tab-console"
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'console'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-900 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Процесс</span>
            </button>

            <button
              id="header-tab-operator"
              onClick={() => setActiveTab('operator')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'operator'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-900 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100 font-semibold'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Диспетчер</span>
            </button>

            <button
              id="header-tab-database"
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'database'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-900 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Реестр</span>
            </button>

            <button
              id="header-tab-suite"
              onClick={() => setActiveTab('suite')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'suite' || activeTab === 'matrix'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-900 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100 font-semibold'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Тесты</span>
            </button>
          </nav>

          {/* Controls: Mode Badges & Theme Toggle */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            {/* Model Selector Dropdown (5 Models) */}
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
                onChange={(e) => setSelectedModel && setSelectedModel(e.target.value)}
                className={`bg-transparent text-xs font-mono font-bold focus:outline-none cursor-pointer ${
                  isDark
                    ? 'text-cyan-300 [&>option]:bg-[#060612] [&>option]:text-white'
                    : 'text-blue-950 [&>option]:bg-white [&>option]:text-slate-900'
                }`}
              >
                <option value="glm 5.2">glm 5.2</option>
                <option value="qwen 3.6">qwen 3.6</option>
                <option value="nemotron 550B">nemotron 550B</option>
                <option value="deepseek">deepseek</option>
                <option value="gemini 3.6">gemini 3.6</option>
              </select>
            </div>

            {/* Dry Run Toggle Pill */}
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
              title="Переключить режим записи в БД"
            >
              {isDryRun ? '🔴 ТЕСТОВЫЙ РЕЖИМ' : '🟢 ЖИВАЯ ЗАПИСЬ'}
            </button>

            {/* Light / Dark Mode Switch */}
            <button
              id="theme-toggle-btn"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-1.5 rounded-lg border transition-all ${
                isDark
                  ? 'bg-[#0a0a14] hover:bg-white/10 border-cyan-500/30 text-amber-400'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-blue-900 shadow-sm'
              }`}
              title="Переключить тему оформления"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Horizontal Bar */}
        <div
          className={`flex md:hidden items-center space-x-1 py-2 border-t overflow-x-auto no-scrollbar font-mono text-xs ${
            isDark ? 'border-white/10' : 'border-slate-300'
          }`}
        >
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap font-bold ${
              activeTab === 'home'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-blue-900 text-white'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-700 font-semibold'
            }`}
          >
            Главная
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap font-bold ${
              activeTab === 'console'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-blue-900 text-white'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-700 font-semibold'
            }`}
          >
            Процесс
          </button>
          <button
            onClick={() => setActiveTab('operator')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap font-bold ${
              activeTab === 'operator'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-blue-900 text-white'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-700 font-semibold'
            }`}
          >
            Диспетчер
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap font-bold ${
              activeTab === 'database'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-blue-900 text-white'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-700 font-semibold'
            }`}
          >
            Реестр
          </button>
          <button
            onClick={() => setActiveTab('suite')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap font-bold ${
              activeTab === 'suite'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-blue-900 text-white'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-700 font-semibold'
            }`}
          >
            Тесты
          </button>
        </div>
      </div>
    </header>
  );
};
