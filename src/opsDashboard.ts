import { DatabaseSchema } from './mockDb';
import { ProcessingResult, SystemLogEntry, Ticket, TraceStep } from './types';
import { StatusTone } from './components/ui/StatusBadge';

const PRIORITY_RANK: Record<Ticket['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export type SlaBucket = 'on_time' | 'at_risk' | 'breached';

export function isWaitingTicket(t: Ticket): boolean {
  return t.status === 'WAITING_DISPATCHER' || Boolean(t.missing_fields && t.missing_fields.length > 0);
}

export function slaBucket(deadlineIso: string, nowMs = Date.now()): SlaBucket {
  const due = new Date(deadlineIso).getTime();
  if (Number.isNaN(due)) return 'on_time';
  if (due < nowMs) return 'breached';
  const twoHours = 2 * 60 * 60 * 1000;
  if (due - nowMs <= twoHours) return 'at_risk';
  return 'on_time';
}

export function formatSla(deadlineIso: string, nowMs = Date.now()): string {
  const due = new Date(deadlineIso).getTime();
  if (Number.isNaN(due)) return '—';
  const delta = due - nowMs;
  const absMin = Math.round(Math.abs(delta) / 60000);
  const days = Math.floor(absMin / (60 * 24));
  const h = Math.floor((absMin % (60 * 24)) / 60);
  const m = absMin % 60;
  const span = days > 0 ? `${days}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return delta < 0 ? `-${span}` : span;
}

export function customerName(db: DatabaseSchema, customerId: string): string {
  const contractor = db.contractors.find((c) => c.customer_id === customerId);
  if (contractor) return contractor.name.replace(/^ООО\s+/, '').replace(/"/g, '');
  const site = db.sites.find((s) => s.customer_id === customerId);
  return site?.customer_name || customerId;
}

export function wasAutoDispatched(t: Ticket): boolean {
  return (t.history || []).some((h) => /AI Dispatcher/i.test(h.author));
}

export function sortPriorityQueue(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const slaA = slaBucket(a.sla_deadline);
    const slaB = slaBucket(b.sla_deadline);
    const slaRank = { breached: 0, at_risk: 1, on_time: 2 };
    if (slaRank[slaA] !== slaRank[slaB]) return slaRank[slaA] - slaRank[slaB];
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
}

export function statusLabel(t: Ticket): { tone: StatusTone; label: string } {
  if (isWaitingTicket(t)) return { tone: 'warning', label: 'НА ПРОВЕРКЕ' };
  if (t.status === 'IN_PROGRESS') return { tone: 'info', label: 'В РАБОТЕ' };
  if (t.status === 'NEW') return { tone: 'info', label: 'НОВАЯ' };
  if (t.status === 'RESOLVED' || t.status === 'CLOSED') return { tone: 'success', label: 'ЗАКРЫТА' };
  const ru: Record<string, string> = { WAITING_DISPATCHER: 'ОЖИДАЕТ ДИСПЕТЧЕРА' };
  return { tone: 'neutral', label: ru[t.status] || t.status };
}

export function priorityTone(p: Ticket['priority']): StatusTone {
  if (p === 'critical') return 'danger';
  if (p === 'high') return 'warning';
  if (p === 'medium') return 'info';
  return 'neutral';
}

const STEP_LABELS: Record<string, string> = {
  '01_guardrails_and_sanitization': 'Проверка защитных правил',
  '02_fact_extraction': 'Факты извлечены',
  '03_tool_find_customer_or_site': 'Клиент определён',
  '04_tool_find_assets_and_open_tickets': 'Оборудование сопоставлено',
  '05_tool_get_contract_and_sla': 'SLA рассчитан',
  '06_decision_engine_matrix': 'Решение сформировано',
  '07_dry_run_execution': 'Нужно подтверждение оператора',
};

export interface ActivityEvent {
  id: string;
  time: string;
  text: string;
  tone: StatusTone;
}

function timePart(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 8);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function buildAiActivity(result: ProcessingResult | null, tickets: Ticket[]): ActivityEvent[] {
  if (result?.trace?.length) {
    const ticketId = result.ticket_payload?.ticket_id || result.target_ticket_id || 'ticket';
    const extra: ActivityEvent[] = [];
    if (result.status === 'REQUIRES_HUMAN_CONFIRMATION') {
      extra.push({
        id: 'confirm',
        time: timePart(new Date().toISOString()),
        text: `Нужно подтверждение оператора (${ticketId})`,
        tone: 'warning' as const,
      });
    }
    return [
      ...result.trace.map((step: TraceStep): ActivityEvent => ({
        id: step.id,
        time: step.timestamp.length <= 8 ? step.timestamp : timePart(step.timestamp),
        text:
          step.step_name === '06_decision_engine_matrix'
            ? `Заявка ${ticketId} разобрана · ${result.recommended_action}`
            : STEP_LABELS[step.step_name] || step.step_name,
        tone:
          step.status === 'ERROR'
            ? 'danger'
            : step.status === 'WARNING'
              ? 'warning'
              : step.status === 'INFO'
                ? 'info'
                : 'success',
      })),
      ...extra,
    ].slice(-14);
  }

  const fromHistory: ActivityEvent[] = tickets.flatMap((t) =>
    (t.history || []).map((h, i) => ({
      id: `${t.ticket_id}-h-${i}`,
      time: timePart(h.timestamp),
      text: h.note,
      tone: /HITL|уточнен/i.test(h.note) ? 'warning' : 'info',
    }))
  );

  return fromHistory.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 14);
}

export function logsToEvents(logs: SystemLogEntry[]): ActivityEvent[] {
  return logs.slice(0, 12).map((l) => ({
    id: l.id,
    time: timePart(l.timestamp),
    text: l.message,
    tone:
      l.level === 'ERROR'
        ? 'danger'
        : l.level === 'WARN'
          ? 'warning'
          : l.level === 'SUCCESS'
            ? 'success'
            : 'info',
  }));
}

export function avgDurationMs(logs: SystemLogEntry[], result: ProcessingResult | null): number | null {
  const logAvg =
    logs.length > 0
      ? Math.round(logs.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / logs.length)
      : 0;
  if (logAvg > 0) return logAvg;
  if (result?.trace?.length) {
    return Math.round(result.trace.reduce((acc, s) => acc + (s.duration_ms || 0), 0));
  }
  return null;
}

const SECRET_KEY = /token|password|secret|authorization|api[_-]?key|cookie|credential|private[_-]?key/i;
const HIDDEN_KEY = /reasoning|chain.?of.?thought|thought|system_instruction|prompt|raw_llm/i;

export function redactSafeMeta(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (typeof value === 'string') {
    if (value.length > 240) return `${value.slice(0, 240)}…`;
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 12).map((v) => redactSafeMeta(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(k)) {
        out[k] = '[скрыто]';
        continue;
      }
      if (HIDDEN_KEY.test(k)) continue;
      out[k] = redactSafeMeta(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function displayLogLevel(level: SystemLogEntry['level'], message: string): string {
  if (level === 'WARN') return 'WARNING';
  if (level === 'ERROR' && /critical|fatal|crash/i.test(message)) return 'CRITICAL';
  return level;
}
