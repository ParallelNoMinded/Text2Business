import React from 'react';
import { DatabaseSchema } from '../mockDb';
import { PageSection } from './layout/PageSection';
import { StatusBadge } from './ui/StatusBadge';
import { customerName, formatSla, slaBucket } from '../opsDashboard';
import { ruPriority, ruTicketStatus } from '../uiRu';

interface WorkSlaViewProps {
  db: DatabaseSchema | null;
}

const SLA_TONE = {
  on_time: { tone: 'success' as const, label: 'В СРОК' },
  at_risk: { tone: 'warning' as const, label: 'РИСК' },
  breached: { tone: 'danger' as const, label: 'ПРОСРОЧЕНО' },
};

export const WorkSlaView: React.FC<WorkSlaViewProps> = ({ db }) => {
  if (!db) {
    return <p className="text-[11px] text-[var(--oc-muted)]">Загрузка SLA…</p>;
  }

  const tickets = [...db.open_tickets].sort(
    (a, b) => new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime()
  );

  return (
    <div className="grid gap-3">
      <PageSection
        title="SLA"
        description="Дедлайны открытых заявок."
      />
      <section className="oc-card overflow-hidden">
        <div className="table-scroll">
          <table className="oc-table oc-table-stack">
            <thead>
              <tr>
                <th>Заявка</th>
                <th>Клиент</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Остаток</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-[var(--oc-muted)]">
                    Нет открытых заявок.
                  </td>
                </tr>
              )}
              {tickets.map((t) => {
                const bucket = slaBucket(t.sla_deadline);
                return (
                  <tr key={t.ticket_id}>
                    <td className="font-mono text-[11px]" data-label="Заявка">{t.ticket_id}</td>
                    <td data-label="Клиент">{customerName(db, t.customer_id)}</td>
                    <td data-label="Приоритет">{ruPriority(t.priority)}</td>
                    <td data-label="Статус">{ruTicketStatus(t.status)}</td>
                    <td className="tabular-nums" data-label="Остаток">{formatSla(t.sla_deadline)}</td>
                    <td data-label="SLA">
                      <StatusBadge tone={SLA_TONE[bucket].tone} label={SLA_TONE[bucket].label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
