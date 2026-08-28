import React from 'react';
import { Ticket } from '../types';
import { VISIT_CHECK_ITEMS, visitChecklistDone, toggleVisitCheck } from '../fieldCrews';

interface VisitChecklistProps {
  ticket: Ticket;
  onChange: (next: string[]) => void;
}

export const VisitChecklist: React.FC<VisitChecklistProps> = ({ ticket, onChange }) => {
  const checked = ticket.visit_checklist || [];
  const done = visitChecklistDone(checked);
  const n = checked.filter((id) => VISIT_CHECK_ITEMS.some((item) => item.id === id)).length;

  return (
    <div className="grid gap-1">
      <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">
        Чек-лист выезда · {n}/{VISIT_CHECK_ITEMS.length}
      </p>
      {VISIT_CHECK_ITEMS.map((item) => {
        const on = checked.includes(item.id);
        return (
          <label key={item.id} className="flex cursor-pointer items-start gap-2 text-[12px] leading-snug">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={on}
              onChange={() => onChange(toggleVisitCheck(checked, item.id))}
            />
            <span>{item.label}</span>
          </label>
        );
      })}
      {!done && (
        <p className="text-[11px] text-[var(--status-warning)]">Пока не закрыть выезд и заявку.</p>
      )}
    </div>
  );
};
