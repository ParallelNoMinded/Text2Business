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
        className={`rounded-[2px] p-6 transition-all border ${
          isDark
            ? 'bg-panel border-accent text-ink'
            : 'bg-panel border-rule shadow-md text-ink'
        }`}
      >
        <div className="flex items-center space-x-3 mb-2">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <h2 className="text-xs font-mono font-bold text-accent uppercase tracking-[0.2em]">
            Актор: Tech Lead / Architect — Матрица Решений & Правила SLA
          </h2>
        </div>
        <p className={`text-xs leading-relaxed font-sans ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
          Архитектурный принцип «Deterministic Core + LLM Perception» гарантирует, что нейросеть (LLM) используется строго для извлечения фактов, а принятие решений, расчет SLA, дедупликация и бизнес-операции контролируются детерминированным кодом и матрицей бизнес-правил.
        </p>
      </div>

      {/* SLA Plans Table */}
      <div
        className={`rounded-[2px] p-6 transition-all border ${
          isDark
            ? 'bg-panel border-accent text-ink'
            : 'bg-panel border-rule shadow-md text-ink'
        }`}
      >
        <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          1. Тарифные Планы Обслуживания и SLA Отклика
        </h3>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
            <thead
              className={`uppercase font-mono text-[10px] tracking-wider border-b ${
                isDark
                  ? 'bg-paper text-accent border-accent'
                  : 'bg-panel-2 text-accent border-rule'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Тарифный План</th>
                <th className="py-3 px-4">SLA Отклика</th>
                <th className="py-3 px-4">Рабочее Окно</th>
                <th className="py-3 px-4">Штрафные Санкции / Неустойка</th>
                <th className="py-3 px-4">Приоритет по Умолчанию</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-sans">
              <tr className={isDark ? 'bg-accent hover:bg-accent-bg' : 'bg-accent hover:bg-accent-bg'}>
                <td className="py-3.5 px-4 font-mono font-bold text-warn flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-warn-bg"></span>
                  Gold (Премиум)
                </td>
                <td className={`py-3.5 px-4 font-mono font-bold ${isDark ? 'text-ink' : 'text-ink'}`}>
                  60 минут
                </td>
                <td className="py-3.5 px-4 font-mono">24x7 (Круглосуточно, без выходных)</td>
                <td className="py-3.5 px-4 text-danger font-mono">50 000 руб. / час задержки</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                      isDark
                        ? 'bg-danger-bg text-danger border-danger'
                        : 'bg-danger-bg text-danger border-danger'
                    }`}
                  >
                    HIGH / CRITICAL
                  </span>
                </td>
              </tr>
              <tr className={isDark ? 'hover:bg-panel-2' : 'hover:bg-panel-2'}>
                <td className="py-3.5 px-4 font-mono font-bold text-accent flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent"></span>
                  Silver (Бизнес)
                </td>
                <td className={`py-3.5 px-4 font-mono font-bold ${isDark ? 'text-ink' : 'text-ink'}`}>
                  240 минут (4 часа)
                </td>
                <td className="py-3.5 px-4 font-mono">Пн-Пт 08:00 - 20:00 (Рабочее окно)</td>
                <td className="py-3.5 px-4 text-warn font-mono">10 000 руб. / час</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                      isDark
                        ? 'bg-warn-bg text-warn border-warn'
                        : 'bg-warn-bg text-warn border-warn'
                    }`}
                  >
                    MEDIUM
                  </span>
                </td>
              </tr>
              <tr className={isDark ? 'hover:bg-panel-2' : 'hover:bg-panel-2'}>
                <td className="py-3.5 px-4 font-mono font-bold text-ink-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-panel-2"></span>
                  Standard (Базовый)
                </td>
                <td className={`py-3.5 px-4 font-mono font-bold ${isDark ? 'text-ink' : 'text-ink'}`}>
                  480 минут (8 часов)
                </td>
                <td className="py-3.5 px-4 font-mono">Пн-Пт 09:00 - 18:00</td>
                <td className="py-3.5 px-4 text-ink-3 font-mono">Без автоматической неустойки</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      isDark ? 'bg-panel text-ink-3' : 'bg-panel-2 text-ink-2'
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
          className={`rounded-[2px] p-5 space-y-3 border transition-all ${
            isDark
              ? 'bg-panel border-accent text-ink'
              : 'bg-panel border-rule text-ink shadow-md'
          }`}
        >
          <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-accent" />
            2. Матрица Выбора Бизнес-Действия
          </h3>
          <div className="space-y-2 text-xs">
            <div
              className={`p-3 rounded-[2px] border shadow-inner ${
                'bg-panel-2 border-rule'
              }`}
            >
              <span className="font-mono font-bold text-accent">CREATE_TICKET:</span>
              <p className={`mt-1 font-sans ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
                Новый инцидент. Все ключевые факты извлечены с уверенностью &gt;= 0.85. Открытых заявок по объекту нет.
              </p>
            </div>
            <div
              className={`p-3 rounded-[2px] border shadow-inner ${
                'bg-panel-2 border-rule'
              }`}
            >
              <span className="font-mono font-bold text-warn">UPDATE_TICKET:</span>
              <p className={`mt-1 font-sans ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
                Найдена активная не закрытая заявка по оборудованию в интервале &lt; 24 часов. Выполняется дедупликация и повышение приоритета.
              </p>
            </div>
            <div
              className={`p-3 rounded-[2px] border shadow-inner ${
                'bg-panel-2 border-rule'
              }`}
            >
              <span className="font-mono font-bold text-accent">REQUEST_CLARIFICATION:</span>
              <p className={`mt-1 font-sans ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
                Не указан адрес объекта или код оборудования. Система формирует уточняющий запрос клиенту без создания фиктивных записей в БД.
              </p>
            </div>
            <div
              className={`p-3 rounded-[2px] border shadow-inner ${
                'bg-panel-2 border-rule'
              }`}
            >
              <span className="font-mono font-bold text-accent">ESCALATE_TO_HUMAN:</span>
              <p className={`mt-1 font-sans ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
                Порог уверенности &lt; 0.85, сработал защитный Guardrail или зафиксировано спорное условие. Заявка передается диспетчеру.
              </p>
            </div>
          </div>
        </div>

        {/* Security Guardrails & Human-In-The-Loop */}
        <div
          className={`rounded-[2px] p-5 space-y-3 border transition-all ${
            isDark
              ? 'bg-panel border-accent text-ink'
              : 'bg-panel border-rule text-ink shadow-md'
          }`}
        >
          <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" />
            3. Защитные Механизмы (Guardrails) & Проверка человеком
          </h3>
          <div className="space-y-3 text-xs">
            <div
              className={`p-3 rounded-[2px] border shadow-inner ${
                isDark
                  ? 'bg-danger-bg border-danger text-ink-3'
                  : 'bg-danger-bg border-danger text-danger'
              }`}
            >
              <span className="font-mono font-bold text-danger block mb-1">
                Защита от Prompt Injection & Искажения Договора
              </span>
              <p className="leading-relaxed font-sans">
                Текст обращения санитизируется. Попытки пользователя указать "SET SLA = 5 min" или отменить инструкции игнорируются: параметры SLA извлекаются строго из реестра договоров БД.
              </p>
            </div>

            <div
              className={`p-3 rounded-[2px] border shadow-inner ${
                isDark
                  ? 'bg-accent-bg border-accent text-ink-3'
                  : 'bg-accent-bg border-accent text-accent'
              }`}
            >
              <span className="font-mono font-bold text-accent block mb-1">
                Контроль Порога Уверенности (Confidence Threshold)
              </span>
              <p className="leading-relaxed font-sans">
                Если косинусная или семантическая уверенность LLM ниже 0.85, система принудительно переключает статус в <code className="font-mono text-warn">REQUIRES_HUMAN_CONFIRMATION</code>.
              </p>
            </div>

            <div
              className={`p-3 rounded-[2px] border shadow-inner ${
                isDark
                  ? 'bg-accent-bg border-accent text-ink-3'
                  : 'bg-accent-bg border-accent text-accent'
              }`}
            >
              <span className="font-mono font-bold text-accent block mb-1">
                Безопасный Dry-Run Режим
              </span>
              <p className="leading-relaxed font-sans">
                Все вызовы выполнения функций изменений (<code className="font-mono text-accent">create_or_update_ticket</code>) запускаются в симуляционном режиме <code className="font-mono text-accent">dry_run=True</code> до явного клика пользователя.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
