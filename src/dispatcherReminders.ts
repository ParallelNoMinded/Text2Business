import { Ticket } from './types';

export const REMIND_PRESETS: Array<{ id: string; minutes: number; label: string }> = [
  { id: '15m', minutes: 15, label: '15 мин' },
  { id: '1h', minutes: 60, label: '1 час' },
  { id: '3h', minutes: 180, label: '3 часа' },
];

export const REMIND_NOTES = ['Перезвонить клиенту', 'Проверить выезд', 'Написать в чат'];

export function remindAtFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function reminderActive(ticket: Ticket): boolean {
  return Boolean(ticket.remind_at);
}

export function reminderDue(ticket: Ticket, now = Date.now()): boolean {
  if (!ticket.remind_at) return false;
  const at = new Date(ticket.remind_at).getTime();
  return Number.isFinite(at) && at <= now;
}

export function dueReminders(tickets: Ticket[], now = Date.now()): Ticket[] {
  return tickets.filter((t) => reminderDue(t, now));
}

export function formatRemindRemain(iso: string, now = Date.now()): string {
  const at = new Date(iso).getTime();
  if (!Number.isFinite(at)) return '—';
  const ms = at - now;
  if (ms <= 0) return 'пора';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h >= 24) return `через ${Math.floor(h / 24)} д`;
  if (h >= 1) return `через ${h} ч ${m % 60} мин`;
  if (m >= 1) return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `00:${String(s).padStart(2, '0')}`;
}

export function withReminder(ticket: Ticket, minutes: number, note: string, author: string): Ticket {
  const remind_at = remindAtFromNow(minutes);
  const when = new Date(remind_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return {
    ...ticket,
    remind_at,
    remind_note: note,
    updated_at: new Date().toISOString(),
    history: [
      ...(ticket.history || []),
      {
        timestamp: new Date().toISOString(),
        note: `Напоминание: ${note} в ${when}.`,
        author,
      },
    ],
  };
}

export function withoutReminder(ticket: Ticket, author: string, note = 'Напоминание снято.'): Ticket {
  return {
    ...ticket,
    remind_at: undefined,
    remind_note: undefined,
    updated_at: new Date().toISOString(),
    history: [...(ticket.history || []), { timestamp: new Date().toISOString(), note, author }],
  };
}

export function snoozeReminder(ticket: Ticket, minutes: number, author: string): Ticket {
  const note = ticket.remind_note || REMIND_NOTES[0];
  return withReminder({ ...ticket, remind_at: undefined, remind_note: undefined }, minutes, note, author);
}
