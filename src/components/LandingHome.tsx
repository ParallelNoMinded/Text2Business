import React from 'react';
import { TabType } from './Header';
import { ParticleSwarmCanvas } from './ParticleSwarmCanvas';
import {
  Activity,
  UserCheck,
  Database,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from 'lucide-react';

interface LandingHomeProps {
  setActiveTab: (tab: TabType) => void;
  theme?: 'dark' | 'light';
  onRunPreset?: (presetId: string) => void;
}

export const LandingHome: React.FC<LandingHomeProps> = ({
  setActiveTab,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-between gap-4 sm:gap-6 animate-fadeIn py-2 sm:py-4">
      {/* GLOBAL PARTICLE SWARM BACKGROUND SHIFTED TO TOP-LEFT */}
      <ParticleSwarmCanvas theme={theme} className="opacity-90 dark:opacity-100" />

      {/* 1. HERO SECTION WITH GLASS EFFECT TO SHOW TOP-LEFT SWARM */}
      <div
        className={`relative z-10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border text-center flex-1 flex flex-col items-center justify-center transition-all ${
          isDark
            ? 'bg-[#060612]/60 border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-sm'
            : 'bg-white/70 border-blue-900/30 shadow-md backdrop-blur-sm'
        }`}
      >
        {/* Subtle background radial accent */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] rounded-2xl sm:rounded-3xl" />

        <div className="relative z-30 max-w-3xl mx-auto space-y-3 sm:space-y-5 my-auto">
          {/* Brand Header: TEXT2BUSINESS with AI-ДИСПЕТЧЕР */}
          <div className="inline-flex items-center justify-center space-x-2.5 sm:space-x-3 mb-0.5">
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                isDark
                  ? 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg'
                  : 'bg-transparent'
              }`}
            >
              <div
                className={`h-full w-full rounded-[10px] sm:rounded-[14px] flex items-center justify-center ${
                  isDark ? 'bg-[#030712]' : 'bg-transparent'
                }`}
              >
                <Cpu className={`h-6 w-6 sm:h-7 sm:w-7 ${isDark ? 'text-cyan-400' : 'text-blue-950'}`} />
              </div>
            </div>
            <div className="text-left flex flex-col">
              <span
                className={`text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-mono uppercase leading-none ${
                  isDark ? 'text-white' : 'text-blue-950'
                }`}
              >
                TEXT2BUSINESS
              </span>
              <span
                className={`text-[11px] sm:text-xs font-mono font-bold tracking-widest uppercase mt-0.5 sm:mt-1 leading-none ${
                  isDark ? 'text-cyan-400' : 'text-blue-700'
                }`}
              >
                AI-ДИСПЕТЧЕР
              </span>
            </div>
          </div>

          {/* Hero Headline */}
          <h1
            className={`text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-blue-950'
            }`}
          >
            Превращайте свободный текст в{' '}
            <span
              className={
                isDark
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400'
                  : 'text-blue-900'
              }
            >
              контролируемое бизнес-действие
            </span>
          </h1>

          <p
            className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-sans ${
              isDark ? 'text-slate-300' : 'text-slate-700 font-medium'
            }`}
          >
            Промышленный AI-Диспетчер сервисного обслуживания холодильного оборудования с моментальным извлечением фактов, дедупликацией заявок по базами данных и строгим контролем SLA.
          </p>
        </div>
      </div>

      {/* 2. NAVIGATION TILES DIRECTLY UNDER THE HERO STATEMENT (RESPONSIVE ADAPTIVE FIT) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
        {/* Tile 1: Process */}
        <div
          id="home-tile-pipeline"
          onClick={() => setActiveTab('console')}
          className={`relative z-10 p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between group ${
            isDark
              ? 'bg-[#060612]/60 border-cyan-500/30 hover:border-cyan-400 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-sm'
              : 'bg-white/70 border-blue-900/30 hover:border-blue-900 shadow-sm hover:shadow-md backdrop-blur-sm'
          }`}
        >
          <div className="relative z-30">
            <div className="flex items-center justify-between mb-2">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                    : 'bg-blue-100 border border-blue-300 text-blue-900'
                }`}
              >
                <Activity className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  isDark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-blue-900 text-white font-extrabold'
                }`}
              >
                ПРОЦЕСС
              </span>
            </div>
            <h3
              className={`text-sm sm:text-base font-bold font-mono mb-1 ${
                isDark ? 'text-white' : 'text-blue-950'
              }`}
            >
              1. Процесс
            </h3>
            <p
              className={`text-xs leading-snug ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
              }`}
            >
              Ввод обращения, извлечение фактов и автоматическая диспетчеризация.
            </p>
          </div>

          <div
            className={`relative z-30 mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-mono font-bold transition-transform group-hover:translate-x-1 ${
              isDark
                ? 'border-white/10 text-cyan-400'
                : 'border-slate-200 text-blue-900'
            }`}
          >
            <span>Открыть модуль</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* Tile 2: Dispatcher */}
        <div
          id="home-tile-operator"
          onClick={() => setActiveTab('operator')}
          className={`relative z-10 p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between group ${
            isDark
              ? 'bg-[#06060e]/60 border-cyan-500/30 hover:border-cyan-400 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-sm'
              : 'bg-white/70 border-blue-900/30 hover:border-blue-900 shadow-sm hover:shadow-md backdrop-blur-sm'
          }`}
        >
          <div className="relative z-30">
            <div className="flex items-center justify-between mb-2">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    : 'bg-blue-100 border border-blue-300 text-blue-900'
                }`}
              >
                <UserCheck className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-900 text-white font-extrabold'
                }`}
              >
                ДИСПЕТЧЕР
              </span>
            </div>
            <h3
              className={`text-sm sm:text-base font-bold font-mono mb-1 ${
                isDark ? 'text-white' : 'text-blue-950'
              }`}
            >
              2. Диспетчер
            </h3>
            <p
              className={`text-xs leading-snug ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
              }`}
            >
              Согласование ответа оператором, проверка дедлайна SLA и запись в БД.
            </p>
          </div>

          <div
            className={`relative z-30 mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-mono font-bold transition-transform group-hover:translate-x-1 ${
              isDark
                ? 'border-white/10 text-cyan-400'
                : 'border-slate-200 text-blue-900'
            }`}
          >
            <span>Перейти к диспетчеру</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* Tile 3: Registry */}
        <div
          id="home-tile-database"
          onClick={() => setActiveTab('database')}
          className={`relative z-10 p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between group ${
            isDark
              ? 'bg-[#06060e]/60 border-cyan-500/30 hover:border-cyan-400 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-sm'
              : 'bg-white/70 border-blue-900/30 hover:border-blue-900 shadow-sm hover:shadow-md backdrop-blur-sm'
          }`}
        >
          <div className="relative z-30">
            <div className="flex items-center justify-between mb-2">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-blue-100 border border-blue-300 text-blue-900'
                }`}
              >
                <Database className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-blue-900 text-white font-extrabold'
                }`}
              >
                РЕЕСТР
              </span>
            </div>
            <h3
              className={`text-sm sm:text-base font-bold font-mono mb-1 ${
                isDark ? 'text-white' : 'text-blue-950'
              }`}
            >
              3. Реестр
            </h3>
            <p
              className={`text-xs leading-snug ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
              }`}
            >
              Просмотр базы данных: объекты, оборудование, договоры и заявки.
            </p>
          </div>

          <div
            className={`relative z-30 mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-mono font-bold transition-transform group-hover:translate-x-1 ${
              isDark
                ? 'border-white/10 text-cyan-400'
                : 'border-slate-200 text-blue-900'
            }`}
          >
            <span>Открыть реестр</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* Tile 4: Tests */}
        <div
          id="home-tile-suite"
          onClick={() => setActiveTab('suite')}
          className={`relative z-10 p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between group ${
            isDark
              ? 'bg-[#06060e]/60 border-cyan-500/30 hover:border-cyan-400 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-sm'
              : 'bg-white/70 border-blue-900/30 hover:border-blue-900 shadow-sm hover:shadow-md backdrop-blur-sm'
          }`}
        >
          <div className="relative z-30">
            <div className="flex items-center justify-between mb-2">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                    : 'bg-blue-100 border border-blue-300 text-blue-900'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  isDark
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-blue-900 text-white font-extrabold'
                }`}
              >
                ТЕСТЫ
              </span>
            </div>
            <h3
              className={`text-sm sm:text-base font-bold font-mono mb-1 ${
                isDark ? 'text-white' : 'text-blue-950'
              }`}
            >
              4. Тесты
            </h3>
            <p
              className={`text-xs leading-snug ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-medium'
              }`}
            >
              Пакетное тестирование сценариев, проверка SLA и защита системы.
            </p>
          </div>

          <div
            className={`relative z-30 mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-mono font-bold transition-transform group-hover:translate-x-1 ${
              isDark
                ? 'border-white/10 text-cyan-400'
                : 'border-slate-200 text-blue-900'
            }`}
          >
            <span>Перейти к тестам</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
