import React from 'react';
import { DatabaseSchema } from '../mockDb';
import { PageSection } from './layout/PageSection';
import { StatusBadge } from './ui/StatusBadge';
import { customerName, isWaitingTicket, slaBucket } from '../opsDashboard';
import { ruPriority } from '../uiRu';

interface WorkNotificationsViewProps {
  db: DatabaseSchema | null;
  onOpenAppeals: () => void;
}

export const WorkNotificationsView: React.FC<WorkNotificationsViewProps> = ({ db, onOpenAppeals }) => {
  if (!db) {
    return <p className="text-[11px] text-[var(--oc-muted)]">Загрузка уведомлений…</p>;
  }

  const waiting = db.open_tickets.filter(isWaitingTicket);
  const breached = db.open_tickets.filter((t) => slaBucket(t.sla_deadline) === 'breached');

  return (
    <div className="grid gap-3">
      <PageSection
        title="Уведомления"
        description="Очередь на проверку диспетчера и просроченные SLA. Ответ клиенту — в разделе «Обращения»."
        status={
          waiting.length > 0
            ? { tone: 'warning', label: String(waiting.length) }
            : { tone: 'success', label: 'НЕТ' }
        }
      />

      <section className="oc-card overflow-hidden">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">На проверке</h2>
        </div>
        {waiting.length === 0 ? (
          <p className="px-3 py-3 text-[12px] text-[var(--oc-muted)]">Нет обращений, ожидающих диспетчера.</p>
        ) : (
          <ul className="divide-y divide-[var(--oc-border)]">
            {waiting.map((t) => (
              <li key={t.ticket_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[12px]">
                <div>
                  <p className="font-mono text-[11px] text-[var(--oc-accent)]">{t.ticket_id}</p>
                  <p>
                    {customerName(db, t.customer_id)} · {t.summary}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="warning" label={ruPriority(t.priority)} />
                  <button type="button" className="oc-btn" onClick={onOpenAppeals}>
                    Открыть
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="oc-card overflow-hidden">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Просроченный SLA</h2>
        </div>
        {breached.length === 0 ? (
          <p className="px-3 py-3 text-[12px] text-[var(--oc-muted)]">Просроченных заявок нет.</p>
        ) : (
          <ul className="divide-y divide-[var(--oc-border)] px-3 py-1 text-[12px]">
            {breached.map((t) => (
              <li key={`b-${t.ticket_id}`} className="py-1.5">
                <span className="font-mono text-[11px]">{t.ticket_id}</span> · {t.summary}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
