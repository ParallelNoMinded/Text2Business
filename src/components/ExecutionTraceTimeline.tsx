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

  if (!trace || trace.length === 0) {
    return (
      <div
        className={`rounded-2xl p-5 text-center text-xs font-mono border transition-all ${
          isDark
            ? 'bg-[#06060e]/80 border-cyan-500/20 text-slate-500'
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
          ? 'bg-[#06060e]/90 border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white'
          : 'bg-white border-slate-300 shadow-sm text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
        <div className="flex items-center space-x-2">
          <Terminal className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
          <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            3. Трассировка выполнения
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Шагов: {trace.length}</span>
          <span
            className={`px-2.5 py-0.5 rounded-md font-extrabold border ${
              isDark
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                : 'bg-blue-50 text-blue-950 border-blue-200'
            }`}
          >
            Общая задержка: {totalDuration} мс
          </span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-2 font-mono">
        {trace.map((step, idx) => {
          const isExpanded = !!expandedIds[step.id];
          const isSuccess = step.status === 'SUCCESS';
          const isWarning = step.status === 'WARNING';

          return (
            <div
              key={step.id || idx}
              className={`border rounded-xl overflow-hidden transition-all shadow-inner ${
                isDark
                  ? 'bg-[#020204]/90 border-cyan-500/20'
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
                    {isSuccess && <CheckCircle2 className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />}
                    {isWarning && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    {!isSuccess && !isWarning && (
                      <Clock className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
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
                        ? 'text-cyan-300 bg-[#080810] border-white/10'
                        : 'text-blue-950 bg-white border-slate-300'
                    }`}
                  >
                    {step.duration_ms} ms
                  </span>
                  {isExpanded ? (
                    <ChevronDown className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
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
                      ? 'bg-[#05050c] border-cyan-500/20 text-cyan-300/90'
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
    </div>
  );
};
