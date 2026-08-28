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
        className={`relative overflow-hidden rounded-[2px] p-6 sm:p-8 transition-all border ${
          isDark
            ? 'bg-panel border-accent text-ink'
            : 'bg-panel border-rule shadow-xl field-grid-light text-ink'
        }`}
      >
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
                isDark
                  ? 'bg-accent-bg border-accent text-accent'
                  : 'bg-accent-bg border-accent text-accent'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>TEXT2BUSINESS • AI DISPATCHER DEMO</span>
            </div>

            <div
              className={`text-xs font-mono px-3 py-1 rounded-full border ${
                isDark
                  ? 'bg-paper text-ink-3 border-rule'
                  : 'bg-panel-2 text-ink-2 border-rule'
              }`}
            >
              TIMEBOX: <span className="font-bold text-accent">4 HOURS</span> | ROLE:{' '}
              <span className="font-bold">AI TECH LEAD / ARCHITECT</span>
            </div>
          </div>

          {/* Title & Headline */}
          <div className="max-w-4xl space-y-3">
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight font-mono leading-tight">
              Автономный AI-Диспетчер <br className="hidden sm:inline" />
              <span className="text-accent">Сервисных Заявок</span>
            </h1>
            <p
              className={`text-sm sm:text-base leading-relaxed max-w-3xl ${
                isDark ? 'text-ink-3' : 'text-ink-2'
              }`}
            >
              Трансформация неструктурированных входящих сообщений (Email, Telegram, Звонки) в контролируемое бизнес-действие с верификацией по корпоративной БД, расчетом SLA и защитным Guardrail.
            </p>
          </div>

          {/* Architectural Pipeline Flow (Google Antigravity Diagram Style) */}
          <div className="pt-2">
            <div
              className={`p-4 sm:p-5 rounded-[2px] border transition-all ${
                isDark
                  ? 'bg-paper border-accent shadow-inner'
                  : 'bg-panel-2 border-rule shadow-inner'
              }`}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-accent mb-3 flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5" />
                <span>Пайплайн Трансформации (Antigravity Architecture Flow)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
                {/* Step 1 */}
                <div
                  className={`p-3 rounded-[2px] border flex flex-col justify-between ${
                    isDark
                      ? 'bg-panel-2 border-rule text-ink'
                      : 'bg-panel border-rule text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-accent font-bold mb-1">
                    <span>1. ИНПУТ</span>
                    <Send className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Свободный Текст</span>
                  <span className="text-[10px] text-ink-3 mt-1">Email, Telegram, Звонок</span>
                </div>

                {/* Step 2 */}
                <div
                  className={`p-3 rounded-[2px] border flex flex-col justify-between ${
                    isDark
                      ? 'bg-panel-2 border-accent text-ink'
                      : 'bg-panel border-accent text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-accent font-bold mb-1">
                    <span>2. PERCEPTION</span>
                    <Bot className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Извлечение Фактов</span>
                  <span className="text-[10px] text-accent mt-1">LLM Pydantic Schema</span>
                </div>

                {/* Step 3 */}
                <div
                  className={`p-3 rounded-[2px] border flex flex-col justify-between ${
                    isDark
                      ? 'bg-panel-2 border-rule text-ink'
                      : 'bg-panel border-rule text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-warn font-bold mb-1">
                    <span>3. ENRICHMENT</span>
                    <Database className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Проверка БД & SLA</span>
                  <span className="text-[10px] text-ink-3 mt-1">Клиент, Ассет, Тикеты</span>
                </div>

                {/* Step 4 */}
                <div
                  className={`p-3 rounded-[2px] border flex flex-col justify-between ${
                    isDark
                      ? 'bg-panel-2 border-accent text-ink'
                      : 'bg-panel border-accent text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-accent font-bold mb-1">
                    <span>4. DECISION</span>
                    <Cpu className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-xs">Граф Состояний</span>
                  <span className="text-[10px] text-accent mt-1">Детерминированные правила</span>
                </div>

                {/* Step 5 */}
                <div
                  className={`p-3 rounded-[2px] border flex flex-col justify-between ${
                    isDark
                      ? 'bg-accent-bg border-accent text-accent'
                      : 'bg-accent-bg border-accent text-accent'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-accent font-bold mb-1">
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
              isDark ? 'text-accent' : 'text-ink'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-accent"></span>
            Разделение по Акторам и Ролевым Сценариям (Actor-Action Workspaces)
          </h2>
          <span className="text-[11px] font-mono text-ink-3">4 Ролевых Сценария</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Actor 1: Customer */}
          <div
            onClick={() => setActiveTab('customer')}
            className={`cursor-pointer p-5 rounded-[2px] border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between group ${
              isDark
                ? 'bg-panel border-accent hover:border-rule-strong shadow-lg'
                : 'bg-panel border-rule hover:border-rule-strong shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-[2px] bg-accent-bg border border-accent flex items-center justify-center text-accent">
                  <Send className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent-bg text-accent border border-accent">
                  АКТОР 1
                </span>
              </div>
              <h3 className={`text-sm font-bold font-mono mb-1 ${isDark ? 'text-ink' : 'text-ink'}`}>
                Клиент / Заявитель
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
                Отправка обращения в свободной форме (Email, Telegram, Звонок). Получение автоматического ответа с SLA.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs font-mono text-accent font-bold group-hover:translate-x-1 transition-transform">
              <span>Открыть Рабочее Место</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Actor 2: AI Dispatcher */}
          <div
            onClick={() => setActiveTab('ai_engine')}
            className={`cursor-pointer p-5 rounded-[2px] border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between group ${
              isDark
                ? 'bg-panel border-accent hover:border-rule-strong shadow-lg'
                : 'bg-panel border-rule hover:border-rule-strong shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-[2px] bg-accent-bg border border-accent flex items-center justify-center text-accent">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent-bg text-accent border border-accent">
                  АКТОР 2
                </span>
              </div>
              <h3 className={`text-sm font-bold font-mono mb-1 ${isDark ? 'text-ink' : 'text-ink'}`}>
                AI-Диспетчер (Engine)
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
                LLM Perception extraction фактов, поиск в БД, графовое принятие решений, вызов mock-инструментов.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs font-mono text-accent font-bold group-hover:translate-x-1 transition-transform">
              <span>Просмотреть Логику</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Actor 3: Human Operator */}
          <div
            onClick={() => setActiveTab('operator')}
            className={`cursor-pointer p-5 rounded-[2px] border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between group ${
              isDark
                ? 'bg-panel border-accent hover:border-rule-strong shadow-lg'
                : 'bg-panel border-rule hover:border-rule-strong shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-[2px] bg-warn-bg border border-warn flex items-center justify-center text-warn">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-warn-bg text-warn border border-warn">
                  АКТОР 3
                </span>
              </div>
              <h3 className={`text-sm font-bold font-mono mb-1 ${isDark ? 'text-ink' : 'text-ink'}`}>
                Диспетчер-Оператор
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
                Human-in-the-Loop подтверждение действий, управление режимом Live Commit, просмотр реестра оборудования.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs font-mono text-accent font-bold group-hover:translate-x-1 transition-transform">
              <span>Открыть Контроль БД</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Actor 4: Tech Lead / Architect */}
          <div
            onClick={() => setActiveTab('tech_lead')}
            className={`cursor-pointer p-5 rounded-[2px] border transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between group ${
              isDark
                ? 'bg-panel border-accent hover:border-rule-strong shadow-lg'
                : 'bg-panel border-rule hover:border-rule-strong shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-[2px] bg-accent-bg border border-accent flex items-center justify-center text-accent">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent-bg text-accent border border-accent">
                  АКТОР 4
                </span>
              </div>
              <h3 className={`text-sm font-bold font-mono mb-1 ${isDark ? 'text-ink' : 'text-ink'}`}>
                Tech Lead / Evals
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
                Наблюдаемость (Execution Trace), спецификация SLA, Guardrail промпт-инъекций и Batch Evaluation Suite.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs font-mono text-accent font-bold group-hover:translate-x-1 transition-transform">
              <span>Тесты & Наблюдаемость</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
