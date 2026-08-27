import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { ProcessingResult, SystemLogEntry } from '../types';
import { apiFetch } from '../api';
import { DatabaseSchema } from '../mockDb';
import { PageSection } from './layout/PageSection';
import { StatusBadge, StatusTone } from './ui/StatusBadge';
import { ExecutionTraceTimeline } from './ExecutionTraceTimeline';
import {
  avgDurationMs,
  displayLogLevel,
  isWaitingTicket,
  redactSafeMeta,
  slaBucket,
  wasAutoDispatched,
} from '../opsDashboard';
import { ruLogLevel, ruHealth } from '../uiRu';

interface LogsTracesViewProps {
  theme?: 'dark' | 'light';
  db?: DatabaseSchema | null;
  lastResult?: ProcessingResult | null;
  apiHealthy?: boolean | null;
  geminiActive?: boolean;
  githubToken?: string;
}

type TimeWindow = '15m' | '1h' | '6h' | '24h' | 'all';
type HealthState = 'Operational' | 'Degraded' | 'Down';

function levelTone(level: string): StatusTone {
  if (level === 'SUCCESS') return 'success';
  if (level === 'WARNING') return 'warning';
  if (level === 'ERROR' || level === 'CRITICAL') return 'danger';
  return 'info';
}

function healthTone(h: HealthState): StatusTone {
  if (h === 'Operational') return 'success';
  if (h === 'Degraded') return 'warning';
  return 'danger';
}

function channelHealth(logs: SystemLogEntry[], channel: SystemLogEntry['channel']): HealthState {
  const last = logs.find((l) => l.channel === channel);
  if (!last) return 'Degraded';
  if (last.level === 'ERROR') return 'Down';
  if (last.level === 'WARN') return 'Degraded';
  return 'Operational';
}

function windowMs(w: TimeWindow): number {
  if (w === '15m') return 15 * 60 * 1000;
  if (w === '1h') return 60 * 60 * 1000;
  if (w === '6h') return 6 * 60 * 60 * 1000;
  if (w === '24h') return 24 * 60 * 60 * 1000;
  return 0;
}

function fmtTs(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function traceIdFor(log: SystemLogEntry): string {
  const tid = log.details?.ticket_id;
  if (typeof tid === 'string' && tid) return tid;
  return log.id;
}

export const LogsTracesView: React.FC<LogsTracesViewProps> = ({
  db,
  lastResult = null,
  apiHealthy = null,
  geminiActive = false,
  githubToken = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeWindow>('all');
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [health, setHealth] = useState<{ gemini_enabled?: boolean; telegram_bot_configured?: boolean } | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      /* keep */
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, [apiHealthy]);

  const tickets = [...(db?.open_tickets || []), ...(db?.closed_tickets || [])];
  const totalTickets = tickets.length;
  const waitingHitl = (db?.open_tickets || []).filter(isWaitingTicket).length;
  const autoPct =
    totalTickets > 0 ? Math.round((tickets.filter(wasAutoDispatched).length / totalTickets) * 1000) / 10 : 0;
  const avgMs = avgDurationMs(logs, lastResult);
  const errors = logs.filter((l) => l.level === 'ERROR').length;
  const slaAtRisk = (db?.open_tickets || []).filter((t) => {
    const b = slaBucket(t.sla_deadline);
    return b === 'at_risk' || b === 'breached';
  }).length;

  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const since = windowMs(timeFilter);
    const now = Date.now();
    return logs.filter((l) => {
      const shown = displayLogLevel(l.level, l.message);
      if (levelFilter !== 'ALL' && shown !== levelFilter) return false;
      if (channelFilter !== 'ALL' && l.channel !== channelFilter) return false;
      if (since > 0) {
        const ts = new Date(l.timestamp).getTime();
        if (!Number.isNaN(ts) && now - ts > since) return false;
      }
      if (!q) return true;
      return (
        l.message.toLowerCase().includes(q) ||
        l.channel.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        String(l.details?.ticket_id || '').toLowerCase().includes(q)
      );
    });
  }, [logs, searchTerm, levelFilter, channelFilter, timeFilter]);

  const selected = logs.find((l) => l.id === selectedId) || null;
  const selectedMatchesLast = Boolean(
    lastResult &&
      selected &&
      selected.details?.ticket_id &&
      selected.details.ticket_id === lastResult.ticket_payload?.ticket_id
  );

  const aiHealth: HealthState =
    apiHealthy === false ? 'Down' : health?.gemini_enabled || geminiActive || githubToken ? 'Operational' : 'Degraded';
  const apiHealthState: HealthState = apiHealthy === false ? 'Down' : apiHealthy ? 'Operational' : 'Degraded';
  const dbHealth: HealthState = db ? 'Operational' : 'Down';
  const tgHealth: HealthState = health?.telegram_bot_configured
    ? channelHealth(logs, 'TELEGRAM') === 'Down'
      ? 'Down'
      : 'Operational'
    : channelHealth(logs, 'TELEGRAM');
  const services: { name: string; state: HealthState }[] = [
    { name: 'ИИ', state: aiHealth },
    { name: 'API', state: apiHealthState },
    { name: 'База данных', state: dbHealth },
    { name: 'Telegram', state: tgHealth },
    { name: 'Почта', state: channelHealth(logs, 'EMAIL') },
    { name: 'Голос', state: channelHealth(logs, 'VOICE') },
    { name: 'REST', state: apiHealthy === false ? 'Down' : channelHealth(logs, 'REST') === 'Down' ? 'Down' : 'Operational' },
    { name: 'Вебхуки', state: apiHealthy === false ? 'Down' : 'Operational' },
  ];

  const kpis = [
    { label: 'Всего заявок', value: String(totalTickets) },
    { label: 'Авто-диспетчер %', value: `${autoPct}%` },
    { label: 'Ждут оператора', value: String(waitingHitl) },
    { label: 'Средняя задержка', value: avgMs != null ? `${avgMs} мс` : '—' },
    { label: 'Ошибки', value: String(errors) },
    { label: 'SLA под риском', value: String(slaAtRisk) },
  ];

  return (
    <div id="logs-traces-page" className="grid gap-3">
      <PageSection
        title="Мониторинг системы"
        description="Живой поток логов GET /api/logs и безопасный разбор пайплайна без секретов и скрытой цепочки рассуждений."
        status={{
          tone: apiHealthy === false ? 'danger' : errors > 0 ? 'warning' : 'success',
          label: apiHealthy === false ? 'НЕДОСТУПЕН' : errors > 0 ? 'ОГРАНИЧЕН' : 'РАБОТАЕТ',
        }}
        actions={
          <button type="button" className="oc-btn" onClick={fetchLogs} aria-label="Обновить логи">
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Обновить
          </button>
        }
      />

      <div id="admin-monitoring" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="oc-kpi">
            <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">{k.label}</p>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      <section className="oc-card px-3 py-2" aria-label="Состояние сервисов">
        <h2 className="oc-section-title mb-2">Состояние сервисов</h2>
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8">
          {services.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1">
              <span className="text-[11px]">{s.name}</span>
              <StatusBadge tone={healthTone(s.state)} label={ruHealth(s.state)} />
            </li>
          ))}
        </ul>
      </section>

      <div className={`grid gap-3 ${selected ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
        <section id="admin-logs-stream" className="oc-card overflow-hidden" aria-label="Поток логов">
          <div className="flex flex-col gap-2 border-b border-[var(--oc-border)] px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center">
            <h2 className="oc-section-title mr-auto">Поток логов</h2>
            <div className="relative min-w-[160px] flex-1">
              <Search className="pointer-events-none absolute left-2 top-1.5 h-3.5 w-3.5 text-[var(--oc-muted)]" />
              <input
                className="oc-input pl-7"
                placeholder="Поиск…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Поиск по логам"
              />
            </div>
            <select
              className="oc-input w-auto"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              aria-label="Фильтр по уровню"
            >
              <option value="ALL">Уровень: все</option>
              <option value="INFO">ИНФО</option>
              <option value="SUCCESS">УСПЕХ</option>
              <option value="WARNING">ПРЕДУПР.</option>
              <option value="ERROR">ОШИБКА</option>
              <option value="CRITICAL">КРИТИЧ.</option>
            </select>
            <select
              className="oc-input w-auto"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              aria-label="Фильтр по каналу"
            >
              <option value="ALL">Канал: все</option>
              <option value="TELEGRAM">TELEGRAM</option>
              <option value="EMAIL">EMAIL</option>
              <option value="VOICE">VOICE</option>
              <option value="REST">REST</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="1C">1C</option>
            </select>
            <select
              className="oc-input w-auto"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeWindow)}
              aria-label="Фильтр по времени"
            >
              <option value="all">Время: всё</option>
              <option value="15m">Последние 15 мин</option>
              <option value="1h">Последний 1 ч</option>
              <option value="6h">Последние 6 ч</option>
              <option value="24h">Последние 24 ч</option>
            </select>
          </div>
          <div className="table-scroll">
            <table className="oc-table min-w-[780px]">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Уровень</th>
                  <th>Источник</th>
                  <th>Событие</th>
                  <th>Длительность</th>
                  <th>ID трейса</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--oc-muted)]">
                      Нет событий. Запустите сценарий на демо-стенде — записи появятся из GET /api/logs.
                    </td>
                  </tr>
                )}
                {filteredLogs.map((log) => {
                  const shown = displayLogLevel(log.level, log.message);
                  return (
                    <tr
                      key={log.id}
                      className={shown === 'CRITICAL' || shown === 'ERROR' ? 'row-critical' : ''}
                    >
                      <td className="whitespace-nowrap font-mono text-[11px]">{fmtTs(log.timestamp)}</td>
                      <td>
                        <StatusBadge tone={levelTone(shown)} label={ruLogLevel(shown)} />
                      </td>
                      <td className="font-mono text-[11px]">{log.channel}</td>
                      <td className="max-w-[280px] truncate" title={log.message}>
                        <button
                          type="button"
                          className="text-left text-[var(--oc-accent)] hover:underline"
                          onClick={() => setSelectedId(log.id)}
                        >
                          {log.message}
                        </button>
                      </td>
                      <td className="font-mono text-[11px]">
                        {log.duration_ms != null ? `${log.duration_ms} мс` : '—'}
                      </td>
                      <td className="font-mono text-[11px] text-[var(--oc-muted)]">{traceIdFor(log)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <aside className="oc-card flex max-h-[72vh] flex-col overflow-hidden" aria-label="Просмотр трейса">
            <div className="flex items-start justify-between gap-2 border-b border-[var(--oc-border)] px-3 py-2">
              <div>
                <p className="oc-section-title">Просмотр трейса</p>
                <p className="font-mono text-[11px] text-[var(--oc-muted)]">{traceIdFor(selected)}</p>
              </div>
              <button type="button" className="oc-btn" onClick={() => setSelectedId(null)} aria-label="Закрыть трейс">
                Закрыть
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="border-b border-[var(--oc-border)] px-3 py-2 text-[11px]">
                <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Запрос</p>
                <p className="mt-0.5">{selected.message}</p>
                <p className="mt-1 font-mono text-[var(--oc-muted)]">
                  {fmtTs(selected.timestamp)} · {selected.channel} · {selected.duration_ms ?? '—'} мс
                </p>
              </div>
              <ExecutionTraceTimeline
                trace={selectedMatchesLast && lastResult?.trace ? lastResult.trace : []}
                running={false}
              />
              {selected.details && (
                <div className="border-t border-[var(--oc-border)] px-3 py-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Безопасные метаданные</p>
                  <pre className="max-h-40 overflow-auto rounded bg-[var(--oc-bg)] p-2 font-mono text-[10px] text-[var(--oc-muted)]">
                    {JSON.stringify(redactSafeMeta(selected.details), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
