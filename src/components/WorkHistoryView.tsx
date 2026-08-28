import React, { useMemo } from 'react';
import { DatabaseSchema } from '../mockDb';
import { PageSection } from './layout/PageSection';

interface WorkHistoryViewProps {
  db: DatabaseSchema | null;
}

export const WorkHistoryView: React.FC<WorkHistoryViewProps> = ({ db }) => {
  const events = useMemo(() => {
    if (!db) return [];
    const tickets = [...db.open_tickets, ...db.closed_tickets];
    return tickets
      .flatMap((t) =>
        (t.history || []).map((h, i) => ({
          id: `${t.ticket_id}-${i}-${h.timestamp}`,
          ticketId: t.ticket_id,
          summary: t.summary,
          timestamp: h.timestamp,
          note: h.note,
          author: h.author,
        }))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 80);
  }, [db]);

  if (!db) {
    return <p className="text-[11px] text-[var(--oc-muted)]">Загрузка истории…</p>;
  }

  return (
    <div className="grid gap-3">
      <PageSection
        title="История"
        description="События по заявкам."
      />
      <section className="oc-card">
        <div className="oc-stream max-h-[70vh] overflow-y-auto px-3 py-2 text-[12px]">
          {events.length === 0 && <p className="text-[var(--oc-muted)]">История пока пуста.</p>}
          {events.map((ev) => (
            <div key={ev.id} className="flex flex-col gap-1 border-b border-[var(--oc-border)] py-1.5 last:border-0 sm:flex-row sm:gap-2">
              <span className="w-[7.5rem] shrink-0 font-mono text-[10px] text-[var(--oc-muted)]">
                {new Date(ev.timestamp).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <div className="min-w-0 break-words">
                <p className="font-mono text-[11px] text-[var(--oc-accent)]">
                  {ev.ticketId}
                  <span className="ml-2 font-sans text-[var(--oc-muted)]">{ev.summary}</span>
                </p>
                <p>
                  {ev.note}{' '}
                  <span className="text-[var(--oc-muted)]">· {ev.author}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
