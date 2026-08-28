import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  Activity,
  Layers,
  Search,
  RefreshCw,
  BarChart2,
} from 'lucide-react';
import { SystemLogEntry } from '../types';
import { apiFetch } from '../api';
import { DatabaseSchema } from '../mockDb';
import { IntakeAnalytics } from './IntakeAnalytics';

interface LogsTracesViewProps {
  theme?: 'dark' | 'light';
  db?: DatabaseSchema | null;
}

export const LogsTracesView: React.FC<LogsTracesViewProps> = ({ db }) => {
  const [logFilter, setLogFilter] = useState<'ALL' | 'TELEGRAM' | 'EMAIL' | 'VOICE' | 'SYSTEM' | '1C' | 'REST'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'traces' | 'analytics'>('logs');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      // backend not available — keep current list
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    const matchesChannel = logFilter === 'ALL' || l.channel === logFilter;
    const matchesSearch =
      l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.channel || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const handleRefreshLogs = () => {
    fetchLogs();
  };

  const totalRequests = (db?.open_tickets?.length || 0) + (db?.closed_tickets?.length || 0);
  const pendingHITL = (db?.open_tickets || []).filter(
    (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0)
  ).length;
  const autoRate = totalRequests > 0 ? Math.round(((totalRequests - pendingHITL) / totalRequests) * 1000) / 10 : 100;
  const avgLatencyMs = logs.length > 0
    ? Math.round(logs.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / logs.length)
    : 0;

  return (
    <div id="logs-traces-page" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-5 border-b border-rule pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-ink-3" />
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Журнал событий и трассировка
            </h1>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('logs')}
            aria-current={activeTab === 'logs' ? 'page' : undefined}
            className={`flex items-center gap-1.5 border px-3 py-2 uppercase tracking-wider transition ${
              activeTab === 'logs'
                ? 'border-accent bg-accent text-on-accent'
                : 'border-rule-strong text-ink-2 hover:bg-panel-2 hover:text-ink'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>События</span>
          </button>

          <button
            onClick={() => setActiveTab('traces')}
            aria-current={activeTab === 'traces' ? 'page' : undefined}
            className={`flex items-center gap-1.5 border px-3 py-2 uppercase tracking-wider transition ${
              activeTab === 'traces'
                ? 'border-accent bg-accent text-on-accent'
                : 'border-rule-strong text-ink-2 hover:bg-panel-2 hover:text-ink'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Этапы обработки</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
            className={`flex items-center gap-1.5 border px-3 py-2 uppercase tracking-wider transition ${
              activeTab === 'analytics'
                ? 'border-accent bg-accent text-on-accent'
                : 'border-rule-strong text-ink-2 hover:bg-panel-2 hover:text-ink'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Сводка</span>
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY CARDS (по данным прототипа) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="sheet p-4">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">Всего заявок</div>
          <div className="font-mono text-2xl tabular-nums text-ink">{totalRequests}</div>
          <div className="mt-1 text-[10px] leading-relaxed text-ink-3">открыто: {db?.open_tickets?.length || 0} • закрыто: {db?.closed_tickets?.length || 0}</div>
        </div>

        <div className="sheet p-4">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">Обработано без участия</div>
          <div className="font-mono text-2xl tabular-nums text-ink">{autoRate}%</div>
          <div className="mt-1 text-[10px] leading-relaxed text-ink-3">по договору и рабочим часам</div>
        </div>

        <div className="sheet p-4">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">Ожидают уточнения</div>
          <div className="font-mono text-2xl tabular-nums text-attention">{pendingHITL}</div>
          <div className="mt-1 text-[10px] leading-relaxed text-ink-3">требуют уточнения диспетчера</div>
        </div>

        <div className="sheet p-4">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">Среднее время ответа</div>
          <div className="font-mono text-2xl tabular-nums text-ink">{avgLatencyMs} ms</div>
          <div className="mt-1 text-[10px] leading-relaxed text-ink-3">по последним событиям</div>
        </div>
      </div>

      {/* TAB 1: REALTIME SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div className="sheet p-5">
          {/* Controls */}
          <div className="mb-4 flex flex-col items-center justify-between gap-3 border-b border-rule pb-3 font-mono text-xs sm:flex-row">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <label htmlFor="log-channel-filter" className="uppercase tracking-wider text-ink-3">
                Канал:
              </label>
              <select
                id="log-channel-filter"
                value={logFilter}
                onChange={(e: any) => setLogFilter(e.target.value)}
                className="min-h-11 border border-rule bg-paper px-2 font-mono text-xs text-ink focus:border-rule-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <option value="ALL">Все каналы</option>
                <option value="TELEGRAM">Telegram</option>
                <option value="EMAIL">Электронная почта</option>
                <option value="VOICE">Телефония</option>
                <option value="SYSTEM">Система</option>
                <option value="REST">Диспетчер</option>
                <option value="1C">Учётная система</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                {/* Раньше подписью служил только placeholder — он исчезает при вводе */}
                <label htmlFor="log-search-input" className="sr-only">
                  Поиск по логам
                </label>
                <input
                  id="log-search-input"
                  type="search"
                  placeholder="Поиск по логам"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-11 w-full border border-rule bg-paper pl-8 pr-3 font-mono text-xs text-ink placeholder:text-ink-3 focus:border-rule-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                />
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3"
                  aria-hidden="true"
                />
              </div>

              <button
                type="button"
                onClick={handleRefreshLogs}
                className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap border border-rule-strong px-3 font-mono text-xs uppercase tracking-wider text-ink-2 hover:bg-panel-2 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Обновить</span>
              </button>
            </div>
          </div>

          {/* Terminal Console Stream */}
          <div className="max-h-96 overflow-y-auto font-mono text-xs">
            {filteredLogs.length === 0 && (
              <div className="border border-dashed border-rule p-6 text-center leading-relaxed text-ink-3">
                Записей пока нет. Отправьте обращение на демо-стенде — события появятся здесь.
              </div>
            )}
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col justify-between gap-1 border-b border-rule py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-3"
              >
                <div className="grid min-w-0 grid-cols-[4.75rem_minmax(7.5rem,auto)_minmax(0,1fr)] items-baseline gap-3">
                  <span className="tabular-nums text-ink-3">
                    {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                  </span>
                  <span
                    className={`whitespace-nowrap text-[10px] uppercase tracking-wider ${
                      log.level === 'WARN' ? 'text-attention' : 'text-ink-3'
                    }`}
                  >
                    {log.channel}
                  </span>
                  <span className="min-w-0 break-words text-ink-2">{log.message}</span>
                </div>
                {log.duration_ms && (
                  <span className="shrink-0 self-end tabular-nums text-[10px] text-ink-3 sm:self-auto">
                    {log.duration_ms} ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OPENTELEMETRY TRACES */}
      {activeTab === 'traces' && (
        <div className="sheet p-5">
          <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3 font-mono">
            <div className="flex items-baseline gap-2">
              <Layers className="h-4 w-4 shrink-0 self-center text-ink-3" />
              <h3 className="text-xs uppercase tracking-[0.14em] text-ink">Этапы обработки</h3>
              <span className="text-[10px] text-ink-3">№ trace_ot_891823719_tg</span>
            </div>
            <span className="shrink-0 tabular-nums text-xs text-ink-3">482 ms • 6 этапов</span>
          </div>

          <div className="font-mono text-xs">
            {/* Span 1 */}
            <div className="border-b border-rule py-2.5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-2">1. Приём обращения из Telegram</span>
                <span className="shrink-0 tabular-nums text-ink-3">12 ms</span>
              </div>
              <div className="mt-1.5 h-1 w-full bg-panel-2">
                <div className="h-full bg-accent-soft" style={{ width: '5%' }} />
              </div>
            </div>

            {/* Span 2 */}
            <div className="border-b border-rule py-2.5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-2">2. Маскирование персональных данных</span>
                <span className="shrink-0 tabular-nums text-ink-3">4 ms</span>
              </div>
              <div className="mt-1.5 h-1 w-full bg-panel-2">
                <div className="h-full bg-accent-soft" style={{ width: '2%' }} />
              </div>
            </div>

            {/* Span 3 */}
            <div className="border-b border-rule py-2.5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-2">3. Разбор текста моделью</span>
                <span className="shrink-0 tabular-nums text-ink-3">435 ms</span>
              </div>
              <div className="mt-1.5 h-1 w-full bg-panel-2">
                <div className="h-full bg-accent-soft" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Span 4 */}
            <div className="border-b border-rule py-2.5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-2">4. Проверка правил и срока по договору</span>
                <span className="shrink-0 tabular-nums text-ink-3">9 ms</span>
              </div>
              <div className="mt-1.5 h-1 w-full bg-panel-2">
                <div className="h-full bg-accent-soft" style={{ width: '4%' }} />
              </div>
            </div>

            {/* Span 5 */}
            <div className="border-b border-rule py-2.5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink-2">5. Запись документа в учётную систему</span>
                <span className="shrink-0 tabular-nums text-ink-3">22 ms</span>
              </div>
              <div className="mt-1.5 h-1 w-full bg-panel-2">
                <div className="h-full bg-accent-soft" style={{ width: '4%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS DASHBOARDS */}
      {activeTab === 'analytics' && <IntakeAnalytics db={db} logs={logs} />}

    </div>
  );
};
