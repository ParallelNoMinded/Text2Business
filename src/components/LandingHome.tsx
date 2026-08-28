import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ruPriority } from '../uiRu';
import { TabType } from './Header';
import { Database, Activity, UserCheck, Zap, Plus, Phone, Play } from 'lucide-react';
import { PageSection } from './layout/PageSection';
import { StatusBadge, StatusTone } from './ui/StatusBadge';
import { DatabaseSchema } from '../mockDb';
import { ProcessingResult, SystemLogEntry, Ticket } from '../types';
import { apiFetch } from '../api';
import {
  avgDurationMs,
  buildAiActivity,
  channelLabel,
  customerName,
  formatSla,
  isWaitingTicket,
  logsToEvents,
  priorityTone,
  requestStartTicket,
  requestTakeTicket,
  slaBucket,
  sortPriorityQueue,
  statusLabel,
  ticketChannel,
  wasAutoDispatched,
} from '../opsDashboard';

interface LandingHomeProps {
  setActiveTab: (tab: TabType) => void;
  theme?: 'dark' | 'light';
  onRunPreset?: (presetId: string) => void;
  pendingOperatorCount?: number;
  apiHealthy?: boolean | null;
  db?: DatabaseSchema | null;
  lastResult?: ProcessingResult | null;
  geminiActive?: boolean;
  githubToken?: string;
  isDryRun?: boolean;
  isAdmin?: boolean;
}

interface HealthPayload {
  status?: string;
  gemini_enabled?: boolean;
  telegram_bot_configured?: boolean;
  webhook_endpoints?: Record<string, string>;
}

function KpiCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="oc-card px-2.5 py-2">
      <p className="text-[10px] text-[var(--oc-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums leading-none">{value}</p>
      {hint ? <p className="mt-1 hidden text-[11px] text-[var(--oc-muted)] sm:block">{hint}</p> : null}
    </div>
  );
}

export const LandingHome: React.FC<LandingHomeProps> = ({
  setActiveTab,
  apiHealthy = null,
  db = null,
  lastResult = null,
  geminiActive = false,
  githubToken = '',
  isDryRun = true,
  isAdmin = false,
}) => {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      /* keep last */
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) setHealth(await res.json());
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchLogs();
    fetchHealth();
    const id = setInterval(() => {
      if (isAdmin) fetchLogs();
      fetchHealth();
      setUpdatedAt(new Date());
    }, 4000);
    return () => clearInterval(id);
  }, [fetchLogs, fetchHealth, isAdmin]);

  const open = db?.open_tickets || [];
  const closed = db?.closed_tickets || [];
  const waiting = open.filter(isWaitingTicket);
  const critical = open.filter((t) => t.priority === 'critical' || t.priority === 'high');
  const auto = open.filter((t) => wasAutoDispatched(t) && !isWaitingTicket(t));
  const slaCounts = {
    on_time: open.filter((t) => slaBucket(t.sla_deadline) === 'on_time').length,
    at_risk: open.filter((t) => slaBucket(t.sla_deadline) === 'at_risk').length,
    breached: open.filter((t) => slaBucket(t.sla_deadline) === 'breached').length,
  };
  const slaAtRisk = slaCounts.at_risk + slaCounts.breached;
  const avgMs = avgDurationMs(logs, lastResult);
  const queue = sortPriorityQueue(open);
  const aiEvents = useMemo(() => {
    const fromTrace = buildAiActivity(lastResult, open);
    if (fromTrace.length > 0) return fromTrace;
    return logsToEvents(logs);
  }, [lastResult, open, logs]);

  const webhookCount = health?.webhook_endpoints ? Object.keys(health.webhook_endpoints).length : 5;
  const integrationsUp = health?.telegram_bot_configured ? webhookCount : Math.max(0, webhookCount - 1);
  const dbHealthy = Boolean(db && db.sites?.length);
  const engineUp = apiHealthy === true;

  const systemTone: StatusTone = !engineUp ? 'danger' : waiting.length > 0 ? 'warning' : 'success';
  const systemLabel = !engineUp ? 'СБОЙ' : waiting.length > 0 ? 'НА ПРОВЕРКЕ' : 'РАБОТАЕТ';

  const slaTotal = Math.max(open.length, 1);
  const lastUpdate = updatedAt.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const incoming = sortPriorityQueue(waiting)[0];
  const nextJob = sortPriorityQueue(open.filter((t) => !isWaitingTicket(t)))[0];

  return (
    <div className="grid gap-3">
      <PageSection title="Сводка" status={{ tone: systemTone, label: systemLabel }} />

      <section className="oc-card px-3 py-2" aria-label="Состояние системы">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[10px] text-[var(--oc-muted)]">{lastUpdate}</span>
          <StatusBadge tone={engineUp ? 'success' : 'danger'} label={engineUp ? 'ИИ' : 'ИИ сбой'} />
          <StatusBadge
            tone={apiHealthy === false ? 'danger' : apiHealthy ? 'success' : 'neutral'}
            label={apiHealthy === false ? 'API сбой' : apiHealthy ? 'API' : 'API ?'}
          />
          <StatusBadge tone={dbHealthy ? 'success' : 'neutral'} label={dbHealthy ? 'БД' : 'БД ?'} />
          <StatusBadge
            tone={integrationsUp === webhookCount ? 'success' : 'warning'}
            label={`Инт. ${integrationsUp}/${webhookCount}`}
          />
          {isDryRun ? <StatusBadge tone="neutral" label="Черновик" /> : null}
        </div>
      </section>

      <section aria-label="Показатели">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCell label="Открытые" value={open.length} hint={`${closed.length} закрытых`} />
          <KpiCell label="Критичные" value={critical.length} />
          <KpiCell label="На проверке" value={waiting.length} />
          <KpiCell label="Авто" value={auto.length} />
          <KpiCell
            label="SLA риск"
            value={slaAtRisk}
            hint={`${slaCounts.breached} проср. · ${slaCounts.at_risk} риск`}
          />
          <KpiCell label="Среднее время" value={avgMs === null ? '—' : `${avgMs} мс`} />
        </div>
      </section>

      {incoming && db ? (
        <section className="oc-on-line oc-card px-3 py-3" aria-label="Входящее на линии">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">На линии</p>
              <p className="mt-0.5 text-[13px] leading-snug">
                {channelLabel(ticketChannel(incoming))} · {customerName(db, incoming.customer_id)} · {incoming.ticket_id}
              </p>
              <p className="mt-1 break-words text-[12px] leading-snug text-[var(--oc-muted)]">
                «
                {([... (incoming.messages || [])].reverse().find((m) => m.sender === 'client')?.text ||
                  incoming.description ||
                  incoming.summary)}
                »
              </p>
              {waiting.length > 1 ? (
                <p className="mt-1 text-[11px] text-[var(--oc-muted)]">ещё {waiting.length - 1} ждут</p>
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--oc-accent-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--oc-accent)]"
              onClick={() => {
                requestTakeTicket(incoming.ticket_id);
                setActiveTab('operator');
              }}
            >
              <Phone className="h-3 w-3" aria-hidden="true" />
              Взять обращение
            </button>
          </div>
        </section>
      ) : null}

      {nextJob && db ? (
        <section className="oc-card px-3 py-3" aria-label="Следующая заявка">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Заявка</p>
              <p className="mt-0.5 text-[13px] leading-snug">
                {nextJob.ticket_id} · {customerName(db, nextJob.customer_id)} · {ruPriority(nextJob.priority)}
              </p>
              <p className="mt-1 break-words text-[12px] leading-snug text-[var(--oc-muted)]">{nextJob.summary}</p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--oc-accent-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--oc-accent)]"
              onClick={() => {
                requestStartTicket(nextJob.ticket_id);
                setActiveTab('database');
              }}
            >
              <Play className="h-3 w-3" aria-hidden="true" />
              Приступить
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <section className="oc-card lg:col-span-3" aria-label="Очередь по приоритету">
          <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
            <h2 className="oc-section-title">Очередь</h2>
            {waiting.length > 0 ? (
              <StatusBadge tone="warning" label={`${waiting.length}`} />
            ) : null}
          </div>
          <div className="table-scroll">
            <table className="oc-table oc-table-stack">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Приоритет</th>
                  <th>Клиент</th>
                  <th>Инцидент</th>
                  <th>SLA</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[var(--oc-muted)]">
                      Очередь пуста
                    </td>
                  </tr>
                )}
                {queue.map((t: Ticket) => {
                  const sla = slaBucket(t.sla_deadline);
                  const st = statusLabel(t);
                  const criticalRow = t.priority === 'critical' || sla === 'breached';
                  return (
                    <tr key={t.ticket_id} className={criticalRow ? 'row-critical' : undefined}>
                      <td className="font-mono text-[11px] font-semibold" data-label="ID">{t.ticket_id}</td>
                      <td data-label="Приоритет">
                        <StatusBadge tone={priorityTone(t.priority)} label={ruPriority(t.priority)} />
                      </td>
                      <td data-label="Клиент">{db ? customerName(db, t.customer_id) : t.customer_id}</td>
                      <td data-label="Инцидент">{t.summary}</td>
                      <td className="font-mono text-[11px]" data-label="SLA">
                        <span
                          className={
                            sla === 'breached'
                              ? 'text-[var(--status-danger)]'
                              : sla === 'at_risk'
                                ? 'text-[var(--status-warning)]'
                                : 'text-[var(--oc-muted)]'
                          }
                        >
                          {formatSla(t.sla_deadline)}
                        </span>
                      </td>
                      <td data-label="Статус">
                        <StatusBadge tone={st.tone} label={st.label} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="rounded px-1.5 py-0.5 text-[11px] text-[var(--oc-accent)] hover:bg-[var(--oc-accent-soft)]"
                          onClick={() => {
                            if (isWaitingTicket(t)) {
                              requestTakeTicket(t.ticket_id);
                              setActiveTab('operator');
                            } else {
                              requestStartTicket(t.ticket_id);
                              setActiveTab('database');
                            }
                          }}
                        >
                          {isWaitingTicket(t) ? 'Взять' : 'Приступить'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="oc-card flex flex-col lg:col-span-2" aria-label="Активность ИИ">
          <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
            <h2 className="oc-section-title">Активность ИИ</h2>
          </div>
          <div className="oc-stream max-h-[280px] overflow-y-auto px-3 py-2">
            {aiEvents.length === 0 && (
              <p className="text-[var(--oc-muted)]">Нет событий</p>
            )}
            {aiEvents.map((ev) => (
              <div key={ev.id} className="flex gap-2">
                <span className="shrink-0 text-[var(--oc-muted)]">[{ev.time}]</span>
                <span
                  className={`min-w-0 break-words ${
                    ev.tone === 'danger'
                      ? 'text-[var(--status-danger)]'
                      : ev.tone === 'warning'
                        ? 'text-[var(--status-warning)]'
                        : ev.tone === 'success'
                          ? 'text-[var(--status-success)]'
                          : 'text-[var(--oc-text)]'
                  }`}
                >
                  {ev.text}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section className="oc-card px-3 py-2" aria-label="Здоровье SLA">
          <h2 className="oc-section-title mb-2">SLA</h2>
          {(
            [
              ['В срок', slaCounts.on_time, 'success'],
              ['Под риском', slaCounts.at_risk, 'warning'],
              ['Просрочено', slaCounts.breached, 'danger'],
            ] as const
          ).map(([label, n, tone]) => (
            <div key={label} className="mb-1.5 flex items-center gap-2">
              <span className="w-16 shrink-0 text-[11px] text-[var(--oc-muted)]">{label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--oc-surface-2)]">
                <div
                  className={`h-full ${
                    tone === 'success'
                      ? 'bg-[var(--status-success)]'
                      : tone === 'warning'
                        ? 'bg-[var(--status-warning)]'
                        : 'bg-[var(--status-danger)]'
                  }`}
                  style={{ width: `${Math.round((n / slaTotal) * 100)}%` }}
                />
              </div>
              <span className="w-6 text-right text-[11px] tabular-nums">{n}</span>
            </div>
          ))}
        </section>

        <section className="oc-card px-3 py-2 lg:col-span-2" aria-label="Быстрые действия">
          <h2 className="oc-section-title mb-2">Перейти</h2>
          <div className="flex flex-wrap gap-1.5">
            <button
              id="home-tile-operator"
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1 text-[12px] hover:bg-[var(--oc-surface-2)]"
              onClick={() => setActiveTab('operator')}
            >
              <UserCheck className="h-3 w-3" aria-hidden="true" />
              Обращения
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1 text-[12px] hover:bg-[var(--oc-surface-2)]"
              onClick={() => setActiveTab('database')}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Создать заявку
            </button>
            <button
              id="home-tile-database"
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1 text-[12px] hover:bg-[var(--oc-surface-2)]"
              onClick={() => setActiveTab('database')}
            >
              <Database className="h-3 w-3" aria-hidden="true" />
              {isAdmin ? 'Реестр' : 'Заявки'}
            </button>
            {isAdmin && (
            <button
              id="home-tile-logs"
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1 text-[12px] hover:bg-[var(--oc-surface-2)]"
              onClick={() => setActiveTab('logs_traces')}
            >
              <Activity className="h-3 w-3" aria-hidden="true" />
              Логи
            </button>
            )}
            {isAdmin && (
            <button
              id="home-tile-console"
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1 text-[12px] hover:bg-[var(--oc-surface-2)]"
              onClick={() => setActiveTab('console')}
            >
              <Zap className="h-3 w-3" aria-hidden="true" />
              Демо ИИ
            </button>
            )}
            {isAdmin && (
            <button
              id="home-tile-channels"
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1 text-[12px] hover:bg-[var(--oc-surface-2)]"
              onClick={() => setActiveTab('channels')}
            >
              Каналы
            </button>
            )}
          </div>
        </section>
      </div>

    </div>
  );
};
