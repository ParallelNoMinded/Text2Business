import React, { useState } from 'react';
import { TraceStep } from '../types';
import { Terminal, ChevronDown, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExecutionTraceTimelineProps {
  trace: TraceStep[];
  theme?: 'dark' | 'light';
}

export const ExecutionTraceTimeline: React.FC<ExecutionTraceTimelineProps> = ({
  trace,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);

  if (!trace || trace.length === 0) {
    return (
      <div
        className={`rounded-2xl p-5 text-center text-xs font-mono border transition-all ${
          isDark
            ? 'bg-[#1A1D22] border-[#2C3139] text-slate-500'
            : 'bg-white border-slate-300 text-slate-700 font-semibold shadow-sm'
        }`}
      >
        // Трассировка появится после выполнения вызова пайплайна...
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalDuration = trace.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);

  return (
    <div
      id="execution-trace-panel"
      className={`rounded-2xl p-4 sm:p-5 transition-all border space-y-4 ${
        isDark
          ? 'bg-[#1A1D22] border-[#2C3139]  text-white'
          : 'bg-white border-slate-300 shadow-sm text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Terminal className={`h-4 w-4 ${isDark ? 'text-[#52525B]' : 'text-zinc-800'}`} />
          <h2 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-900'}`}>
            Трассировка
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
            isDark
              ? 'border-[#3A404A] text-zinc-300 hover:bg-white/5'
              : 'border-[#E6E8EC] text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          {open ? 'Скрыть' : 'Показать'} · {trace.length} шагов · {totalDuration} мс
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
      <div className="space-y-2 font-mono animate-fadeIn">
        {trace.map((step, idx) => {
          const isExpanded = !!expandedIds[step.id];
          const isSuccess = step.status === 'SUCCESS';
          const isWarning = step.status === 'WARNING';

          return (
            <div
              key={step.id || idx}
              className={`border rounded-2xl overflow-hidden transition-all shadow-inner ${
                isDark
                  ? 'bg-[#121417] border-[#2C3139]'
                  : 'bg-slate-50 border-slate-300'
              }`}
            >
              {/* Step Summary Bar */}
              <button
                type="button"
                onClick={() => toggleExpand(step.id)}
                className={`w-full text-left p-3 flex items-center justify-between transition ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {isSuccess && <CheckCircle2 className={`h-4 w-4 ${isDark ? 'text-[#52525B]' : 'text-zinc-800'}`} />}
                    {isWarning && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    {!isSuccess && !isWarning && (
                      <Clock className={`h-4 w-4 ${isDark ? 'text-[#52525B]' : 'text-zinc-800'}`} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        [{step.step_name}]
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {step.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded border font-extrabold ${
                      isDark
                        ? 'text-zinc-200 bg-[#121417] border-white/10'
                        : 'text-zinc-900 bg-white border-slate-300'
                    }`}
                  >
                    {step.duration_ms} ms
                  </span>
                  {isExpanded ? (
                    <ChevronDown className={`h-4 w-4 ${isDark ? 'text-[#52525B]' : 'text-zinc-800'}`} />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Step Expanded Details */}
              {isExpanded && (
                <div
                  className={`p-3 border-t text-xs font-mono overflow-x-auto ${
                    isDark
                      ? 'bg-[#05050c] border-[#2C3139] text-zinc-200/90'
                      : 'bg-white border-slate-300 text-slate-900 font-medium'
                  }`}
                >
                  <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
