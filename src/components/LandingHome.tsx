import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ruPriority } from '../uiRu';
import { TabType } from './Header';
import { Database, Activity, UserCheck, Zap, Plus } from 'lucide-react';
import { PageSection } from './layout/PageSection';
import { StatusBadge, StatusTone } from './ui/StatusBadge';
import { DatabaseSchema } from '../mockDb';
import { ProcessingResult, SystemLogEntry, Ticket } from '../types';
import { apiFetch } from '../api';
import {
  avgDurationMs,
  buildAiActivity,
  customerName,
  formatSla,
  isWaitingTicket,
  logsToEvents,
  priorityTone,
  slaBucket,
  sortPriorityQueue,
  statusLabel,
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
  change,
  tone,
  status,
}: {
  label: string;
  value: string | number;
  change: string;
  tone: StatusTone;
  status: string;
}) {
  return (
    <div className="oc-card px-2.5 py-2">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">{label}</p>
        <StatusBadge tone={tone} label={status} />
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--oc-muted)]">{change}</p>
    </div>
  );
}

function StatusCell({ k, label, tone }: { k: string; label: string; tone: StatusTone }) {
  return (
    <div className="flex min-w-0 items-center gap-2 py-1">
      <span className="w-[88px] shrink-0 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">{k}</span>
      <StatusBadge tone={tone} label={label} />
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

  return (
    <div className="grid gap-3">
      <PageSection
        title="Операционный центр"
        description="Состояние диспетчерского контура, очередь и SLA по живым данным реестра."
        status={{ tone: systemTone, label: systemLabel }}
      />

      <section className="oc-card px-3 py-2" aria-label="Состояние системы">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="oc-section-title">Состояние системы</h2>
          <span className="text-[10px] text-[var(--oc-muted)]">Обновлено {lastUpdate}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatusCell k="Система" label={systemLabel} tone={systemTone} />
          <StatusCell
            k="ИИ-диспетчер"
            label={engineUp ? 'АКТИВЕН' : 'СБОЙ'}
            tone={engineUp ? 'success' : 'danger'}
          />
          <StatusCell
            k="API"
            label={apiHealthy === false ? 'СБОЙ' : apiHealthy ? 'АКТИВЕН' : 'НЕИЗВЕСТНО'}
            tone={apiHealthy === false ? 'danger' : apiHealthy ? 'success' : 'neutral'}
          />
          <StatusCell k="База данных" label={dbHealthy ? 'В НОРМЕ' : 'НЕИЗВЕСТНО'} tone={dbHealthy ? 'success' : 'neutral'} />
          <StatusCell
            k="Интеграции"
            label={`${integrationsUp}/${webhookCount} активны`}
            tone={integrationsUp === webhookCount ? 'success' : 'warning'}
          />
        </div>
        {isDryRun && (
          <p className="mt-1 text-[10px] text-[var(--oc-muted)]">
            Режим черновика: запись в БД только после подтверждения оператором.
          </p>
        )}
      </section>

      <section aria-label="Показатели">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCell
            label="Открытые заявки"
            value={open.length}
            change={`${closed.length} закрытых в реестре`}
            tone={open.length ? 'info' : 'neutral'}
            status={open.length ? 'АКТИВНЫ' : 'ПРОСТОЙ'}
          />
          <KpiCell
            label="Критичные заявки"
            value={critical.length}
            change={critical.length ? 'высокий + критичный в очереди' : 'нет в очереди'}
            tone={critical.length ? 'danger' : 'success'}
            status={critical.length ? 'КРИТИЧНО' : 'В НОРМЕ'}
          />
          <KpiCell
            label="Ждут диспетчера"
            value={waiting.length}
            change={`${waiting.length}/${open.length || 0} из открытых`}
            tone={waiting.length ? 'warning' : 'success'}
            status={waiting.length ? 'ОЖИДАНИЕ' : 'В НОРМЕ'}
          />
          <KpiCell
            label="Авто-диспетчеризация"
            value={auto.length}
            change={`${auto.length} с участием ИИ среди открытых`}
            tone="info"
            status="АВТО"
          />
          <KpiCell
            label="SLA под риском"
            value={slaAtRisk}
            change={`${slaCounts.breached} просрочено · ${slaCounts.at_risk} под риском`}
            tone={slaCounts.breached ? 'danger' : slaCounts.at_risk ? 'warning' : 'success'}
            status={slaCounts.breached ? 'СБОЙ' : slaCounts.at_risk ? 'РИСК' : 'В НОРМЕ'}
          />
          <KpiCell
            label="Среднее время"
            value={avgMs === null ? '—' : `${avgMs} мс`}
            change={lastResult ? 'последний пайплайн и логи' : 'по /api/logs'}
            tone={avgMs === null ? 'neutral' : 'info'}
            status={avgMs === null ? 'ПРОСТОЙ' : 'В РАБОТЕ'}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <section className="oc-card lg:col-span-3" aria-label="Очередь по приоритету">
          <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
            <h2 className="oc-section-title">Очередь по приоритету</h2>
            <StatusBadge
              tone={waiting.length ? 'warning' : 'success'}
              label={waiting.length ? 'НА ПРОВЕРКЕ' : 'В НОРМЕ'}
            />
          </div>
          <div className="table-scroll">
            <table className="oc-table min-w-[720px]">
              <thead>
                <tr>
                  <th>ID заявки</th>
                  <th>Приоритет</th>
                  <th>Клиент</th>
                  <th>Инцидент</th>
                  <th>SLA</th>
                  <th>Статус</th>
                  <th>Группа</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[var(--oc-muted)]">
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
                      <td className="font-mono text-[11px] font-semibold">{t.ticket_id}</td>
                      <td>
                        <StatusBadge tone={priorityTone(t.priority)} label={ruPriority(t.priority)} />
                      </td>
                      <td className="whitespace-nowrap">{db ? customerName(db, t.customer_id) : t.customer_id}</td>
                      <td className="max-w-[220px] truncate" title={t.summary}>
                        {t.summary}
                      </td>
                      <td className="whitespace-nowrap font-mono text-[11px]">
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
                      <td>
                        <StatusBadge tone={st.tone} label={st.label} />
                      </td>
                      <td className="max-w-[140px] truncate text-[var(--oc-muted)]">{t.assigned_group}</td>
                      <td>
                        <button
                          type="button"
                          className="rounded px-1.5 py-0.5 text-[11px] text-[var(--oc-accent)] hover:bg-[var(--oc-accent-soft)]"
                          onClick={() => setActiveTab('operator')}
                        >
                          Открыть
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
            <StatusBadge tone="info" label="ИИ" />
          </div>
          <div className="oc-stream max-h-[280px] overflow-y-auto px-3 py-2">
            {aiEvents.length === 0 && (
              <p className="text-[var(--oc-muted)]">Нет событий пайплайна. Запустите демо-стенд.</p>
            )}
            {aiEvents.map((ev) => (
              <div key={ev.id} className="flex gap-2">
                <span className="shrink-0 text-[var(--oc-muted)]">[{ev.time}]</span>
                <span
                  className={
                    ev.tone === 'danger'
                      ? 'text-[var(--status-danger)]'
                      : ev.tone === 'warning'
                        ? 'text-[var(--status-warning)]'
                        : ev.tone === 'success'
                          ? 'text-[var(--status-success)]'
                          : 'text-[var(--oc-text)]'
                  }
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
          <h2 className="oc-section-title mb-2">Здоровье SLA</h2>
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
          <h2 className="oc-section-title mb-2">Быстрые действия</h2>
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
              {isAdmin ? 'Открыть реестр' : 'Открыть заявки'}
            </button>
            {isAdmin && (
            <button
              id="home-tile-logs"
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1 text-[12px] hover:bg-[var(--oc-surface-2)]"
              onClick={() => setActiveTab('logs_traces')}
            >
              <Activity className="h-3 w-3" aria-hidden="true" />
              Открыть логи
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
              Тест пайплайна ИИ
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

      <section className="oc-card" aria-label="Недавняя активность">
        <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Недавняя активность</h2>
          <span className="text-[10px] text-[var(--oc-muted)]">{logs.length} событий</span>
        </div>
        <div className="oc-stream max-h-40 overflow-y-auto px-3 py-2">
          {logs.length === 0 &&
            open.flatMap((t) => t.history || []).length === 0 && (
              <p className="text-[var(--oc-muted)]">Журнал пуст — события появятся после диспетчеризации.</p>
            )}
          {(logs.length > 0 ? logsToEvents(logs) : buildAiActivity(null, open)).slice(0, 10).map((ev) => (
            <div key={`ra-${ev.id}`} className="flex gap-2">
              <span className="shrink-0 text-[var(--oc-muted)]">[{ev.time}]</span>
              <span>{ev.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
