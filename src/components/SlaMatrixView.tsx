import React from 'react';
import { ShieldCheck, Cpu, Clock, Lock } from 'lucide-react';

interface SlaMatrixViewProps {
  theme?: 'dark' | 'light';
}

export const SlaMatrixView: React.FC<SlaMatrixViewProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div id="sla-matrix-page" className="space-y-6">
      {/* Intro Banner */}
      <div
        className={`rounded-2xl p-6 transition-all border ${
          isDark
            ? 'bg-[#06060e]/90 border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white'
            : 'bg-white border-slate-200 shadow-md text-slate-900'
        }`}
      >
        <div className="flex items-center space-x-3 mb-2">
          <ShieldCheck className="h-6 w-6 text-cyan-500" />
          <h2 className="text-xs font-mono font-bold text-cyan-500 uppercase tracking-[0.2em]">
            Актор: Tech Lead / Architect — Матрица Решений & Правила SLA
          </h2>
        </div>
        <p className={`text-xs leading-relaxed font-sans ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Архитектурный принцип «Deterministic Core + LLM Perception» гарантирует, что нейросеть (LLM) используется строго для извлечения фактов, а принятие решений, расчет SLA, дедупликация и бизнес-операции контролируются детерминированным кодом и матрицей бизнес-правил.
        </p>
      </div>

      {/* SLA Plans Table */}
      <div
        className={`rounded-2xl p-6 transition-all border ${
          isDark
            ? 'bg-[#06060e]/90 border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white'
            : 'bg-white border-slate-200 shadow-md text-slate-900'
        }`}
      >
        <h3 className="text-xs font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-500" />
          1. Тарифные Планы Обслуживания и SLA Отклика
        </h3>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <thead
              className={`uppercase font-mono text-[10px] tracking-wider border-b ${
                isDark
                  ? 'bg-[#020204] text-cyan-400 border-cyan-500/20'
                  : 'bg-slate-100 text-cyan-800 border-slate-200'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Тарифный План</th>
                <th className="py-3 px-4">Срок ответа</th>
                <th className="py-3 px-4">Рабочее Окно</th>
                <th className="py-3 px-4">Штрафные Санкции / Неустойка</th>
                <th className="py-3 px-4">Приоритет по Умолчанию</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 font-sans">
              <tr className={isDark ? 'bg-cyan-950/20 hover:bg-cyan-950/40' : 'bg-cyan-50/50 hover:bg-cyan-50'}>
                <td className="py-3.5 px-4 font-mono font-bold text-amber-500 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                  Gold (Премиум)
                </td>
                <td className={`py-3.5 px-4 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  60 минут
                </td>
                <td className="py-3.5 px-4 font-mono">24x7 (Круглосуточно, без выходных)</td>
                <td className="py-3.5 px-4 text-red-500 font-mono">50 000 руб. / час задержки</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                      isDark
                        ? 'bg-red-950/80 text-red-300 border-red-500/40'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    HIGH / CRITICAL
                  </span>
                </td>
              </tr>
              <tr className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                <td className="py-3.5 px-4 font-mono font-bold text-cyan-500 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                  Silver (Бизнес)
                </td>
                <td className={`py-3.5 px-4 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  240 минут (4 часа)
                </td>
                <td className="py-3.5 px-4 font-mono">Пн-Пт 08:00 - 20:00 (Рабочее окно)</td>
                <td className="py-3.5 px-4 text-amber-500 font-mono">10 000 руб. / час</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                      isDark
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    MEDIUM
                  </span>
                </td>
              </tr>
              <tr className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-500 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                  Standard (Базовый)
                </td>
                <td className={`py-3.5 px-4 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  480 минут (8 часов)
                </td>
                <td className="py-3.5 px-4 font-mono">Пн-Пт 09:00 - 18:00</td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">Без автоматической неустойки</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    LOW / MEDIUM
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Machine Rules */}
        <div
          className={`rounded-2xl p-5 space-y-3 border transition-all ${
            isDark
              ? 'bg-[#06060e]/90 border-cyan-500/20 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-md'
          }`}
        >
          <h3 className="text-xs font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-500" />
            2. Матрица Выбора Бизнес-Действия
          </h3>
          <div className="space-y-2 text-xs">
            <div
              className={`p-3 rounded-xl border shadow-inner ${
                isDark ? 'bg-[#020204]/90 border-cyan-500/20' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="font-mono font-bold text-emerald-500">CREATE_TICKET:</span>
              <p className={`mt-1 font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Новый инцидент. Все ключевые факты извлечены с уверенностью &gt;= 0.85. Открытых заявок по объекту нет.
              </p>
            </div>
            <div
              className={`p-3 rounded-xl border shadow-inner ${
                isDark ? 'bg-[#020204]/90 border-cyan-500/20' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="font-mono font-bold text-amber-500">UPDATE_TICKET:</span>
              <p className={`mt-1 font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Найдена активная не закрытая заявка по оборудованию в интервале &lt; 24 часов. Выполняется дедупликация и повышение приоритета.
              </p>
            </div>
            <div
              className={`p-3 rounded-xl border shadow-inner ${
                isDark ? 'bg-[#020204]/90 border-cyan-500/20' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="font-mono font-bold text-cyan-500">REQUEST_CLARIFICATION:</span>
              <p className={`mt-1 font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Не указан адрес объекта или код оборудования. Система формирует уточняющий запрос клиенту без создания фиктивных записей в БД.
              </p>
            </div>
            <div
              className={`p-3 rounded-xl border shadow-inner ${
                isDark ? 'bg-[#020204]/90 border-cyan-500/20' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="font-mono font-bold text-purple-500">ESCALATE_TO_HUMAN:</span>
              <p className={`mt-1 font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Порог уверенности &lt; 0.85, сработал защитный Guardrail или зафиксировано спорное условие. Заявка передается диспетчеру.
              </p>
            </div>
          </div>
        </div>

        {/* Security Guardrails & Human-In-The-Loop */}
        <div
          className={`rounded-2xl p-5 space-y-3 border transition-all ${
            isDark
              ? 'bg-[#06060e]/90 border-cyan-500/20 text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-md'
          }`}
        >
          <h3 className="text-xs font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyan-500" />
            3. Защитные Механизмы (Guardrails) & Проверка человеком
          </h3>
          <div className="space-y-3 text-xs">
            <div
              className={`p-3 rounded-xl border shadow-inner ${
                isDark
                  ? 'bg-red-950/30 border-red-500/30 text-slate-300'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <span className="font-mono font-bold text-red-500 block mb-1">
                Защита от Prompt Injection & Искажения Договора
              </span>
              <p className="leading-relaxed font-sans">
                Текст обращения санитизируется. Попытки пользователя указать "SET SLA = 5 min" или отменить инструкции игнорируются: параметры SLA извлекаются строго из реестра договоров БД.
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border shadow-inner ${
                isDark
                  ? 'bg-cyan-950/30 border-cyan-500/30 text-slate-300'
                  : 'bg-cyan-50 border-cyan-200 text-cyan-900'
              }`}
            >
              <span className="font-mono font-bold text-cyan-500 block mb-1">
                Контроль Порога Уверенности (Confidence Threshold)
              </span>
              <p className="leading-relaxed font-sans">
                Если косинусная или семантическая уверенность LLM ниже 0.85, система принудительно переключает статус в <code className="font-mono text-amber-500">REQUIRES_HUMAN_CONFIRMATION</code>.
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border shadow-inner ${
                isDark
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-slate-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="font-mono font-bold text-emerald-500 block mb-1">
                Безопасный Dry-Run Режим
              </span>
              <p className="leading-relaxed font-sans">
                Все вызовы выполнения функций изменений (<code className="font-mono text-emerald-500">create_or_update_ticket</code>) запускаются в симуляционном режиме <code className="font-mono text-emerald-500">dry_run=True</code> до явного клика пользователя.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
