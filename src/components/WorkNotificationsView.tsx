import React, { useEffect, useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import { Ticket } from '../types';
import { PageSection } from './layout/PageSection';
import { StatusBadge } from './ui/StatusBadge';
import { customerName, isWaitingTicket, requestStartTicket, requestTakeTicket, slaBucket } from '../opsDashboard';
import { ruPriority } from '../uiRu';
import { dueReminders, formatRemindRemain, reminderDue, snoozeReminder, withoutReminder } from '../dispatcherReminders';

interface WorkNotificationsViewProps {
  db: DatabaseSchema | null;
  onOpenAppeals: () => void;
  onStartTicket?: (ticketId: string) => void;
  onUpdateDb?: (db: DatabaseSchema) => void;
  operatorName?: string;
}

export const WorkNotificationsView: React.FC<WorkNotificationsViewProps> = ({
  db,
  onOpenAppeals,
  onStartTicket,
  onUpdateDb,
  operatorName,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!db) {
    return <p className="text-[11px] text-[var(--oc-muted)]">Загрузка уведомлений…</p>;
  }

  const waiting = db.open_tickets.filter(isWaitingTicket);
  const breached = db.open_tickets.filter((t) => slaBucket(t.sla_deadline) === 'breached');
  const due = dueReminders(db.open_tickets, now);
  const upcoming = db.open_tickets.filter((t) => t.remind_at && !reminderDue(t, now));
  const alertCount = waiting.length + due.length;
  const author = operatorName || 'Диспетчер';

  const patchTicket = (next: Ticket) => {
    if (!onUpdateDb) return;
    onUpdateDb({
      ...db,
      open_tickets: db.open_tickets.map((t) => (t.ticket_id === next.ticket_id ? next : t)),
    });
  };

  return (
    <div className="grid gap-3">
      <PageSection
        title="Уведомления"
        description="Очередь на проверку, напоминания и просроченный SLA."
        status={
          alertCount > 0
            ? { tone: 'warning', label: String(alertCount) }
            : { tone: 'success', label: 'НЕТ' }
        }
      />

      <section className="oc-card overflow-hidden">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Напоминания</h2>
        </div>
        {due.length === 0 && upcoming.length === 0 ? (
          <p className="px-3 py-3 text-[12px] text-[var(--oc-muted)]">Нет напоминаний. Поставьте «+15 мин» на карточке заявки.</p>
        ) : (
          <ul className="divide-y divide-[var(--oc-border)]">
            {due.map((t) => (
              <li key={`r-${t.ticket_id}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[12px]">
                <div>
                  <p className="font-mono text-[11px] text-[var(--oc-accent)]">{t.ticket_id}</p>
                  <p className="break-words">
                    {t.remind_note || 'Перезвонить'} · {customerName(db, t.customer_id)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="warning" label="ПОРА" />
                  {onStartTicket && (
                    <button type="button" className="oc-btn" onClick={() => onStartTicket(t.ticket_id)}>
                      Открыть
                    </button>
                  )}
                  {onUpdateDb && (
                    <>
                      <button type="button" className="oc-btn" onClick={() => patchTicket(snoozeReminder(t, 15, author))}>
                        +15 мин
                      </button>
                      <button
                        type="button"
                        className="oc-btn"
                        onClick={() => patchTicket(withoutReminder(t, author, 'Напоминание отмечено.'))}
                      >
                        Готово
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
            {upcoming.map((t) => (
              <li key={`u-${t.ticket_id}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[12px]">
                <div>
                  <p className="font-mono text-[11px] text-[var(--oc-accent)]">{t.ticket_id}</p>
                  <p className="break-words text-[var(--oc-muted)]">
                    {t.remind_note || 'Перезвонить'} · {t.remind_at ? formatRemindRemain(t.remind_at, now) : ''}
                  </p>
                </div>
                {onStartTicket && (
                  <button type="button" className="oc-btn" onClick={() => onStartTicket(t.ticket_id)}>
                    Открыть
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

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
                  <p className="break-words">
                    {customerName(db, t.customer_id)} · {t.summary}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="warning" label={ruPriority(t.priority)} />
                  <button
                    type="button"
                    className="oc-btn"
                    onClick={() => {
                      requestTakeTicket(t.ticket_id);
                      onOpenAppeals();
                    }}
                  >
                    Взять
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
              <li key={`b-${t.ticket_id}`} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                <span>
                  <span className="font-mono text-[11px]">{t.ticket_id}</span> · <span className="break-words">{t.summary}</span>
                </span>
                {onStartTicket && (
                  <button type="button" className="oc-btn" onClick={() => onStartTicket(t.ticket_id)}>
                    Приступить
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
