import React from 'react';
import {
  Zap,
  Bot,
  User,
  ShieldCheck,
  Send,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  Workflow,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import { TabType } from './Header';

interface AntigravityHeroProps {
  theme: 'dark' | 'light';
  setActiveTab: (tab: TabType) => void;
  onRunDispatch: () => void;
  isLoading: boolean;
}

export const AntigravityHero: React.FC<AntigravityHeroProps> = ({
  theme,
  setActiveTab,
  onRunDispatch,
  isLoading,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Google Antigravity Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all border ${
          isDark
            ? 'bg-[#222222]/95 border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)] field-grid-dark text-white'
            : 'bg-white border-slate-200 shadow-xl field-grid-light text-slate-900'
        }`}
      >
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
                isDark
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'bg-cyan-50 border-cyan-200 text-cyan-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-500 animate-spin" />
              <span>TEXT2BUSINESS • AI DISPATCHER DEMO</span>
            </div>

            <div
              className={`text-xs font-mono px-3 py-1 rounded-full border ${
                isDark
                  ? 'bg-[#222222] text-slate-400 border-white/10'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              TIMEBOX: <span className="font-bold text-cyan-500">4 HOURS</span> | ROLE:{' '}
              <span className="font-bold">AI TECH LEAD / ARCHITECT</span>
            </div>
          </div>

          {/* Title & Headline */}
          <div className="max-w-4xl space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-mono leading-tight">
              Автономный AI-Диспетчер <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Сервисных Заявок
              </span>
            </h1>
            <p
              className={`text-sm sm:text-base leading-relaxed max-w-3xl ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Трансформация неструктурированных входящих сообщений (Email, Telegram, Звонки) в контролируемое бизнес-действие с верификацией по корпоративной БД, расчетом SLA и защитным Guardrail.
            </p>
          </div>

          {/* Architectural Pipeline Flow (Google Antigravity Diagram Style) */}
          <div className="pt-2">
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-[#222222]/90 border-cyan-500/20 shadow-inner'
                  : 'bg-slate-50 border-slate-200 shadow-inner'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-cyan-500 mb-3 flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5" />
                <span>Пайплайн Трансформации (Antigravity Architecture Flow)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
                {/* Step 1 */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isDark
                      ? 'bg-[#222222] border-white/10 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-cyan-500 font-bold mb-1">
                    <span>1. ИНПУТ</span>
                    <Send className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Свободный Текст</span>
                  <span className="text-[10px] text-slate-500 mt-1">Email, Telegram, Звонок</span>
                </div>

                {/* Step 2 */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isDark
                      ? 'bg-[#222222] border-cyan-500/30 text-slate-200'
                      : 'bg-white border-cyan-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-cyan-500 font-bold mb-1">
                    <span>2. PERCEPTION</span>
                    <Bot className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Извлечение Фактов</span>
                  <span className="text-[10px] text-cyan-400 mt-1">LLM Pydantic Schema</span>
                </div>

                {/* Step 3 */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isDark
                      ? 'bg-[#222222] border-white/10 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-amber-500 font-bold mb-1">
                    <span>3. ENRICHMENT</span>
                    <Database className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Проверка БД & SLA</span>
                  <span className="text-[10px] text-slate-500 mt-1">Клиент, Ассет, Тикеты</span>
                </div>

                {/* Step 4 */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isDark
                      ? 'bg-[#222222] border-purple-500/30 text-slate-200'
                      : 'bg-white border-purple-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold mb-1">
                    <span>4. DECISION</span>
                    <Cpu className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Граф Состояний</span>
                  <span className="text-[10px] text-purple-400 mt-1">Детерминированные правила</span>
                </div>

                {/* Step 5 */}
                <div
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isDark
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                      : 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold mb-1">
                    <span>5. ЭКШН</span>
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Бизнес-Действие</span>
                  <span className="text-[10px] font-bold mt-1">Ticket / Clarification / HITL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actor & Action Roles Matrix (Разделение по акторам и их действиям) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            className={`text-xs font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${
              isDark ? 'text-cyan-400' : 'text-slate-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
            Разделение по Акторам и Ролевым Сценариям (Actor-Action Workspaces)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">4 Ролевых Сценария</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Actor 1: Customer */}
          <div
            onClick={() => setActiveTab('customer')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between group ${
              isDark
                ? 'bg-[#222222]/90 border-cyan-500/20 hover:border-cyan-500/50 shadow-lg'
                : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Send className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  АКТОР 1
                </span>
              </div>
              <h3 className={`text-sm font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Клиент / Заявитель
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Отправка обращения в свободной форме (Email, Telegram, Звонок). Получение автоматического ответа с SLA.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
              <span>Открыть Рабочее Место</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Actor 2: AI Dispatcher */}
          <div
            onClick={() => setActiveTab('ai_engine')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between group ${
              isDark
                ? 'bg-[#222222]/90 border-cyan-500/20 hover:border-cyan-500/50 shadow-lg'
                : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  АКТОР 2
                </span>
              </div>
              <h3 className={`text-sm font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                AI-Диспетчер (Engine)
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                LLM Perception extraction фактов, поиск в БД, графовое принятие решений, вызов mock-инструментов.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
              <span>Просмотреть Логику</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Actor 3: Human Operator */}
          <div
            onClick={() => setActiveTab('operator')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between group ${
              isDark
                ? 'bg-[#222222]/90 border-cyan-500/20 hover:border-cyan-500/50 shadow-lg'
                : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  АКТОР 3
                </span>
              </div>
              <h3 className={`text-sm font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Диспетчер-Оператор
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Human-in-the-Loop подтверждение действий, управление режимом Live Commit, просмотр реестра оборудования.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
              <span>Открыть Контроль БД</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Actor 4: Tech Lead / Architect */}
          <div
            onClick={() => setActiveTab('tech_lead')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between group ${
              isDark
                ? 'bg-[#222222]/90 border-cyan-500/20 hover:border-cyan-500/50 shadow-lg'
                : 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  АКТОР 4
                </span>
              </div>
              <h3 className={`text-sm font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Tech Lead / Evals
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Наблюдаемость (Execution Trace), спецификация SLA, Guardrail промпт-инъекций и Batch Evaluation Suite.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
              <span>Тесты & Наблюдаемость</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
