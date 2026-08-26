import React, { useState } from 'react';
import { TraceStep } from '../types';
import { Terminal, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';

interface ExecutionTraceTimelineProps {
  trace: TraceStep[];
  theme?: 'dark' | 'light';
}

export const ExecutionTraceTimeline: React.FC<ExecutionTraceTimelineProps> = ({
  trace,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  if (!trace || trace.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalDuration = trace.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);

  return (
    <div
      id="execution-trace-panel"
      className={`rounded-xl p-5 sm:p-6 border transition-all ${
        isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'
      }`}
    >
      {/* Header Bar */}
      <div className={`flex items-center justify-between pb-4 border-b mb-4 ${isDark ? 'border-slate-700' : 'border-[#e0e0e0]'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D7A7A]/15 text-[#2D7A7A]">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">Трассировка исполнения</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
              Пошаговый пайплайн валидации и обработки
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-[#2D7A7A] px-2.5 py-1 rounded-lg bg-[#2D7A7A]/10">
            {trace.length} шагов • {totalDuration} мс
          </span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-2.5">
        {trace.map((step, idx) => {
          const isExpanded = !!expandedIds[step.id];
          const isSuccess = step.status === 'SUCCESS';
          const isWarning = step.status === 'WARNING';

          return (
            <div
              key={step.id || idx}
              className={`border rounded-xl overflow-hidden transition ${
                isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-[#fafafa]'
              }`}
            >
              {/* Step Summary Bar */}
              <button
                type="button"
                onClick={() => toggleExpand(step.id)}
                className={`w-full text-left p-3.5 flex items-center justify-between transition ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {isWarning && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    {!isSuccess && !isWarning && <Clock className="h-4 w-4 text-[#2D7A7A]" />}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                      {step.step_name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {step.timestamp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-400">
                    {step.duration_ms} мс
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Details Expandable Box */}
              {isExpanded && step.details && (
                <div className={`p-3 border-t text-xs font-mono whitespace-pre-wrap leading-relaxed ${
                  isDark ? 'border-slate-700 bg-[#141224] text-slate-300' : 'border-[#e0e0e0] bg-white text-slate-800'
                }`}>
                  {typeof step.details === 'string' ? step.details : JSON.stringify(step.details, null, 2)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
