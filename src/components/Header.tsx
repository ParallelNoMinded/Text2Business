import React, { useState, useRef, useEffect } from 'react';
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
  Headphones,
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
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modelOptions = [
    { value: 'qwen3.6-27b', label: 'qwen3.6' },
    { value: 'gpt-4o', label: 'gpt-4o' },
    { value: 'gemma4:e4b', label: 'gemma4' },
    { value: 'deepseek-reasoner', label: 'deepseek' },
    { value: 'nemotron-3-ultra-550b-a55b', label: 'nemotron' },
  ];
  const currentModelLabel = modelOptions.find((m) => m.value === selectedModel)?.label || selectedModel;

  if (activeTab === 'home' || activeTab === 'operator' || activeTab === 'database' || activeTab === 'channels' || activeTab === 'console' || activeTab === 'logs_traces' || activeTab === 'architecture') {
    return (
      <>
        <aside className={`fixed inset-y-0 left-0 z-50 hidden w-[300px] flex-col px-3 py-11 lg:flex ${isDark ? 'bg-[#29263d] text-white' : 'bg-[#29263d] text-white'}`}>
          <button type="button" onClick={() => setActiveTab('home')} className="flex items-center gap-4 px-2 text-left">
            <span className="relative flex h-12 w-12 rotate-45 items-center justify-center rounded-lg bg-[#4bc9cf]">
              <span className="grid h-7 w-7 -rotate-45 grid-cols-3 gap-[2px] rounded-sm border-2 border-white p-[3px]">
                {Array.from({ length: 9 }).map((_, index) => (
                  <span key={index} className={`rounded-[1px] border border-white ${index === 7 ? 'bg-white' : ''}`} />
                ))}
              </span>
            </span>
            <span>
              <span className="block text-xl font-black leading-none">TEXT2BUSINESS</span>
              <span className="mt-1 block text-sm font-extrabold text-[#49ccd0]">AI-ДИСПЕТЧЕР</span>
            </span>
          </button>
          <nav className="mt-12 space-y-2 text-lg font-extrabold">
            {[
              { tab: 'home' as TabType, label: 'Главная', icon: Home },
              { tab: 'operator' as TabType, label: 'Диспетчер', icon: Headphones },
              { tab: 'database' as TabType, label: 'Реестр', icon: Database },
              { tab: 'channels' as TabType, label: 'Каналы', icon: Send },
              { tab: 'console' as TabType, label: 'Демо-стенд', icon: Zap },
              { tab: 'logs_traces' as TabType, label: 'Логи и трейсы', icon: Activity },
              { tab: 'architecture' as TabType, label: 'Архитектура', icon: BookOpen },
            ].map(({ tab, label, icon: Icon }) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex h-14 w-full items-center gap-4 rounded-xl px-5 text-left transition ${
                  activeTab === tab ? 'bg-[#2e7d7c] text-white' : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-7 border-t border-white/10 bg-[#29263d] px-1 py-1 text-white shadow-2xl lg:hidden">
          {[
            { tab: 'home' as TabType, label: 'Главная', icon: Home },
            { tab: 'operator' as TabType, label: 'Дисп.', icon: Headphones },
            { tab: 'database' as TabType, label: 'Реестр', icon: Database },
            { tab: 'channels' as TabType, label: 'Каналы', icon: Send },
            { tab: 'console' as TabType, label: 'Демо', icon: Zap },
            { tab: 'logs_traces' as TabType, label: 'Логи', icon: Activity },
            { tab: 'architecture' as TabType, label: 'Арх.', icon: BookOpen },
          ].map(({ tab, label, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-[9px] font-bold sm:text-[11px] ${activeTab === tab ? 'bg-[#2e7d7c]' : ''}`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="max-w-full truncate">{label}</span>
            </button>
          ))}
        </nav>
        <header className="sticky top-0 z-40 px-4 pt-4 pointer-events-none lg:ml-[300px] lg:px-10 lg:pt-10">
        <div className="mx-auto flex max-w-[1780px] justify-end items-center space-x-2 sm:space-x-3">
          <div className={`pointer-events-auto hidden min-h-13 min-w-[154px] items-center justify-center rounded-xl border px-3 text-center text-sm font-semibold leading-tight shadow-md sm:flex ${
            isDark ? 'border-slate-700 bg-[#242438] text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'border-[#c8c8c8] bg-white text-black'
          }`}>
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
            {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>

          <button
            id="theme-toggle-btn"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`pointer-events-auto p-3 rounded-xl border transition-all shadow-md ${
              isDark
                ? 'bg-[#242438] hover:bg-white/10 border-slate-700 text-amber-400 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                : 'bg-white hover:bg-slate-50 border-[#c8c8c8] text-amber-500'
            }`}
            title="Переключить тему оформления"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Animated Centered Model Dropdown */}
          <div ref={modelDropdownRef} className="relative pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold shadow-md transition outline-none sm:min-h-13 ${
                isDark ? 'border-slate-700 bg-[#242438] text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-white/5' : 'border-[#c8c8c8] bg-white text-black hover:bg-slate-50'
              }`}
              aria-label="Выбор AI-модели"
            >
              <span className="font-bold">{currentModelLabel}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 text-slate-400 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown list with animation */}
            <div
              className={`absolute right-0 mt-2 w-48 rounded-xl border p-1 shadow-2xl transition-all duration-200 z-50 origin-top-right ${
                isModelDropdownOpen
                  ? 'scale-100 opacity-100 pointer-events-auto'
                  : 'scale-95 opacity-0 pointer-events-none'
              } ${isDark ? 'border-slate-700 bg-[#242438] text-white' : 'border-[#c8c8c8] bg-white text-black'}`}
            >
              {modelOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedModel?.(opt.value);
                    setIsModelDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-bold transition ${
                    selectedModel === opt.value
                      ? 'bg-[#2D7A7A] text-white'
                      : isDark
                      ? 'hover:bg-white/10 text-slate-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      </>
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

            {/* 3. Демо-стенд */}
            <button
              id="header-tab-console"
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'console'
                  ? isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'bg-blue-950 text-white font-extrabold shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-900 hover:text-blue-950 hover:bg-slate-200/80 font-bold'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Демо-стенд</span>
            </button>

            {/* 4. Диспетчер (Pulsing Red Attention Badge if pending tickets exist) */}
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

            {/* 5. Реестр */}
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

            {/* 6. Логи & Трейсы */}
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
