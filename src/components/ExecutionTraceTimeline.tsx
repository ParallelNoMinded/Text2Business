import React, { useState } from 'react';
import { TraceStep } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ExecutionTraceTimelineProps {
  trace: TraceStep[];
  theme?: 'dark' | 'light';
}

export const ExecutionTraceTimeline: React.FC<ExecutionTraceTimelineProps> = ({ trace }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  if (!trace || trace.length === 0) {
    return (
      <div className="sheet p-5">
        <div className="border border-dashed border-rule p-5 text-center font-mono text-xs leading-relaxed text-ink-3">
          Ход обработки появится здесь после первого обращения.
        </div>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalDuration = trace.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);
  const maxDuration = Math.max(...trace.map((s) => s.duration_ms || 0), 1);

  return (
    <div id="execution-trace-panel" className="sheet p-4 sm:p-5">
      {/* Графа-заголовок */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
        <h2 className="text-lg font-bold text-ink">
          <span className="text-ink-3">3 · </span>Ход обработки
        </h2>
        <div className="flex items-baseline gap-4 font-mono text-xs text-ink-3">
          <span>
            шагов <span className="tabular-nums text-ink-2">{trace.length}</span>
          </span>
          <span>
            всего <span className="tabular-nums text-ink-2">{totalDuration} мс</span>
          </span>
        </div>
      </div>

      {/* Перечень шагов */}
      <ol className="font-mono">
        {trace.map((step, idx) => {
          const isExpanded = !!expandedIds[step.id];
          const isWarning = step.status === 'WARNING';
          const share = Math.round(((step.duration_ms || 0) / maxDuration) * 100);

          return (
            <li key={step.id || idx} className="border-b border-rule last:border-b-0">
              <button
                type="button"
                onClick={() => toggleExpand(step.id)}
                aria-expanded={isExpanded}
                className="group flex w-full items-baseline gap-3 py-2.5 text-left transition hover:bg-panel-2"
              >
                <span className="w-5 shrink-0 tabular-nums text-[11px] text-ink-3">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={`truncate text-sm ${isWarning ? 'text-attention' : 'text-ink-2'}`}>
                      {step.step_name}
                    </span>
                    {isWarning && (
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-attention">
                        внимание
                      </span>
                    )}
                    <span className="shrink-0 text-[10px] text-ink-3">{step.timestamp}</span>
                  </span>
                  {/* Полоса длительности — читается как отметка в графе */}
                  <span className="mt-1.5 block h-px w-full bg-rule">
                    <span
                      className={`block h-px ${isWarning ? 'bg-attention' : 'bg-accent-soft'}`}
                      style={{ width: `${share}%` }}
                    />
                  </span>
                </span>

                <span className="shrink-0 tabular-nums text-[11px] text-ink-3">
                  {step.duration_ms} мс
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 self-center text-ink-2" aria-hidden="true" />
                ) : (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 self-center text-ink-3 group-hover:text-ink-2"
                    aria-hidden="true"
                  />
                )}
              </button>

              {isExpanded && (
                <div className="overflow-x-auto border-t border-dashed border-rule bg-panel-2 px-3 py-2.5 pl-8">
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink-2">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
