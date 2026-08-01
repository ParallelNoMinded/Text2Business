import React, { useState } from 'react';
import { SCENARIO_PRESETS } from '../scenarios';
import { ProcessingResult } from '../types';
import { Play, CheckCircle2, XCircle, ShieldCheck, Zap } from 'lucide-react';

interface TestSuiteViewProps {
  onRunBatchTests: () => Promise<Array<{ presetId: string; result: ProcessingResult; passed: boolean; message: string; durationMs: number }>>;
  theme?: 'dark' | 'light';
}

export const TestSuiteView: React.FC<TestSuiteViewProps> = ({ onRunBatchTests, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [testResults, setTestResults] = useState<
    Array<{ presetId: string; result: ProcessingResult; passed: boolean; message: string; durationMs: number }>
  >([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAll = async () => {
    setIsRunning(true);
    try {
      const results = await onRunBatchTests();
      setTestResults(results);
    } catch (err) {
      console.error('Batch test suite error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const passCount = testResults.filter((r) => r.passed).length;
  const failCount = testResults.length - passCount;

  return (
    <div id="test-suite-page" className="space-y-4">
      {/* Header Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#06060e]/90 border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white'
            : 'bg-white border-slate-300 shadow-sm text-slate-900'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
            <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
              Тестовая Матрица
            </h2>
          </div>
          <p className={`text-xs mt-0.5 font-sans ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
            Пакетная верификация всех 4 сценариев на точность привязки, SLA дедлайны и Guardrail защиту.
          </p>
        </div>

        <button
          id="run-all-tests-btn"
          type="button"
          onClick={handleRunAll}
          disabled={isRunning}
          className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-mono font-extrabold text-xs uppercase tracking-wider transition ${
            isRunning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-white/10'
              : isDark
              ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] border border-cyan-200'
              : 'bg-blue-900 hover:bg-blue-950 text-white shadow-blue-900/20'
          }`}
        >
          {isRunning ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Выполнение тестов...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>ЗАПУСТИТЬ ТЕСТЫ</span>
            </>
          )}
        </button>
      </div>

      {/* Benchmark Summary Bar */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div
            className={`rounded-xl p-4 flex items-center space-x-3 border ${
              isDark
                ? 'bg-[#06060e]/90 border-cyan-500/20 text-white'
                : 'bg-white border-slate-300 text-slate-900 shadow-sm'
            }`}
          >
            <CheckCircle2 className={`h-6 w-6 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
            <div>
              <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Успешные Тесты</span>
              <p className={`text-lg font-extrabold font-mono ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>{passCount} / {testResults.length} Pass</p>
            </div>
          </div>

          <div
            className={`rounded-xl p-4 flex items-center space-x-3 border ${
              isDark
                ? 'bg-[#06060e]/90 border-rose-500/30 text-white'
                : 'bg-white border-rose-300 text-slate-900 shadow-sm'
            }`}
          >
            <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            <div>
              <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Ошибки</span>
              <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 font-mono">{failCount} Fail</p>
            </div>
          </div>

          <div
            className={`rounded-xl p-4 flex items-center space-x-3 border ${
              isDark
                ? 'bg-[#06060e]/90 border-amber-500/30 text-white'
                : 'bg-white border-amber-300 text-slate-900 shadow-sm'
            }`}
          >
            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <div>
              <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Средняя Скорость</span>
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {Math.round(testResults.reduce((acc, curr) => acc + curr.durationMs, 0) / testResults.length)} ms / req
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preset Evaluation Grid */}
      <div className="space-y-3">
        {SCENARIO_PRESETS.map((preset) => {
          const evalRes = testResults.find((r) => r.presetId === preset.id);

          return (
            <div
              key={preset.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all space-y-3 ${
                isDark
                  ? 'bg-[#06060e]/90 border-cyan-500/20 text-white shadow-md'
                  : 'bg-white border-slate-300 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/30 pb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded border ${
                      isDark
                        ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                        : 'text-blue-950 bg-blue-100 border-blue-300'
                    }`}
                  >
                    {preset.code}
                  </span>
                  <h3 className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{preset.title}</h3>
                </div>

                {evalRes ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-extrabold border ${
                      evalRes.passed
                        ? isDark
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                          : 'bg-blue-100 text-blue-950 border-blue-400 font-extrabold'
                        : isDark
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                        : 'bg-rose-100 text-rose-950 border-rose-400 font-extrabold'
                    }`}
                  >
                    {evalRes.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {evalRes.passed ? 'УСПЕХ (100% СОВПАДЕНИЕ)' : 'ОШИБКА'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">Ожидание первого прогона</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div
                  className={`p-3 rounded-xl border shadow-inner ${
                    isDark ? 'bg-[#020204]/90 border-cyan-500/20' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold uppercase block mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
                    Входящий Текст
                  </span>
                  <p className={`line-clamp-2 italic font-sans ${isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>"{preset.raw_text}"</p>
                </div>

                <div
                  className={`p-3 rounded-xl border shadow-inner ${
                    isDark ? 'bg-[#020204]/90 border-cyan-500/20' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold uppercase block mb-1 ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
                    Ожидаемый Результат
                  </span>
                  <p className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>{preset.expected_outcome}</p>
                </div>
              </div>

              {evalRes && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                    isDark ? 'bg-[#020204]/90 border-cyan-500/20 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-900 font-medium'
                  }`}
                >
                  <span>{evalRes.message}</span>
                  <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>{evalRes.durationMs} ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
