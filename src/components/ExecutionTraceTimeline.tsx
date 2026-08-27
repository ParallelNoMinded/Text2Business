import React, { useState } from 'react';
import { TraceStep } from '../types';
import { StatusBadge, StatusTone } from './ui/StatusBadge';
import { redactSafeMeta } from '../opsDashboard';

interface ExecutionTraceTimelineProps {
  trace: TraceStep[];
  running?: boolean;
  theme?: 'dark' | 'light';
}

const PIPELINE: { key: string; label: string }[] = [
  { key: '01_guardrails', label: 'Защитные правила' },
  { key: '02_fact', label: 'Извлечение фактов' },
  { key: '03_customer', label: 'Поиск клиента' },
  { key: '04_assets', label: 'Поиск оборудования' },
  { key: '05_contract', label: 'Расчёт SLA' },
  { key: '06_decision', label: 'Движок решений' },
  { key: '07_execution', label: 'Исполнение' },
];

function findByIndex(trace: TraceStep[], i: number): TraceStep | undefined {
  const patterns = [
    /guardrail/i,
    /fact/i,
    /customer|site/i,
    /asset/i,
    /contract|sla/i,
    /decision/i,
    /dry_run|execution/i,
  ];
  return trace.find((s) => patterns[i].test(s.step_name)) || trace[i];
}

function toUiStatus(
  step: TraceStep | undefined,
  running: boolean,
  hasTrace: boolean
): { tone: StatusTone; label: string } {
  if (!step) {
    if (running && !hasTrace) return { tone: 'info', label: 'ИДЁТ' };
    return { tone: 'neutral', label: 'ОЖИДАНИЕ' };
  }
  if (step.status === 'ERROR') return { tone: 'danger', label: 'ОШИБКА' };
  if (step.status === 'WARNING') return { tone: 'warning', label: 'ОЖИДАНИЕ' };
  if (step.status === 'INFO') return { tone: 'info', label: 'ИДЁТ' };
  return { tone: 'success', label: 'ГОТОВО' };
}

export const ExecutionTraceTimeline: React.FC<ExecutionTraceTimelineProps> = ({
  trace,
  running = false,
}) => {
  const [open, setOpen] = useState<string | null>(null);
  const total = (trace || []).reduce((a, s) => a + (s.duration_ms || 0), 0);

  return (
    <section id="execution-trace-panel" className="oc-card" aria-label="Трасса выполнения">
      <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
        <h2 className="oc-section-title">Пайплайн</h2>
        <span className="font-mono text-[11px] text-[var(--oc-muted)]">{total} ms</span>
      </div>
      <ol className="px-3 py-2">
        {PIPELINE.map((row, i) => {
          const step = findByIndex(trace || [], i);
          const ui = toUiStatus(step, running, Boolean(trace?.length));
          const isOpen = open === row.key;
          return (
            <li key={row.key} className="border-b border-[var(--oc-border)] last:border-0">
              <button
                type="button"
                onClick={() => step && setOpen(isOpen ? null : row.key)}
                className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-left hover:bg-[var(--oc-surface-2)]"
              >
                {i > 0 && (
                  <span className="hidden w-3 text-[10px] text-[var(--oc-muted)] sm:inline" aria-hidden="true">
                    →
                  </span>
                )}
                <span className="min-w-[8rem] shrink-0 text-[11px]">{row.label}</span>
                <StatusBadge tone={ui.tone} label={ui.label} />
                <span className="ml-auto font-mono text-[11px] text-[var(--oc-muted)]">
                  {step ? `${step.duration_ms} ms` : '—'}
                </span>
                <span className="w-20 text-right font-mono text-[10px] text-[var(--oc-muted)]">
                  {step?.timestamp || '—'}
                </span>
              </button>
              {isOpen && step && (
                <pre className="mb-2 max-h-32 overflow-auto rounded bg-[var(--oc-bg)] p-2 font-mono text-[10px] text-[var(--oc-muted)]">
                  {JSON.stringify(redactSafeMeta(step.details || {}), null, 2)}
                </pre>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
