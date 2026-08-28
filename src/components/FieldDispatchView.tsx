import React, { useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import { Ticket } from '../types';
import { PageSection } from './layout/PageSection';
import { StatusBadge } from './ui/StatusBadge';
import { customerName, formatSla, slaBucket } from '../opsDashboard';
import { FIELD_CREWS, VisitStatus, VISIT_COLUMNS, visitChecklistDone, visitShowsChecklist } from '../fieldCrews';
import { VisitChecklist } from './VisitChecklist';
import { ruPriority } from '../uiRu';

interface FieldDispatchViewProps {
  db: DatabaseSchema | null;
  onUpdateDb: (updatedDb: DatabaseSchema) => void;
}

function visitOf(t: Ticket): VisitStatus {
  return t.visit_status || 'queued';
}

function crewById(id?: string) {
  return FIELD_CREWS.find((c) => c.id === id);
}

export const FieldDispatchView: React.FC<FieldDispatchViewProps> = ({ db, onUpdateDb }) => {
  const [pickId, setPickId] = useState<string | null>(null);
  const [crewId, setCrewId] = useState(FIELD_CREWS[0].id);
  const [eta, setEta] = useState(45);

  if (!db) {
    return <p className="text-[11px] text-[var(--oc-muted)]">Загрузка выездов…</p>;
  }

  const open = db.open_tickets;
  const loadOf = (id: string) =>
    open.filter((t) => t.assigned_crew === id && visitOf(t) !== 'done' && visitOf(t) !== 'queued').length;

  const patchTicket = (ticketId: string, patch: Partial<Ticket>, note?: string) => {
    onUpdateDb({
      ...db,
      open_tickets: db.open_tickets.map((t) =>
        t.ticket_id === ticketId
          ? {
              ...t,
              ...patch,
              updated_at: new Date().toISOString(),
              history: note
                ? [
                    ...(t.history || []),
                    { timestamp: new Date().toISOString(), note, author: 'Диспетчер' },
                  ]
                : t.history,
            }
          : t
      ),
    });
  };

  const assign = (ticket: Ticket) => {
    const crew = crewById(crewId);
    if (!crew) return;
    patchTicket(
      ticket.ticket_id,
      {
        assigned_crew: crew.id,
        assigned_group: crew.name,
        visit_status: 'en_route',
        eta_minutes: eta,
        status: ticket.status === 'WAITING_DISPATCHER' ? ticket.status : 'IN_PROGRESS',
      },
      `Выезд: ${crew.name}, ETA ${eta} мин.`
    );
    setPickId(null);
  };

  const advance = (ticket: Ticket) => {
    const now = visitOf(ticket);
    if (now === 'en_route') {
      patchTicket(ticket.ticket_id, { visit_status: 'on_site', eta_minutes: 0 }, 'Бригада на объекте.');
      return;
    }
    if (now === 'on_site') {
      if (!visitChecklistDone(ticket.visit_checklist)) return;
      patchTicket(ticket.ticket_id, { visit_status: 'done' }, 'Выезд закрыт. Чек-лист заполнен.');
    }
  };

  const recall = (ticket: Ticket) => {
    patchTicket(
      ticket.ticket_id,
      { visit_status: 'queued', assigned_crew: undefined, eta_minutes: undefined },
      'Выезд снят, заявка снова в пуле.'
    );
  };

  const onRoute = open.filter((t) => visitOf(t) === 'en_route' || visitOf(t) === 'on_site').length;

  return (
    <div className="grid gap-3">
      <PageSection
        title="Выезды"
        description="Бригада, ETA и статус на объекте."
        status={
          onRoute
            ? { tone: 'info', label: `${onRoute} В ПОЛЕ` }
            : { tone: 'success', label: 'ПУСТО' }
        }
      />

      <section className="oc-card overflow-hidden" aria-label="Смены">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Смены</h2>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {FIELD_CREWS.map((crew) => {
            const load = loadOf(crew.id);
            const busy = load >= crew.capacity;
            return (
              <article key={crew.id} className="rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] leading-snug">{crew.name}</p>
                  <StatusBadge tone={busy ? 'warning' : 'success'} label={busy ? 'ЗАНЯТА' : 'СВОБОДНА'} />
                </div>
                <p className="mt-1 text-[11px] text-[var(--oc-muted)]">
                  {crew.lead} · {crew.region}
                </p>
                <p className="mt-0.5 font-mono text-[11px]">{crew.phone}</p>
                <p className="mt-1 text-[11px] tabular-nums text-[var(--oc-muted)]">
                  {load}/{crew.capacity} выездов
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-4">
        {VISIT_COLUMNS.map((col) => {
          const rows = open.filter((t) => visitOf(t) === col.id);
          return (
            <section key={col.id} className="oc-card min-w-0 overflow-hidden" aria-label={col.label}>
              <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
                <h2 className="oc-section-title">{col.label}</h2>
                <span className="text-[11px] tabular-nums text-[var(--oc-muted)]">{rows.length}</span>
              </div>
              <div className="grid gap-2 p-2">
                {rows.length === 0 && (
                  <p className="px-1 py-3 text-center text-[11px] text-[var(--oc-muted)]">Пусто</p>
                )}
                {rows.map((t) => {
                  const crew = crewById(t.assigned_crew);
                  const sla = slaBucket(t.sla_deadline);
                  return (
                    <article
                      key={t.ticket_id}
                      className={`rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2.5 py-2 ${
                        sla === 'breached' ? 'row-critical' : ''
                      }`}
                    >
                      <p className="font-mono text-[11px] text-[var(--oc-accent)]">{t.ticket_id}</p>
                      <p className="mt-0.5 text-[12px] leading-snug">{t.summary}</p>
                      <p className="mt-1 text-[11px] text-[var(--oc-muted)]">
                        {customerName(db, t.customer_id)} · SLA {formatSla(t.sla_deadline)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <StatusBadge
                          tone={t.priority === 'high' || t.priority === 'critical' ? 'warning' : 'info'}
                          label={ruPriority(t.priority)}
                        />
                        {crew ? <StatusBadge tone="neutral" label={crew.region} /> : null}
                        {typeof t.eta_minutes === 'number' && visitOf(t) === 'en_route' ? (
                          <StatusBadge tone="info" label={`ETA ${t.eta_minutes}м`} />
                        ) : null}
                      </div>
                      {crew && visitOf(t) !== 'queued' ? (
                        <p className="mt-1 text-[11px] leading-snug text-[var(--oc-muted)]">{crew.name}</p>
                      ) : null}

                      {col.id === 'queued' && (
                        <div className="mt-2 grid gap-1.5">
                          {pickId === t.ticket_id ? (
                            <>
                              <div className="flex flex-wrap gap-1">
                                {FIELD_CREWS.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCrewId(c.id)}
                                    className={`rounded px-1.5 py-0.5 text-[11px] ${
                                      crewId === c.id
                                        ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]'
                                        : 'border border-[var(--oc-border)] hover:bg-[var(--oc-surface-2)]'
                                    }`}
                                  >
                                    {c.region}
                                  </button>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {[30, 45, 90].map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setEta(m)}
                                    className={`rounded px-1.5 py-0.5 text-[11px] ${
                                      eta === m
                                        ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]'
                                        : 'border border-[var(--oc-border)] hover:bg-[var(--oc-surface-2)]'
                                    }`}
                                  >
                                    {m} мин
                                  </button>
                                ))}
                              </div>
                              <button
                                type="button"
                                className="rounded-md bg-[var(--oc-accent-soft)] px-2 py-1 text-[11px] font-medium text-[var(--oc-accent)]"
                                onClick={() => assign(t)}
                              >
                                Отправить в путь
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)]"
                              onClick={() => {
                                setPickId(t.ticket_id);
                                const preferred =
                                  FIELD_CREWS.find((c) => c.name === t.assigned_group)?.id || FIELD_CREWS[0].id;
                                setCrewId(preferred);
                              }}
                            >
                              Назначить бригаду
                            </button>
                          )}
                        </div>
                      )}

                      {col.id === 'en_route' && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="rounded-md bg-[var(--oc-accent-soft)] px-2 py-1 text-[11px] font-medium text-[var(--oc-accent)]"
                            onClick={() => advance(t)}
                          >
                            На объекте
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)]"
                            onClick={() => recall(t)}
                          >
                            Снять
                          </button>
                        </div>
                      )}

                      {col.id === 'on_site' && (
                        <div className="mt-2 grid gap-1.5">
                          <VisitChecklist
                            ticket={t}
                            onChange={(next) =>
                              patchTicket(t.ticket_id, { visit_checklist: next })
                            }
                          />
                          <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            disabled={!visitChecklistDone(t.visit_checklist)}
                            className="rounded-md bg-[var(--status-success-soft)] px-2 py-1 text-[11px] font-medium text-[var(--status-success)] disabled:opacity-40"
                            onClick={() => advance(t)}
                          >
                            Выезд выполнен
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)]"
                            onClick={() => recall(t)}
                          >
                            Снять
                          </button>
                          </div>
                        </div>
                      )}
                      {col.id === 'done' && visitShowsChecklist(visitOf(t)) && !visitChecklistDone(t.visit_checklist) && (
                        <div className="mt-2">
                          <VisitChecklist
                            ticket={t}
                            onChange={(next) =>
                              patchTicket(t.ticket_id, { visit_checklist: next })
                            }
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
