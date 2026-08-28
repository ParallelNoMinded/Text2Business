import React, { useEffect, useState } from 'react';
import { Ticket } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import {
  REMIND_NOTES,
  REMIND_PRESETS,
  formatRemindRemain,
  reminderActive,
  reminderDue,
  snoozeReminder,
  withReminder,
  withoutReminder,
} from '../dispatcherReminders';

interface DispatcherReminderProps {
  ticket: Ticket;
  operatorName: string;
  onPatch: (next: Ticket) => void;
}

export const DispatcherReminder: React.FC<DispatcherReminderProps> = ({ ticket, operatorName, onPatch }) => {
  const [note, setNote] = useState(ticket.remind_note || REMIND_NOTES[0]);
  const [now, setNow] = useState(() => Date.now());
  const author = operatorName || 'Диспетчер';

  useEffect(() => {
    if (!ticket.remind_at) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ticket.remind_at]);

  const due = reminderDue(ticket, now);
  const active = reminderActive(ticket);

  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Напоминание</p>
      {active && ticket.remind_at ? (
        <div className="grid gap-1.5 rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={due ? 'warning' : 'neutral'} label={due ? 'ПОРА' : formatRemindRemain(ticket.remind_at, now)} />
            <span>{ticket.remind_note || 'Перезвонить'}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" className={btn} onClick={() => onPatch(snoozeReminder(ticket, 15, author))}>
              +15 мин
            </button>
            <button type="button" className={btn} onClick={() => onPatch(withoutReminder(ticket, author, 'Напоминание отмечено.'))}>
              Готово
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-1.5">
          <div className="flex flex-wrap gap-1">
            {REMIND_NOTES.map((n) => (
              <button
                key={n}
                type="button"
                className={`rounded px-1.5 py-0.5 text-[11px] ${
                  note === n ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]' : 'border border-[var(--oc-border)]'
                }`}
                onClick={() => setNote(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {REMIND_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)]"
                onClick={() => onPatch(withReminder(ticket, p.minutes, note, author))}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const btn =
  'rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)] disabled:opacity-50';
