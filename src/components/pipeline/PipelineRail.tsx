import React from 'react';
import { StatusBadge, StatusTone } from '../ui/StatusBadge';
import { ProcessingResult } from '../../types';

const STAGES = [
  'Входящее',
  'Факты',
  'Клиент',
  'Оборудование',
  'Заявки',
  'SLA',
  'Решение',
  'Подтверждение',
  'Исполнение',
] as const;

function stageTone(
  index: number,
  result: ProcessingResult | null,
  running: boolean
): { tone: StatusTone; label: string } {
  if (running && !result) {
    if (index === 0) return { tone: 'info', label: 'ИДЁТ' };
    return { tone: 'neutral', label: 'ОЖИДАНИЕ' };
  }
  if (!result) {
    if (index === 0) return { tone: 'info', label: 'ГОТОВО' };
    return { tone: 'neutral', label: 'ОЖИДАНИЕ' };
  }
  if (result.status === 'BLOCKED' && index >= 6) return { tone: 'danger', label: 'ОШИБКА' };
  if (index <= 6) return { tone: 'success', label: 'ГОТОВО' };
  if (index === 7) {
    if (result.status === 'REQUIRES_HUMAN_CONFIRMATION') return { tone: 'warning', label: 'ОЖИДАНИЕ' };
    if (result.status === 'AUTO_APPROVED') return { tone: 'success', label: 'ГОТОВО' };
    return { tone: 'danger', label: 'ОШИБКА' };
  }
  return result.is_dry_run
    ? { tone: 'warning', label: 'ОЖИДАНИЕ' }
    : { tone: 'success', label: 'ГОТОВО' };
}

interface PipelineRailProps {
  result: ProcessingResult | null;
  running: boolean;
}

export const PipelineRail: React.FC<PipelineRailProps> = ({ result, running }) => {
  return (
    <ol className="oc-card flex flex-wrap items-center gap-1 px-2 py-1.5" aria-label="Пайплайн">
      {STAGES.map((name, i) => {
        const st = stageTone(i, result, running);
        return (
          <li key={name} className="flex items-center gap-1">
            {i > 0 && (
              <span className="px-0.5 text-[10px] text-[var(--oc-muted)]" aria-hidden="true">
                →
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">{name}</span>
            <StatusBadge tone={st.tone} label={st.label} />
          </li>
        );
      })}
    </ol>
  );
};
